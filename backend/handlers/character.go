// handlers/character.go

package handlers

import (
	"net/http"
	"strconv"

	"vox-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AppContext 结构体必须在 main.go 中定义，这里我们为了方便使用别名或直接使用 DB 实例
// 但为了保持独立性，我们使用一个函数来接收 DB 依赖

// GetCharacterListHandler 处理 GET /api/v1/characters 请求
// 支持分页和基于名称的搜索
func GetCharacterListHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var characters []models.Character

		// 1. 获取查询参数 (分页和搜索)
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
		searchQuery := c.Query("query") // 用于搜索的关键字

		// 确保分页参数有效
		if page <= 0 {
			page = 1
		}
		if pageSize <= 0 {
			pageSize = 10
		}

		// 计算偏移量
		offset := (page - 1) * pageSize

		// 2. 构建查询
		dbQuery := db.Model(&models.Character{}).Limit(pageSize).Offset(offset).Order("id asc")

		// 3. 应用搜索条件（基于 Name 字段模糊匹配）
		if searchQuery != "" {
			// 使用 ILIKE (PostgreSQL) 进行不区分大小写的模糊搜索
			// 如果使用的是 MySQL，这里应改为 LIKE
			dbQuery = dbQuery.Where("name ILIKE ?", "%"+searchQuery+"%")
		}

		// 4. 执行查询
		if err := dbQuery.Find(&characters).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch characters"})
			return
		}

		// 5. 获取总数 (用于分页信息)
		var total int64
		dbQuery.Count(&total)

		// 6. 返回结果
		c.JSON(http.StatusOK, gin.H{
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
			"data":     characters,
		})
	}
}
