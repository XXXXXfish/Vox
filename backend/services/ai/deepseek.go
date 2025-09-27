package ai

import (
	"context"

	openai "github.com/sashabaranov/go-openai"
)

// DeepSeekService 封装了 DeepSeek API 客户端
type DeepSeekService struct {
	client *openai.Client
}

func NewDeepSeekService(apiKey string) *DeepSeekService {
	// DeepSeek 的 API URL 与 OpenAI 有所不同
	config := openai.DefaultConfig(apiKey)
	config.BaseURL = "https://api.deepseek.com/v1"
	return &DeepSeekService{
		client: openai.NewClientWithConfig(config),
	}
}

func (s *DeepSeekService) Chat(ctx context.Context, messages []string) (string, error) {
	// 将字符串数组转换为 OpenAI SDK 所需的消息格式
	chatMessages := []openai.ChatCompletionMessage{}
	for _, msg := range messages {
		chatMessages = append(chatMessages, openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleUser,
			Content: msg,
		})
	}

	resp, err := s.client.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			Model:    openai.GPT3Dot5Turbo, // DeepSeek兼容此模型名，也可使用 deepseek-chat
			Messages: chatMessages,
		},
	)
	if err != nil {
		return "", err
	}

	return resp.Choices[0].Message.Content, nil
}
