// main.go (修改后的完整代码)

package main

import (
	"log"
	"net/http"
	"os"

	"vox-backend/handlers"
	"vox-backend/models"
	"vox-backend/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

// AppContext 结构体用于存储所有全局依赖（如 DB 连接和配置）
type AppContext struct {
	DB        *gorm.DB
	AIService services.AIService
	// **【新增】JWTSecret 字段**
	JWTSecret string
	// **【新增】Kodo 配置字段**
	KodoAK     string
	KodoSK     string
	KodoBucket string
	KodoDomain string
}

// ... initializeDatabase 函数 (假设它在 services/database.go 中实现) ...
// Note: 你的 main.go 中 initializeDatabase 的逻辑是散在 main 里面的，这里保持不变。

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

	auth := r.Group("/auth")
	{
		auth.POST("/register", handlers.RegisterHandler(ctx.DB))
		// **【关键修改】：使用 ctx.JWTSecret 替换 ctx.Config.JWTSecret**
		auth.POST("/login", handlers.LoginHandler(ctx.DB, ctx.JWTSecret))
	}
	// **【新增】实例化认证中间件**
	authMiddleware := handlers.AuthMiddleware(ctx.JWTSecret)
	api := r.Group("/api/v1")
	// **【关键修改】将中间件应用到 /api/v1 组**
	api.Use(authMiddleware)
	{
		// 临时路由，避免 'api declared and not used' 报错
		api.GET("/status", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "API group is ready"})
		})

		// 注册角色列表 Handler
		api.GET("/characters", handlers.GetCharacterListHandler(ctx.DB))

		// **【新增】角色创建接口**
		api.POST("/characters", handlers.CreateCharacterHandler(ctx.DB))

		// **核心：注册聊天 Handler**
		api.POST("/chat", handlers.ChatHandler(ctx.DB, ctx.AIService))

		// **注册 ASR 转录 Handler**
		api.POST("/transcribe", handlers.TranscribeHandler(ctx.AIService))

		// **核心：注册 TTS 合成 Handler**
		api.POST("/tts", handlers.TTSHandler(ctx.AIService))

		// **核心：注册语音聊天 Handler**
		api.POST("/voice/chat", handlers.VoiceChatHandler(ctx.DB, ctx.AIService))

		// **新增：历史消息查询接口**
		api.GET("/history/:user_id/:character_id", handlers.GetChatHistoryHandler(ctx.DB))

		// **【新增】注册上传凭证接口**
		api.GET("/upload/token", handlers.GetUploadTokenHandler(
			ctx.KodoAK,
			ctx.KodoSK,
			ctx.KodoBucket,
			ctx.KodoDomain,
		))
	}

	return r
}

func main() {
	// 1. 自动加载 .env 文件中的环境变量
	err := godotenv.Load()
	if err != nil {
		log.Println("Note: Could not find .env file, continuing with system environment variables.")
	}

	// 2. 获取配置信息 (数据库连接、LLM Key、JWT 密钥)
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("FATAL: DATABASE_URL environment variable is not set. Please set it.")
	}

	llmKey := os.Getenv("QINIU_LLM_KEY")
	if llmKey == "" {
		log.Fatal("FATAL: QINIU_LLM_KEY environment variable is not set. Please set it.")
	}

	// **【新增】读取 JWT 密钥**
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		// 设置一个默认值以防万一，但在生产环境应避免
		log.Println("WARNING: JWT_SECRET not set, using default 'supersecretkey'.")
		jwtSecret = "supersecretkey"
	}
	// **【新增】读取 Kodo 对象存储配置**
	kodoAccessKey := os.Getenv("QINIU_KODO_ACCESS_KEY")
	kodoSecretKey := os.Getenv("QINIU_KODO_SECRET_KEY")
	kodoBucket := os.Getenv("QINIU_KODO_BUCKET_NAME")
	kodoDomain := os.Getenv("QINIU_KODO_DOMAIN") // 文件的公网访问域名

	if kodoAccessKey == "" || kodoSecretKey == "" || kodoBucket == "" || kodoDomain == "" {
		log.Fatal("FATAL: Kodo environment variables (AK/SK/Bucket/Domain) are not fully set.")
	}

	// 3. 初始化数据库连接和迁移
	db, err := services.InitDB(dsn)
	if err != nil {
		log.Fatal("FATAL: Database initialization failed:", err)
	}
	if err := db.AutoMigrate(&models.Character{}, &models.ChatRecord{}, &models.User{}); err != nil {
		log.Fatalf("Database migration failed: %v", err)
	}

	// 4. 初始化七牛云 AI 服务
	qiniuAIService := services.NewQiniuCloudService(llmKey)

	// 5. 创建 AppContext 并设置依赖
	appContext := &AppContext{
		DB:        db,
		AIService: qiniuAIService,
		// **【关键修改】注入 JWT 密钥**
		JWTSecret: jwtSecret,
		// **【新增】注入 Kodo 配置**
		KodoAK:     kodoAccessKey,
		KodoSK:     kodoSecretKey,
		KodoBucket: kodoBucket,
		KodoDomain: kodoDomain,
	}

	// 6. 设置 Gin 路由器
	router := setupRouter(appContext)

	// 7. 启动服务器
	log.Println("Server starting on 0.0.0.0:8080...")
	log.Println("局域网访问地址: http://10.19.196.225:8080")
	if err := router.Run("0.0.0.0:8080"); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
