// handlers/auth.go

package handlers

import (
	"log"
	"net/http"
	"time"
	"vox-backend/models"

	"github.com/gin-gonic/gin"
	jwt "github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

// claims 定义了 JWT 中存储的自定义信息
type claims struct {
	UserID uint `json:"user_id"`
	jwt.RegisteredClaims
}

// 定义一个 Context Key，用于在 Gin Context 中存储 UserID
const UserIDKey = "userID"

// generateJWTToken 根据用户 ID 生成一个 JWT
func generateJWTToken(userID uint, secret string) (string, error) {
	// Token 1小时后过期
	expirationTime := time.Now().Add(1 * time.Hour)

	claims := &claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// 使用配置文件中的密钥进行签名
	return token.SignedString([]byte(secret))
}

// LoginRequest 定义登录请求体
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginHandler 处理用户登录
func LoginHandler(db *gorm.DB, jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
			return
		}

		// 1. 查找用户
		var user models.User
		if db.Where("username = ?", req.Username).First(&user).Error != nil {
			// 找不到用户或密码错误，都返回相同的通用错误信息，以避免信息泄露
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
			return
		}

		// 2. 验证密码
		if !user.CheckPassword(req.Password) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
			return
		}

		// 3. 生成 JWT
		tokenString, err := generateJWTToken(user.ID, jwtSecret)
		if err != nil {
			log.Printf("Failed to generate JWT for user %d: %v", user.ID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		// 4. 返回 Token
		c.JSON(http.StatusOK, gin.H{
			"message": "Login successful",
			"token":   tokenString,
		})
	}
}

// RegisterRequest 定义注册请求体
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// RegisterHandler 处理用户注册
func RegisterHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
			return
		}

		// 检查用户是否已存在
		var existingUser models.User
		if db.Where("username = ?", req.Username).First(&existingUser).Error == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
			return
		}

		newUser := models.User{Username: req.Username}

		// 对密码进行哈希处理
		if err := newUser.SetPassword(req.Password); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not hash password"})
			return
		}

		// 保存到数据库
		if err := db.Create(&newUser).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create user"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully", "user_id": newUser.ID})
	}
}

// AuthMiddleware 验证 JWT Token 并将 UserID 注入到 Context
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 从 Header 中获取 Token (格式: Authorization: Bearer <token>)
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort() // 终止请求链
			return
		}

		// 检查格式是否为 "Bearer <token>"
		tokenString := ""
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			tokenString = authHeader[7:]
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format (Expected: Bearer <token>)"})
			c.Abort()
			return
		}

		// 2. 解析和验证 Token
		token, err := jwt.ParseWithClaims(tokenString, &claims{}, func(token *jwt.Token) (interface{}, error) {
			// 确保签名方法是预期的 HMAC
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(jwtSecret), nil // 返回密钥用于验证签名
		})

		// 3. 处理验证错误
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token", "details": err.Error()})
			c.Abort()
			return
		}

		// 4. 提取 UserID 并注入 Context
		if claims, ok := token.Claims.(*claims); ok && token.Valid {
			// 将 UserID 注入到 Gin Context 中
			c.Set(UserIDKey, claims.UserID)

			// 继续处理请求
			c.Next()
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token claims invalid"})
			c.Abort()
			return
		}
	}
}
