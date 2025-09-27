package ai

import (
	"context"
	"fmt"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

// WhisperService 封装了 OpenAI Whisper API 客户端
type WhisperService struct {
	client *openai.Client
}

func NewWhisperService(apiKey string) *WhisperService {
	return &WhisperService{
		client: openai.NewClient(apiKey),
	}
}

func (s *WhisperService) Transcribe(ctx context.Context, audioFilePath string) (string, error) {
	reader, err := os.Open(audioFilePath)
	if err != nil {
		return "", fmt.Errorf("could not open audio file: %w", err)
	}
	defer reader.Close()

	resp, err := s.client.CreateTranscription(
		ctx,
		openai.AudioRequest{
			Model:    openai.Whisper1,
			FilePath: audioFilePath,
			Reader:   reader,
		},
	)
	if err != nil {
		return "", fmt.Errorf("transcription error: %w", err)
	}

	return resp.Text, nil
}
