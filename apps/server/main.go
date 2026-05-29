package main

import (
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/serv/server/internal/auth"
	"github.com/serv/server/internal/database"
	"github.com/serv/server/internal/middleware"
	"github.com/serv/server/pkg"
	"go.uber.org/zap"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		// Can't use zap yet as it's not initialized
	}

	// Initialize Logger
	env := os.Getenv("GIN_MODE")
	if env == "" {
		env = "development"
	}
	pkg.InitLogger(env)
	defer pkg.Log.Sync()

	// Initialize Database
	database.InitDB()
	database.AutoMigrate()

	// Initialize Redis
	database.InitRedis()

	// Set Gin mode
	gin.SetMode(env)

	// Use gin.New() to avoid default logger/recovery middleware
	r := gin.New()

	// Custom Zap middleware
	r.Use(middleware.GinLogger())
	r.Use(middleware.GinRecovery())

	// Routes
	v1 := r.Group("/api/v1")
	{
		authGroup := v1.Group("/auth")
		{
			authGroup.POST("/register", auth.RegisterOrganization)
		}
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Serv API is running",
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	pkg.Log.Info("Server starting", zap.String("port", port))
	if err := r.Run(":" + port); err != nil {
		pkg.Log.Fatal("Failed to start server", zap.Error(err))
	}
}
