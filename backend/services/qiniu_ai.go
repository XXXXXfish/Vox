package services

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log" // 新增：用于打印错误日志
	"net/http"
	"time"

	openai "github.com/sashabaranov/go-openai"
)

// QINIU_ASR_ENDPOINT ASR 接口路径
const QINIU_ASR_ENDPOINT = "/voice/asr"

// QINIU_TTS_ENDPOINT TTS 接口路径
const QINIU_TTS_ENDPOINT = "/voice/tts"

// QINIU_VOICE_LIST_ENDPOINT 获取音色列表接口路径
const QINIU_VOICE_LIST_ENDPOINT = "/voice/list"

// QINIU_LLM_URL 七牛云 LLM 服务的兼容 OpenAI 接口 URL
const QINIU_LLM_URL = "https://openai.qiniu.com/v1"

// --- 新增结构体：用于音色列表响应 ---

// VoiceInfo 用于解析七牛云 /voice/list 接口的单个音色信息
type VoiceInfo struct {
	VoiceName string `json:"voice_name"`
	VoiceType string `json:"voice_type"` // 这是 TTS 需要的 voice_id
	URL       string `json:"url"`
	Category  string `json:"category"`
	// Updatetime int64  `json:"updatetime"` // 可选，如果不需要可忽略
}

// --- AIService 接口（假设你在其他地方定义了，这里仅做提示）---
// 确保你在定义 AIService 接口的地方加入了 GetVoiceList() ([]VoiceInfo, error)

// QiniuCloudService 实现了 AIService 接口
type QiniuCloudService struct {
	llmClient *openai.Client // 使用 OpenAI SDK 客户端来处理 LLM 调用
	asrClient *http.Client
	// **新增：统一 LLM/ASR 的 Key，但作为私有字段，不直接暴露**
	apiKey string
}

// NewQiniuCloudService 初始化七牛云 AI 服务客户端
func NewQiniuCloudService(llmKey string) *QiniuCloudService {
	// 1. 配置 LLM 客户端
	config := openai.DefaultConfig(llmKey)
	config.BaseURL = QINIU_LLM_URL
	llmClient := openai.NewClientWithConfig(config)

	// 2. 构造服务实例
	return &QiniuCloudService{
		llmClient: llmClient,
		asrClient: &http.Client{Timeout: 30 * time.Second},
		apiKey:    llmKey, // 保存 Key 用于手动构建 ASR/TTS/VoiceList 请求的鉴权头
	}
}

// ------------------------------------
// --- 新增方法：获取音色列表 ---
// ------------------------------------

// GetVoiceList 调用七牛云 /voice/list 接口获取所有可用音色
func (s *QiniuCloudService) GetVoiceList() ([]VoiceInfo, error) {
	fullUrl := QINIU_LLM_URL + QINIU_VOICE_LIST_ENDPOINT

	req, err := http.NewRequest("GET", fullUrl, nil)
	if err != nil {
		return nil, fmt.Errorf("创建获取音色列表请求失败: %w", err)
	}

	// 使用保存的 apiKey 进行鉴权
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	client := &http.Client{Timeout: 10 * time.Second} // 使用一个较快的超时时间
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("执行获取音色列表请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("七牛云 Voice List API 错误: 状态码 %d, 响应: %s", resp.StatusCode, string(bodyBytes))
		return nil, fmt.Errorf("七牛云 API 错误: 状态码 %d", resp.StatusCode)
	}

	var voiceList []VoiceInfo
	if err := json.NewDecoder(resp.Body).Decode(&voiceList); err != nil {
		return nil, fmt.Errorf("解码音色列表响应失败: %w", err)
	}

	return voiceList, nil
}

// ------------------------------------
// --- 现有方法 (保持不变，或仅微调导入) ---
// ------------------------------------

// Chat 实现 AIService 的 Chat 方法（LLM 调用）
func (s *QiniuCloudService) Chat(ctx context.Context, characterPrompt string, chatHistory []Message) (string, error) {
	// ... (代码保持不变) ...
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

	resp, err := s.llmClient.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
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

// Transcribe 实现 AIService 的 Transcribe 方法
func (s *QiniuCloudService) Transcribe(ctx context.Context, audioUrl string, audioFormat string) (string, error) {
	// ... (代码保持不变) ...
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
	// ... (后续错误检查和解析逻辑保持不变) ...
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

// TextToSpeech 实现 AIService 的 TextToSpeech 方法
func (s *QiniuCloudService) TextToSpeech(ctx context.Context, text string, voiceId string) ([]byte, error) {
	// ... (代码保持不变) ...
	requestBody := map[string]interface{}{
		"audio": map[string]interface{}{
			"voice_type":  voiceId, // 音色 ID
			"encoding":    "mp3",   // 请求 MP3 格式的音频
			"speed_ratio": 1.0,     // 默认语速
		},
		"request": map[string]string{
			"text": text, // 需要合成的文本
		},
	}
	bodyBytes, _ := json.Marshal(requestBody)

	// 2. 创建 HTTP 请求 (POST /v1/voice/tts)
	fullUrl := QINIU_LLM_URL + QINIU_TTS_ENDPOINT
	req, err := http.NewRequestWithContext(ctx, "POST", fullUrl, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create TTS request: %w", err)
	}

	// 3. 鉴权 Header
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.apiKey))

	// 4. 发送请求
	resp, err := s.asrClient.Do(req)
	// ... (后续错误检查和解析逻辑保持不变) ...
	if err != nil {
		return nil, fmt.Errorf("tts api request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("tts api returned error status %d: %s", resp.StatusCode, string(respBody))
	}

	// 5. 解析响应 (包含 Base64 数据)
	var ttsResponse struct {
		Reqid     string `json:"reqid"`
		Operation string `json:"operation"`
		Data      string `json:"data"` // **Base64 编码的音频数据**
		// 忽略其他字段
	}

	// a. 解码 JSON
	if err := json.NewDecoder(resp.Body).Decode(&ttsResponse); err != nil {
		return nil, fmt.Errorf("failed to decode TTS response: %w", err)
	}

	// b. 检查 Base64 数据
	if ttsResponse.Data == "" {
		return nil, fmt.Errorf("TTS response missing 'data' field (Base64 audio string)")
	}

	// 6. **Base64 解码音频数据**
	audioData, err := base64.StdEncoding.DecodeString(ttsResponse.Data)
	if err != nil {
		return nil, fmt.Errorf("failed to decode Base64 audio data: %w", err)
	}

	return audioData, nil // 返回原始 MP3 二进制数据
}
