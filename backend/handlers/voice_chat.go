// handlers/voice_chat.go

package handlers

import (
	"context"
	"log"
	"net/http"
	"time"

	"vox-backend/models"
	"vox-backend/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	openai "github.com/sashabaranov/go-openai"
	"gorm.io/gorm"
)

// VoiceChatRequest 定义了语音聊天请求的 JSON 结构
type VoiceChatRequest struct {
	CharacterID uint   `json:"character_id" binding:"required"`
	SessionID   string `json:"session_id"` // 会话ID

	// ASR 输入参数
	AudioUrl    string `json:"audio_url" binding:"required"`    // 前端上传的音频公网 URL
	AudioFormat string `json:"audio_format" binding:"required"` // 音频格式 (如 mp3)

	// TTS 输入参数
	VoiceId string `json:"voice_id"` // 可选：AI回复使用的音色ID
}

// VoiceChatResponse 定义了返回给前端的结构
type VoiceChatResponse struct {
	SessionID       string `json:"session_id"`
	TranscribedText string `json:"transcribed_text"` // 用户的原始文本
	AITextResponse  string `json:"ai_text_response"` // AI的文本回复
	// Note: 语音数据将作为原始二进制流返回，不包含在 JSON 结构中
}

// VoiceChatHandler 处理端到端语音聊天请求
func VoiceChatHandler(db *gorm.DB, aiService services.AIService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req VoiceChatRequest
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

		// --- B. 确定会话 ID (Session Management) ---
		sessionID := req.SessionID
		if sessionID == "" {
			sessionID = uuid.New().String()
		}

		// --- C. 准备 LLM 输入 (加载历史 + 构造消息) ---
		var character models.Character
		if err := db.First(&character, req.CharacterID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Character not found"})
			return
		}

		// 加载历史记录 (逻辑与 ChatHandler 相同)
		var chatRecords []models.ChatRecord
		db.Where("session_id = ? AND character_id = ?", sessionID, req.CharacterID).
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
			CharacterID: req.CharacterID,
			SessionID:   sessionID,
			UserMessage: transcribedText,
			AIMessage:   aiTextResponse,
		}
		if err := db.Create(&newRecord).Error; err != nil {
			log.Printf("Database error saving chat record: %v", err)
		}

		// --- F. 语音合成 (TTS) ---
		voiceId := req.VoiceId
		if voiceId == "" {
			voiceId = "qiniu_zh_female_tmjxxy" // 默认音色
		}

		audioData, err := aiService.TextToSpeech(ctx, aiTextResponse, voiceId)
		if err != nil {
			log.Printf("TTS error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "TTS failed: " + err.Error()})
			return
		}
		log.Println("TTS SUCCESS: Audio synthesized.")

		// --- G. 最终响应 ---
		// 由于 Gin 只能返回一个 Content-Type，我们必须选择返回语音数据，
		// 而将文本数据通过 Header 或前端预期的 JSON 方式处理。

		// 最佳实践：对于语音交互，通常是先返回一个 JSON 响应，然后前端请求音频流。
		// 但为了简化，我们在这里直接返回音频流，并把文本数据通过 Header 传递（次优方案）。

		// 考虑到这个接口是 "Voice Chat"，我们优先返回音频流

		// 1. 设置文本数据 Header (供前端调试或显示)
		c.Header("X-Transcribed-Text", transcribedText)
		c.Header("X-AI-Text-Response", aiTextResponse)
		c.Header("X-Session-ID", sessionID)

		// 2. 返回音频流
		c.Data(http.StatusOK, "audio/mpeg", audioData)
		// Note: 前端接收到这个响应后，需要从 Header 读取文本，并将 body 作为音频播放。
	}
}
