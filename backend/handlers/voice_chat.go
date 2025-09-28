// handlers/voice_chat.go

package handlers

import (
	"context"
	"encoding/base64"
	"log"
	"net/http"
	"time"

	"vox-backend/models"
	"vox-backend/services"

	"github.com/gin-gonic/gin"
	openai "github.com/sashabaranov/go-openai"
	"gorm.io/gorm"
)

// VoiceChatRequest 定义了语音聊天请求的 JSON 结构
type VoiceChatRequest struct {
	CharacterID uint `json:"character_id" binding:"required"`
	// UserID 字段被移除，现在从 JWT Token 中获取

	// ASR 输入参数
	AudioUrl    string `json:"audio_url" binding:"required"`    // 前端上传的音频公网 URL
	AudioFormat string `json:"audio_format" binding:"required"` // 音频格式 (如 mp3)

	// TTS 输入参数
	VoiceId string `json:"voice_id"` // 可选：AI回复使用的音色ID
}

// VoiceChatResponse 定义了返回给前端的结构
type VoiceChatResponse struct {
	TranscribedText string `json:"transcribed_text"` // ASR 识别出的文本
	AiTextResponse  string `json:"ai_text_response"` // LLM 的回复文本
	AudioBase64     string `json:"audio_base64"`     // Base64 编码后的 MP3 数据
}

// VoiceChatHandler 处理端到端语音聊天请求
func VoiceChatHandler(db *gorm.DB, aiService services.AIService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req VoiceChatRequest // 使用新的、不包含 voice_id 的请求结构
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second) // 增加超时时间，应对多步操作
		defer cancel()

		// --- A. 语音转文本 (ASR) ---
		transcribedText, err := aiService.Transcribe(ctx, req.AudioUrl, req.AudioFormat)
		if err != nil {
			log.Printf("ASR error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ASR failed: " + err.Error()})
			return
		}
		log.Printf("ASR SUCCESS: Transcribed text: %s", transcribedText)

		// --- B. 从 Context 获取 UserID ---
		rawUserID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "User context not found"}) // 不应发生
			return
		}
		userID := rawUserID.(uint) // 类型断言为 uint
		charID := req.CharacterID

		// --- C. 准备 LLM 输入 (加载历史 + 构造消息) ---
		var character models.Character
		if err := db.First(&character, charID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Character not found"})
			return
		}

		// 加载历史记录 (使用 UserID 和 CharacterID)
		var chatRecords []models.ChatRecord
		db.Where("user_id = ? AND character_id = ?", userID, charID).
			Order("created_at asc").
			Find(&chatRecords)

		chatHistory := make([]services.Message, 0, len(chatRecords)*2+1)
		for _, record := range chatRecords {
			chatHistory = append(chatHistory, services.Message{Role: openai.ChatMessageRoleUser, Content: record.UserMessage})
			chatHistory = append(chatHistory, services.Message{Role: openai.ChatMessageRoleAssistant, Content: record.AIMessage})
		}
		chatHistory = append(chatHistory, services.Message{Role: openai.ChatMessageRoleUser, Content: transcribedText})

		// --- D. 文本生成 (LLM) ---
		aiTextResponse, err := aiService.Chat(ctx, character.SystemPrompt, chatHistory)
		if err != nil {
			log.Printf("LLM Chat error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "LLM failed: " + err.Error()})
			return
		}
		log.Printf("LLM SUCCESS: AI response: %s", aiTextResponse)

		// --- E. 保存新的聊天记录 (持久化) ---
		newRecord := models.ChatRecord{
			CharacterID: charID,
			UserID:      userID, // 确保保存 UserID
			UserMessage: transcribedText,
			AIMessage:   aiTextResponse,
		}
		if err := db.Create(&newRecord).Error; err != nil {
			log.Printf("Database error saving chat record: %v", err)
		}

		// --- F. 语音合成 (TTS) ---
		// 1. **加载角色信息**
		if result := db.First(&character, req.CharacterID); result.Error != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Character not found."})
			return
		}

		// 2. **获取最终音色 ID**
		finalVoiceID := character.VoiceID

		// 3. **Fallback 检查：强制使用角色音色，如果未设置则使用默认**
		if finalVoiceID == "" {
			// 这是硬编码的默认音色，用于防止角色创建者忘记设置音色
			finalVoiceID = "qiniu_zh_female_tmjxxy"
			log.Printf("角色 %d 未设置 VoiceID，使用默认音色: %s", character.ID, finalVoiceID)
		}

		audioData, err := aiService.TextToSpeech(ctx, aiTextResponse, finalVoiceID)
		if err != nil {
			log.Printf("TTS error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "TTS failed: " + err.Error()})
			return
		}
		log.Println("TTS SUCCESS: Audio synthesized.")

		// --- G. 最终响应 ---
		// 1. 进行 Base64 编码
		audioBase64String := base64.StdEncoding.EncodeToString(audioData)

		// 2. 构造 JSON 响应体
		response := VoiceChatResponse{
			TranscribedText: transcribedText,
			AiTextResponse:  aiTextResponse,
			AudioBase64:     audioBase64String,
		}

		// 3. 返回 JSON 响应 (状态码 200 OK，返回 Content-Type: application/json)
		c.JSON(http.StatusOK, response)
	}
}
