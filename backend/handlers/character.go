// handlers/character.go

package handlers

import (
	"net/http"
	"strconv"

	"vox-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateCharacterRequest 定义了创建角色所需的参数
type CreateCharacterRequest struct {
	Name         string `json:"name" binding:"required"`
	SystemPrompt string `json:"system_prompt" binding:"required"`
	Description  string `json:"description"`
	// 注意：IsPublic 字段我们让后端控制或暂时设为 false
}

// CreateCharacterHandler 处理 POST /api/v1/characters 请求
func CreateCharacterHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateCharacterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
			return
		}

		// 1. 从 Context 中获取 CreatorID (通过 JWT 中间件注入)
		rawUserID, exists := c.Get(UserIDKey) // UserIDKey 定义在 auth.go 中
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "User context not found"})
			return
		}
		_ = rawUserID.(uint) // 暂时不使用，等待 models.Character 更新

		// 2. 检查名称是否已存在 (可选，但推荐)
		var existingChar models.Character
		if db.Where("name = ?", req.Name).First(&existingChar).Error == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Character name already exists."})
			return
		}

		// 3. 创建新的 Character 模型实例
		newCharacter := models.Character{
			Name:         req.Name,
			SystemPrompt: req.SystemPrompt,
			Description:  req.Description,
		}

		// 4. 保存到数据库
		if err := db.Create(&newCharacter).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save character."})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message":      "Character created successfully.",
			"character_id": newCharacter.ID,
		})
	}
}

// GetCharacterListHandler 处理 GET /api/v1/characters 请求
// 支持分页和基于名称的搜索
func GetCharacterListHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 从 Context 中获取当前用户 ID
		rawUserID, exists := c.Get(UserIDKey)
		if !exists {
			// 在角色列表接口中，如果未认证，我们可以只返回公共角色
			// 或者，如果前端总是需要认证，这里可以返回 401，但我们假设它在 /api/v1 组内
			c.JSON(http.StatusInternalServerError, gin.H{"error": "User context not found"})
			return
		}
		_ = rawUserID.(uint) // 暂时不使用，等待 models.Character 更新

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
		// **【关键修改】查询条件：**
		// 条件 A: IsPublic = true (系统公共角色)
		// OR
		// 条件 B: CreatorID = 当前用户ID (用户自己创建的角色)
		// 注意：由于 models.Character 中没有 IsPublic 和 CreatorID 字段，
		// 这里暂时返回所有角色，后续需要更新 models.Character 结构
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

// UpdateVoiceRequest 定义了更新音色所需的参数
type UpdateVoiceRequest struct {
	VoiceID string `json:"voice_id" binding:"required"`
}

// UpdateCharacterVoiceHandler 处理 PATCH /api/v1/characters/:id/voice 请求
func UpdateCharacterVoiceHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 获取 URL 中的角色 ID
		characterID := c.Param("id")
		var req UpdateVoiceRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: voice_id is required."})
			return
		}

		// 2. 检查角色是否存在
		var character models.Character
		if result := db.First(&character, characterID); result.Error != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Character not found."})
			return
		}

		// 3. TODO: 这里需要增加权限检查 (例如：只有 CreatorID 匹配当前用户或角色为公共时才能修改)
		// 暂且省略，专注于功能实现

		// 4. 更新 VoiceID 字段
		if err := db.Model(&character).Update("voice_id", req.VoiceID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update character voice ID."})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Character voice ID updated successfully.", "character_id": character.ID, "new_voice_id": req.VoiceID})
	}
}
