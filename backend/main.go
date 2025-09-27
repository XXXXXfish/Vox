// main.go (更新后的完整代码)

package main

import (
	"log"
	"net/http"
	"os"

	"vox-backend/handlers"
	"vox-backend/services" // 使用你的模块名 vox-backend

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AppContext 结构体用于存储所有全局依赖（如 DB 连接）
type AppContext struct {
	DB *gorm.DB
}

func setupRouter(ctx *AppContext) *gin.Engine {
	r := gin.Default()

	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "AI Roleplay Backend is running successfully!",
			"version": "v1.0.0",
		})
	})

	api := r.Group("/api/v1")
	{
		// 临时路由，避免 'api declared and not used' 报错
		api.GET("/status", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "API group is ready"})
		})

		// TODO: 注册角色列表 Handler
		api.GET("/characters", handlers.GetCharacterListHandler(ctx.DB))
		// api.GET("/characters", ctx.GetCharacterListHandler)
	}

	return r
}

func main() {
	// 1. 获取数据库连接字符串
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		// 建议的 PostgreSQL DSN 格式示例：
		// "host=localhost user=gorm password=gorm dbname=gorm port=5432 sslmode=disable TimeZone=Asia/Shanghai"
		log.Fatal("FATAL: DATABASE_URL environment variable is not set. Please set it.")
	}

	// 2. 初始化数据库连接和迁移
	db, err := services.InitDB(dsn)
	if err != nil {
		log.Fatal("FATAL: Database initialization failed:", err)
	}

	// 3. 创建 AppContext 并设置依赖
	appContext := &AppContext{DB: db}

	// 4. 设置 Gin 路由器
	router := setupRouter(appContext)

	// 5. 启动服务器
	log.Println("Server starting on :8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
