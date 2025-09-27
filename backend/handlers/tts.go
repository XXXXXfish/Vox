// handlers/tts.go

package handlers

import (
	"log"
	"net/http"

	"vox-backend/services"

	"github.com/gin-gonic/gin"
)

// TTSRequest 定义了 TTS 请求的 JSON 结构
type TTSRequest struct {
	Text    string `json:"text" binding:"required"` // 需要合成的文本
	VoiceId string `json:"voice_id"`                // 可选：音色 ID (如果为空，服务层应使用默认音色)
}

// TTSHandler 处理 POST /api/v1/tts 请求
func TTSHandler(aiService services.AIService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req TTSRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload (Requires 'text')."})
			return
		}

		// 1. 调用 AI 服务进行语音合成
		// 默认音色，如果前端没有提供，可以根据文档设置七牛云的默认音色ID
		voiceId := req.VoiceId
		if voiceId == "" {
			// **TODO: 替换为七牛云默认的音色 ID**
			voiceId = "qiniu_zh_female_tmjxxy"
		}

		audioData, err := aiService.TextToSpeech(
			c.Request.Context(),
			req.Text,
			voiceId,
		)
		if err != nil {
			log.Printf("TTS error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to synthesize speech: " + err.Error()})
			return
		}

		// 2. 将音频数据写入响应 (关键步骤：设置正确的 Header)
		// 假设我们请求的是 MP3 格式
		c.Data(http.StatusOK, "audio/mpeg", audioData)
		// c.Header("Content-Disposition", "attachment; filename=speech.mp3") // 可选：如果希望作为文件下载
	}
}
