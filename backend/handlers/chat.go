// handlers/chat.go (更新 ChatRequest 结构体)

package handlers

import (
	"log"
	"net/http"

	"vox-backend/models"
	"vox-backend/services"

	"github.com/gin-gonic/gin"
	openai "github.com/sashabaranov/go-openai"
	"gorm.io/gorm"
)

// ChatRequest 定义了聊天请求的 JSON 结构
type ChatRequest struct {
	// UserID 字段被移除，现在从 JWT Token 中获取
	CharacterID uint   `json:"character_id" binding:"required"`
	NewMessage  string `json:"new_message" binding:"required"`
}

// ChatHandler 负责处理聊天请求、管理会话历史和调用 AI 服务。
func ChatHandler(db *gorm.DB, aiService services.AIService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req ChatRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
			return
		}

		// **【关键修改】从 Context 获取 UserID**
		rawUserID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "User context not found"}) // 不应发生
			return
		}
		userID := rawUserID.(uint) // 类型断言为 uint
		charID := req.CharacterID

		// --- B. 从数据库加载角色设定 ---
		var character models.Character
		if err := db.First(&character, charID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Character not found"})
				return
			}
			log.Printf("Database error loading character: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load character data"})
			return
		}

		// --- C. 从数据库加载历史聊天记录 (使用 UserID 和 CharacterID 组合查询) ---
		var chatRecords []models.ChatRecord
		// 查询条件变为：WHERE user_id = ? AND character_id = ?
		db.Where("user_id = ? AND character_id = ?", userID, charID).
			Order("created_at asc").
			Find(&chatRecords) // 即使没有记录，这里也不会报错，chatRecords 为空

		// --- D. 构造 LLM 消息历史 ---
		// 1. 包含历史记录
		chatHistory := make([]services.Message, 0, len(chatRecords)*2+1) // 预估容量
		for _, record := range chatRecords {
			// 历史记录中的每一条 ChatRecord 包含用户和 AI 的两条消息
			chatHistory = append(chatHistory, services.Message{
				Role:    openai.ChatMessageRoleUser,
				Content: record.UserMessage,
			})
			chatHistory = append(chatHistory, services.Message{
				Role:    openai.ChatMessageRoleAssistant,
				Content: record.AIMessage,
			})
		}

		// 2. 添加用户当前的新消息
		chatHistory = append(chatHistory, services.Message{
			Role:    openai.ChatMessageRoleUser,
			Content: req.NewMessage,
		})

		// --- E. 调用 AI 服务 ---
		response, err := aiService.Chat(
			c.Request.Context(),
			character.SystemPrompt,
			chatHistory, // 传递完整的历史记录
		)

		if err != nil {
			log.Printf("AI Chat error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get AI response: " + err.Error()})
			return
		}

		// --- F. 保存新的聊天记录 (持久化) ---
		newRecord := models.ChatRecord{
			CharacterID: charID,
			UserID:      userID, // 确保保存 UserID
			UserMessage: req.NewMessage,
			AIMessage:   response,
			// GORM 会自动填充 CreatedAt, UpdatedAt
		}

		if err := db.Create(&newRecord).Error; err != nil {
			log.Printf("Database error saving chat record: %v", err)
			// 记录失败不影响用户体验，只需打印日志
		}

		// --- G. 返回结果 ---
		c.JSON(http.StatusOK, gin.H{
			// **【关键修改】不再返回 SessionID**
			"response": response,
		})
	}
}
