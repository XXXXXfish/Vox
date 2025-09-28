// handlers/upload.go

package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/qiniu/go-sdk/v7/auth/qbox" // 用于生成凭证
	"github.com/qiniu/go-sdk/v7/storage"   // 用于定义上传策略
)

// GetUploadTokenHandler 供前端调用，获取 Kodo 上传凭证
func GetUploadTokenHandler(ak, sk, bucket, domain string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 设置上传策略
		// 我们只允许前端上传文件，不强制要求 key（让七牛云自动命名）
		// 设置 3600 秒（1 小时）的有效期
		putPolicy := storage.PutPolicy{
			Scope:   bucket,
			Expires: 3600,
			// 允许的文件大小限制（可选，这里不设置）
			// FsizeLimit: 10 * 1024 * 1024, // 限制最大 10MB
			// ReturnBody: `{"key":"$(key)", "hash":"$(etag)", "url":"` + domain + `/$(key)"}`, // 可选：自定义返回体
		}

		// 2. 实例化凭证生成器
		mac := qbox.NewMac(ak, sk)

		// 3. 生成上传凭证
		upToken := putPolicy.UploadToken(mac)

		// 4. 返回给前端
		c.JSON(http.StatusOK, gin.H{
			"upload_token":  upToken,
			"up_host":       "https://up-z2.qiniup.com", // **TODO: 需要根据你的存储区域调整**
			"bucket_domain": domain,
		})
	}
}
