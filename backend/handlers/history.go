// handlers/history.go

package handlers

import (
	"log"
	"net/http"
	"vox-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// HistoryResponseItem 定义了返回给前端的单个历史消息项的结构
// 虽然 ChatRecord 包含所有信息，但我们定义这个结构让返回格式更清晰。
type HistoryResponseItem struct {
	UserMessage string `json:"user_message"`
	AIMessage   string `json:"ai_message"`
	Timestamp   int64  `json:"timestamp"` // 使用 Unix 时间戳方便前端处理
}

// GetChatHistoryHandler 处理 GET /api/v1/history/:character_id 请求
func GetChatHistoryHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 从 Context 获取 UserID
		rawUserID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "User context not found"}) // 不应发生
			return
		}
		userID := rawUserID.(uint) // 类型断言为 uint

		// 2. 从 URL 路径获取 CharacterID
		characterIDStr := c.Param("character_id")
		if characterIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Character ID is required."})
			return
		}

		var chatRecords []models.ChatRecord

		// 3. 从数据库查询：
		// - 筛选条件：UserID 和 CharacterID 匹配
		// - 排序：按创建时间升序排列，确保对话顺序正确
		if err := db.Where("user_id = ? AND character_id = ?", userID, characterIDStr).Order("created_at asc").Find(&chatRecords).Error; err != nil {
			log.Printf("Database error fetching history for user %d, character %s: %v", userID, characterIDStr, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch chat history"})
			return
		}

		// 3. 格式化响应数据
		history := make([]HistoryResponseItem, 0, len(chatRecords))
		for _, record := range chatRecords {
			history = append(history, HistoryResponseItem{
				UserMessage: record.UserMessage,
				AIMessage:   record.AIMessage,
				Timestamp:   record.CreatedAt.Unix(), // 转换为 Unix 时间戳
			})
		}

		// 4. 返回历史记录列表
		// 即使没有记录，也会返回 {"history": []}
		c.JSON(http.StatusOK, gin.H{"history": history})
	}
}
