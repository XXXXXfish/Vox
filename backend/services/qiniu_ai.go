// services/qiniu_ai.go

package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	openai "github.com/sashabaranov/go-openai"
)

// QINIU_ASR_ENDPOINT ASR 接口路径
const QINIU_ASR_ENDPOINT = "/voice/asr"

// QiniuCloudService 实现了 AIService 接口
type QiniuCloudService struct {
	llmClient *openai.Client // 使用 OpenAI SDK 客户端来处理 LLM 调用
	asrClient *http.Client
	// **新增：统一 LLM/ASR 的 Key，但作为私有字段，不直接暴露**
	apiKey string
}

// QINIU_LLM_URL 七牛云 LLM 服务的兼容 OpenAI 接口 URL
const QINIU_LLM_URL = "https://openai.qiniu.com/v1"

// NewQiniuCloudService 初始化七牛云 AI 服务客户端
// llmKey 是用于 LLM 的 sk- 开头密钥
// asrKey 和 asrUrl 用于 ASR 服务（此处暂不使用，但作为参数保留）
func NewQiniuCloudService(llmKey string) *QiniuCloudService {
	// 1. 配置 LLM 客户端
	config := openai.DefaultConfig(llmKey)
	config.BaseURL = QINIU_LLM_URL
	llmClient := openai.NewClientWithConfig(config)

	// 2. 构造服务实例
	return &QiniuCloudService{
		llmClient: llmClient,
		asrClient: &http.Client{Timeout: 30 * time.Second},
		apiKey:    llmKey, // 保存 Key 用于手动构建 ASR/TTS 请求的鉴权头
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
			Model:    "deepseek-v3",
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
// Transcribe 实现 AIService 的 Transcribe 方法
// audioUrl: 现在接收的是音频文件的公网 URL，而不是本地文件路径
func (s *QiniuCloudService) Transcribe(ctx context.Context, audioUrl string, audioFormat string) (string, error) {
	// 1. 构造请求体 (遵循文档的 JSON 结构)
	requestBody := map[string]interface{}{
		"model": "asr", // 文档要求 model 固定为 asr
		"audio": map[string]string{
			"format": audioFormat, // mp3, wav, ogg
			"url":    audioUrl,    // 公网 URL
		},
	}
	bodyBytes, _ := json.Marshal(requestBody)

	// 2. 创建 HTTP 请求
	fullUrl := QINIU_LLM_URL + QINIU_ASR_ENDPOINT
	req, err := http.NewRequestWithContext(ctx, "POST", fullUrl, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("failed to create ASR request: %w", err)
	}

	// 3. 鉴权 Header
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.apiKey))

	// 4. 发送请求
	resp, err := s.asrClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("asr api request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("asr api returned error status %d: %s", resp.StatusCode, string(respBody))
	}

	// 5. 解析响应 (遵循文档的响应结构)
	var result struct {
		Data struct {
			Result struct {
				Text string `json:"text"`
			} `json:"result"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode ASR response: %w", err)
	}

	if result.Data.Result.Text == "" {
		return "", fmt.Errorf("ASR result text is empty")
	}

	return result.Data.Result.Text, nil
}
