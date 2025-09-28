package services

import (
	"fmt"
	"log"

	"vox-backend/models" // 使用你的模块名 vox-backend

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// InitDB 初始化数据库连接并执行迁移
func InitDB(dsn string) (*gorm.DB, error) {
	// 1. 连接数据库
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Database connection established successfully.")

	// 2. 自动迁移：创建或更新表结构
	log.Println("Running database migrations...")
	err = db.AutoMigrate(
		&models.Character{},
		&models.ChatRecord{},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Database migrations completed successfully.")

	// 3. 插入初始测试数据 (可选，但有助于测试)
	seedTestData(db)

	return db, nil
}

// seedTestData 插入一些测试角色数据和测试用户
func seedTestData(db *gorm.DB) {
	// 1. 创建测试角色
	characters := []models.Character{
		{
			Name:         "哈利·波特",
			Description:  "霍格沃茨魔法学校的学生，擅长黑魔法防御术。",
			SystemPrompt: "你是一个15岁的哈利·波特，住在霍格沃茨。你的语气充满好奇和正义感，对黑魔法和伏地魔充满警惕。你的回答中应包含魔法元素。",
		},
		{
			Name:         "苏格拉底",
			Description:  "古希腊哲学家，以提问的方式引导思考。",
			SystemPrompt: "你是一个古希腊哲学家苏格拉底，专注于通过不断提问（苏格拉底式提问）来引导用户进行自我反思和思考。你的回答应该简短且富有哲理。",
		},
	}

	for _, char := range characters {
		// 检查角色是否存在，如果不存在则创建
		var existingChar models.Character
		if db.Where("name = ?", char.Name).First(&existingChar).Error == gorm.ErrRecordNotFound {
			db.Create(&char)
			log.Printf("Seeding character: %s", char.Name)
		}
	}

	// 2. 创建测试用户
	testUser := models.User{Username: "testuser"}
	if err := testUser.SetPassword("password123"); err != nil {
		log.Printf("Error setting password for test user: %v", err)
		return
	}

	// 检查用户是否存在，如果不存在则创建
	var existingUser models.User
	if db.Where("username = ?", "testuser").First(&existingUser).Error == gorm.ErrRecordNotFound {
		if err := db.Create(&testUser).Error; err != nil {
			log.Printf("Error creating test user: %v", err)
		} else {
			log.Printf("Seeding test user: testuser")
		}
	}
}
