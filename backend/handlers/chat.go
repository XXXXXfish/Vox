// handlers/chat.go

package handlers

import (
	"log"
	"net/http"

	"vox-backend/models"
	"vox-backend/services" // 需要用到 services.AIService 和 services.Message 结构体

	"github.com/gin-gonic/gin"
	openai "github.com/sashabaranov/go-openai" // 用于定义用户消息的角色
	"gorm.io/gorm"
)

// ChatRequest 定义了聊天请求的 JSON 结构
type ChatRequest struct {
	CharacterID uint   `json:"character_id" binding:"required"` // 新增：要聊天的角色 ID
	NewMessage  string `json:"new_message" binding:"required"`  // 新增：用户当前发送的消息
	// Note: 聊天历史将在步骤 3.1 数据库持久化后再从 DB 加载，此处简化
}

// ChatHandler 是处理聊天请求的 Gin 处理器。
// 它依赖于数据库 (db) 来查找角色设定，并依赖 AI 服务 (aiService) 来生成回复。
func ChatHandler(db *gorm.DB, aiService services.AIService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req ChatRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
			return
		}

		// --- A. 从数据库加载角色设定 ---
		var character models.Character
		// 根据 CharacterID 查询数据库
		if err := db.First(&character, req.CharacterID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Character not found"})
				return
			}
			log.Printf("Database error loading character: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load character data"})
			return
		}

		// --- B. 构造聊天历史 (简化版) ---
		// 由于我们还没有实现步骤 3.1 (历史记录持久化)，此处只包含用户当前的输入。
		chatHistory := []services.Message{
			{
				Role:    openai.ChatMessageRoleUser, // 使用 OpenAI SDK 的常量，因为它与七牛云兼容
				Content: req.NewMessage,
			},
		}

		// --- C. 调用 AI 服务 (已修复参数问题) ---
		response, err := aiService.Chat(
			c.Request.Context(),
			character.SystemPrompt, // 第一个新参数：System Prompt
			chatHistory,            // 第二个新参数：聊天历史
		)

		if err != nil {
			log.Printf("AI Chat error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get AI response: " + err.Error()})
			return
		}

		// --- D. 返回结果 ---
		c.JSON(http.StatusOK, gin.H{"response": response})
	}
}
