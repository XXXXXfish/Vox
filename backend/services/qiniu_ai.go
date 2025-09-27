// services/qiniu_ai.go

package services

import (
	"context"
	"fmt"

	openai "github.com/sashabaranov/go-openai"
)

// QiniuCloudService 实现了 AIService 接口
type QiniuCloudService struct {
	llmClient *openai.Client // 使用 OpenAI SDK 客户端来处理 LLM 调用
	asrApiKey string         // ASR 服务可能仍需独立的 Key
	asrUrl    string
}

// QINIU_LLM_URL 七牛云 LLM 服务的兼容 OpenAI 接口 URL
const QINIU_LLM_URL = "https://openai.qiniu.com/v1"

// NewQiniuCloudService 初始化七牛云 AI 服务客户端
// llmKey 是用于 LLM 的 sk- 开头密钥
// asrKey 和 asrUrl 用于 ASR 服务（此处暂不使用，但作为参数保留）
func NewQiniuCloudService(llmKey string, asrKey string, asrUrl string) *QiniuCloudService {
	// 1. 配置 LLM 客户端
	config := openai.DefaultConfig(llmKey)
	config.BaseURL = QINIU_LLM_URL
	llmClient := openai.NewClientWithConfig(config)

	// 2. 构造服务实例
	return &QiniuCloudService{
		llmClient: llmClient,
		asrApiKey: asrKey,
		asrUrl:    asrUrl,
	}
}

// Chat 实现 AIService 的 Chat 方法（LLM 调用）
func (s *QiniuCloudService) Chat(ctx context.Context, characterPrompt string, chatHistory []Message) (string, error) {
	// 1. 构造完整的消息历史（System Prompt 和 Chat History）
	openAIMessages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: characterPrompt, // System Prompt
		},
	}
	for _, msg := range chatHistory {
		openAIMessages = append(openAIMessages, openai.ChatCompletionMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	// 2. 调用七牛云 LLM API (使用兼容的 OpenAI 接口)
	resp, err := s.llmClient.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			// 请根据七牛云文档替换为他们支持的模型名，例如 qwen-max
			Model:    "qwen-max",
			Messages: openAIMessages,
		},
	)

	if err != nil {
		return "", fmt.Errorf("llm api request failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("llm api returned an empty response")
	}

	return resp.Choices[0].Message.Content, nil
}

// Transcribe 实现 AIService 的 Transcribe 方法（ASR 调用 - 占位）
func (s *QiniuCloudService) Transcribe(ctx context.Context, audioFilePath string) (string, error) {
	// **由于 ASR 流程复杂且信息不全，此处仅为占位函数。**
	// 真实实现需要：上传文件到 Kodo -> 调用 ASR API -> 查询结果。

	return "", fmt.Errorf("Qiniu ASR integration not yet implemented. File path: %s", audioFilePath)
}
