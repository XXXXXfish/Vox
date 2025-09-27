// handlers/transcribe.go

package handlers

import (
	"log"
	"net/http"

	"vox-backend/services"

	"github.com/gin-gonic/gin"
)

// TranscribeRequest 定义了转录请求的 JSON 结构
type TranscribeRequest struct {
	AudioUrl    string `json:"audio_url" binding:"required"`    // 音频文件的公网 URL
	AudioFormat string `json:"audio_format" binding:"required"` // 音频格式 (如 mp3, wav)
}

// TranscribeHandler 处理 POST /api/v1/transcribe 请求 (现在接收 JSON)
func TranscribeHandler(aiService services.AIService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req TranscribeRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload (Requires audio_url and audio_format)."})
			return
		}

		// 1. 调用 AI 服务进行转写
		transcribedText, err := aiService.Transcribe(
			c.Request.Context(),
			req.AudioUrl,
			req.AudioFormat,
		)
		if err != nil {
			log.Printf("ASR Transcription error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to transcribe audio: " + err.Error()})
			return
		}

		// 2. 返回转写后的文本
		c.JSON(http.StatusOK, gin.H{"transcribed_text": transcribedText})
	}
}
