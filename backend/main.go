// main.go (更新后的完整代码)

package main

import (
	"log"
	"net/http"
	"os"

	"vox-backend/handlers"
	"vox-backend/services" // 使用你的模块名 vox-backend

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

// AppContext 结构体用于存储所有全局依赖（如 DB 连接）
type AppContext struct {
	DB        *gorm.DB
	AIService services.AIService // 新增 AI 服务接口
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

		// 注册角色列表 Handler
		api.GET("/characters", handlers.GetCharacterListHandler(ctx.DB))

		// **核心：注册聊天 Handler**
		api.POST("/chat", handlers.ChatHandler(ctx.DB, ctx.AIService))
	}

	return r
}

func main() {
	// 1. 自动加载 .env 文件中的环境变量
	// 如果加载失败（例如文件不存在），程序会继续运行，依赖于已设置的系统环境变量。
	err := godotenv.Load()
	if err != nil {
		log.Println("Note: Could not find .env file, continuing with system environment variables.")
	}

	// 2. 获取数据库连接字符串
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

	// 3. 获取七牛云 LLM 密钥
	llmKey := os.Getenv("QINIU_LLM_KEY")
	// 暂时为 ASR 预留空值，后续实现 ASR 时再读取
	asrKey := os.Getenv("QINIU_ASR_KEY")
	asrUrl := os.Getenv("QINIU_ASR_URL")

	if llmKey == "" {
		log.Fatal("FATAL: QINIU_LLM_KEY environment variable is not set. Please set it.")
	}

	// 4. 初始化七牛云 AI 服务
	// 注意：现在只需要 LLM Key
	qiniuAIService := services.NewQiniuCloudService(llmKey, asrKey, asrUrl)

	// 5. 创建 AppContext 并设置依赖
	appContext := &AppContext{
		DB:        db,
		AIService: qiniuAIService, // 注入 AI 服务
	}

	// 6. 设置 Gin 路由器
	router := setupRouter(appContext)

	// 7. 启动服务器
	log.Println("Server starting on :8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
