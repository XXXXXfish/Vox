package services

import "context"

// Message 结构体用于 LLM 对话的消息历史
type Message struct {
	Role    string // "user", "system", "assistant"
	Content string
}

// AIService 定义了 AI 服务的通用接口
type AIService interface {
	// Chat 生成聊天回复
	// characterPrompt: 角色设定的 System Prompt
	// chatHistory: 包含用户和历史回复的消息列表
	Chat(ctx context.Context, characterPrompt string, chatHistory []Message) (string, error)

	// Transcribe 将音频文件转录为文本
	// audioFilePath: 本地临时音频文件的路径
	Transcribe(ctx context.Context, audioFilePath string) (string, error)
}
