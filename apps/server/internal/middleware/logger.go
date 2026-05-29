package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/serv/server/pkg"
	"go.uber.org/zap"
)

func GinLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)

		if len(c.Errors) > 0 {
			for _, e := range c.Errors.Errors() {
				pkg.Log.Error(e)
			}
		} else {
			pkg.Log.Info(path,
				zap.Int("status", c.Writer.Status()),
				zap.String("method", c.Request.Method),
				zap.String("path", path),
				zap.String("query", query),
				zap.String("ip", c.ClientIP()),
				zap.String("user-agent", c.Request.UserAgent()),
				zap.Duration("latency", latency),
			)
		}
	}
}

func GinRecovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				pkg.Log.Error("recovery from panic",
					zap.Any("error", err),
				)
				c.AbortWithStatus(500)
			}
		}()
		c.Next()
	}
}
