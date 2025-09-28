// models/character.go

package models

import (
	"gorm.io/gorm"
)

// Character 结构体定义了 AI 角色在数据库中的表结构
type Character struct {
	gorm.Model          // 包含 ID, CreatedAt, UpdatedAt, DeletedAt 字段
	Name         string `gorm:"type:varchar(100);not null;uniqueIndex" json:"name"` // 角色名称，唯一
	Description  string `gorm:"type:text" json:"description"`                       // 角色简介，用于前端展示
	SystemPrompt string `gorm:"type:text;not null" json:"system_prompt"`            // AI 系统指令，用于角色扮演
	VoiceID      string `gorm:"default:''" json:"voice_id"`                         // 存储 TTS 接口需要的 voice_id
}
