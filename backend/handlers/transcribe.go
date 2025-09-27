package handlers

import (
	"log"
	"net/http"
	"os"

	"vox-backend/services"

	"github.com/gin-gonic/gin"
)

// TranscribeHandler 是处理语音转写请求的 Gin 处理器
func TranscribeHandler(aiService services.AIService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 接收前端上传的音频文件
		file, err := c.FormFile("audio")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Audio file not provided"})
			return
		}

		// 将文件保存到临时路径
		tempFilePath := "temp_audio.mp3" // 或使用更复杂的临时文件名
		if err := c.SaveUploadedFile(file, tempFilePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}
		defer os.Remove(tempFilePath) // 处理完后删除临时文件

		// 调用 AI 服务进行转写
		transcribedText, err := aiService.Transcribe(c.Request.Context(), tempFilePath)
		if err != nil {
			log.Printf("Transcription error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to transcribe audio"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"transcribed_text": transcribedText})
	}
}
