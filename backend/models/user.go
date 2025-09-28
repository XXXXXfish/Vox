// models/user.go

package models

import (
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User 模型代表用户，用于认证
type User struct {
	gorm.Model

	// Username 应该是唯一的
	Username string `gorm:"unique;not null"`
	// PasswordHash 存储密码的哈希值
	PasswordHash string `gorm:"not null"`
}

// SetPassword 对密码进行哈希处理并存储
func (user *User) SetPassword(password string) error {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.PasswordHash = string(bytes)
	return nil
}

// CheckPassword 比较用户提供的密码和存储的哈希值
func (user *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	return err == nil
}
