package services

import "context"

// AIService 定义了 AI 服务的通用接口
type AIService interface {
	// Chat 生成聊天回复
	Chat(ctx context.Context, messages []string) (string, error)
	// Transcribe 将音频文件转录为文本
	Transcribe(ctx context.Context, audioFilePath string) (string, error)
}
