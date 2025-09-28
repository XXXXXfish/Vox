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

// GetChatHistoryHandler 处理 GET /api/v1/history/:session_id 请求
func GetChatHistoryHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 从 URL 路径获取 SessionID
		sessionID := c.Param("session_id")
		if sessionID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Session ID is required."})
			return
		}

		var chatRecords []models.ChatRecord

		// 2. 从数据库查询：
		// - 筛选条件：SessionID 匹配
		// - 排序：按创建时间升序排列，确保对话顺序正确
		if err := db.Where("session_id = ?", sessionID).Order("created_at asc").Find(&chatRecords).Error; err != nil {
			log.Printf("Database error fetching history for session %s: %v", sessionID, err)
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
