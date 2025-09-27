package handlers

import (
	"log"
	"net/http"

	"vox-backend/services"

	"github.com/gin-gonic/gin"
)

// ChatRequest 定义了聊天请求的 JSON 结构
type ChatRequest struct {
	Messages []string `json:"messages" binding:"required"`
}

// ChatHandler 是处理聊天请求的 Gin 处理器
func ChatHandler(aiService services.AIService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req ChatRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
			return
		}

		response, err := aiService.Chat(c.Request.Context(), req.Messages)
		if err != nil {
			log.Printf("Chat error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get AI response"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"response": response})
	}
}
