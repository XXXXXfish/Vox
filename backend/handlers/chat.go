// handlers/chat.go (更新 ChatRequest 结构体)

package handlers

import (
	// ... (确保导入了 log, net/http, time, uuid) ...
	"log"
	"net/http"

	"vox-backend/models"
	"vox-backend/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid" // 用于生成唯一的 SessionID
	openai "github.com/sashabaranov/go-openai"
	"gorm.io/gorm"
)

// ChatRequest 定义了聊天请求的 JSON 结构
type ChatRequest struct {
	CharacterID uint   `json:"character_id" binding:"required"`
	NewMessage  string `json:"new_message" binding:"required"`
	// 新增：会话ID。如果为空，则表示开始新会话。
	SessionID string `json:"session_id"`
}

// ChatHandler 负责处理聊天请求、管理会话历史和调用 AI 服务。
func ChatHandler(db *gorm.DB, aiService services.AIService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req ChatRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
			return
		}

		// --- A. 确定会话 ID (Session Management) ---
		sessionID := req.SessionID
		if sessionID == "" {
			// 如果 SessionID 为空，生成一个新的 UUID 作为会话 ID
			sessionID = uuid.New().String()
		}

		// --- B. 从数据库加载角色设定 ---
		var character models.Character
		if err := db.First(&character, req.CharacterID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Character not found"})
				return
			}
			log.Printf("Database error loading character: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load character data"})
			return
		}

		// --- C. 加载历史聊天记录 ---
		var chatRecords []models.ChatRecord
		// 按创建时间升序排列，以便按正确的顺序构造历史记录
		db.Where("session_id = ? AND character_id = ?", sessionID, req.CharacterID).
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
			CharacterID: req.CharacterID,
			SessionID:   sessionID,
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
			"session_id": sessionID, // 确保返回 SessionID，供前端下次使用
			"response":   response,
		})
	}
}
