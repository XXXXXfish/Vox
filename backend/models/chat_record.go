// models/chat_record.go

package models

import (
	"gorm.io/gorm"
)

// ChatRecord 结构体定义了聊天记录的表结构
type ChatRecord struct {
	gorm.Model
	// CharacterID 关联的角色ID
	CharacterID uint `gorm:"not null;index" json:"character_id"`
	// UserMessage 用户的文本输入
	UserMessage string `gorm:"type:text;not null" json:"user_message"`
	// AIMessage AI 的文本回复
	AIMessage string `gorm:"type:text;not null" json:"ai_message"`
	// SessionID 用于将多轮对话归类到同一个会话中（更高级的用法，暂用时间戳/简单ID替代）
	SessionID string `gorm:"type:varchar(50);index" json:"session_id"`
	// Character 关联到 Character 模型
	Character Character `gorm:"foreignKey:CharacterID"`
}
