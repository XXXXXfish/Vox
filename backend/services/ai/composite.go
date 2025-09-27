package ai

import (
	"context"
)

// CompositeAIService 组合了多个AI服务的复合服务
type CompositeAIService struct {
	deepseekService *DeepSeekService
	whisperService  *WhisperService
}

// NewCompositeAIService 创建复合AI服务
func NewCompositeAIService(deepseek *DeepSeekService, whisper *WhisperService) *CompositeAIService {
	return &CompositeAIService{
		deepseekService: deepseek,
		whisperService:  whisper,
	}
}

// Chat 使用DeepSeek进行聊天
func (s *CompositeAIService) Chat(ctx context.Context, messages []string) (string, error) {
	return s.deepseekService.Chat(ctx, messages)
}

// Transcribe 使用Whisper进行语音转文字
func (s *CompositeAIService) Transcribe(ctx context.Context, audioFilePath string) (string, error) {
	return s.whisperService.Transcribe(ctx, audioFilePath)
}
