// models/chat_record.go

package models

import (
	"gorm.io/gorm"
)

// ChatRecord 结构体定义了聊天记录的表结构
type ChatRecord struct {
	gorm.Model

	// **【关键修改】移除 SessionID 字段**
	// SessionID   string `gorm:"index"` // <-- 移除

	UserID      uint `gorm:"not null;index:idx_user_char_ts"` // 关联的用户 ID
	CharacterID uint `gorm:"not null;index:idx_user_char_ts"` // 角色 ID

	UserMessage string `gorm:"type:text;not null" json:"user_message"`
	AIMessage   string `gorm:"type:text;not null" json:"ai_message"`

	// 增加一个复合索引，提高查询性能
	// idx_user_char_ts: 按照 (UserID, CharacterID, CreatedAt) 排序

	// Character 关联到 Character 模型
	Character Character `gorm:"foreignKey:CharacterID"`
}
