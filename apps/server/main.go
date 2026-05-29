package main

import (
	"fmt"
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
	fmt.Println("1. Starting app")

	if err := godotenv.Load(); err != nil {
		fmt.Println("2. No .env found")
	}

	fmt.Println("3. Initializing logger")

	env := os.Getenv("GIN_MODE")
	if env == "" {
		env = "development"
	}

	pkg.InitLogger(env)
	defer pkg.Log.Sync()

	fmt.Println("4. Initializing DB")
	database.InitDB()

	fmt.Println("5. Running migrations")
	database.AutoMigrate()

	fmt.Println("6. Initializing Redis")
	database.InitRedis()

	fmt.Println("7. Configuring Gin")

	gin.SetMode(env)

	r := gin.New()

	r.Use(middleware.GinLogger())
	r.Use(middleware.GinRecovery())

	v1 := r.Group("/api/v1")
	{
		authGroup := v1.Group("/auth")
		{
			authGroup.POST("/register", auth.RegisterOrganization)
		}
	}

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

	fmt.Println("8. Starting server on port", port)

	pkg.Log.Info("Server starting", zap.String("port", port))

	if err := r.Run(":" + port); err != nil {
		pkg.Log.Fatal("Failed to start server", zap.Error(err))
	}
}
