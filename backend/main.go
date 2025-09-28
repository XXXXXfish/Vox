// main.go (更新后的完整代码)

package main

import (
	"log"
	"net/http"
	"os"

	"vox-backend/handlers"
	"vox-backend/services" // 使用你的模块名 vox-backend

	"github.com/gin-contrib/cors"
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
	// **配置 CORS 中间件**
	config := cors.DefaultConfig()
	// **最宽松（开发环境推荐）：允许所有源**
	config.AllowAllOrigins = true

	// **或者更安全的方式（推荐）：指定前端的源**
	// config.AllowOrigins = []string{"http://10.19.196.225:你的前端端口"}

	// 允许的 HTTP 方法和 Header (默认配置通常足够，但保险起见可以列出)
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization", "X-Session-ID"} // 确保允许我们自定义的 Header

	// 将配置应用到路由
	r.Use(cors.New(config))

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

		// **注册 ASR 转录 Handler**
		api.POST("/transcribe", handlers.TranscribeHandler(ctx.AIService))

		// **核心：注册 TTS 合成 Handler**
		api.POST("/tts", handlers.TTSHandler(ctx.AIService))

		// **核心：注册语音聊天 Handler**
		api.POST("/voice/chat", handlers.VoiceChatHandler(ctx.DB, ctx.AIService))

		// **新增：历史消息查询接口**
		api.GET("/history/:session_id", handlers.GetChatHistoryHandler(ctx.DB))
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

	if llmKey == "" {
		log.Fatal("FATAL: QINIU_LLM_KEY environment variable is not set. Please set it.")
	}

	// 4. 初始化七牛云 AI 服务
	// 注意：现在只需要 LLM Key
	qiniuAIService := services.NewQiniuCloudService(llmKey)

	// 5. 创建 AppContext 并设置依赖
	appContext := &AppContext{
		DB:        db,
		AIService: qiniuAIService, // 注入 AI 服务
	}

	// 6. 设置 Gin 路由器
	router := setupRouter(appContext)

	// 7. 启动服务器
	// 绑定到 0.0.0.0:8080 以允许局域网访问
	log.Println("Server starting on 0.0.0.0:8080...")
	log.Println("局域网访问地址: http://10.19.196.225:8080")
	if err := router.Run("0.0.0.0:8080"); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
