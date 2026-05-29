package main

import (
	"fmt"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/serv/server/docs"
	"github.com/serv/server/internal/auth"
	"github.com/serv/server/internal/database"
	"github.com/serv/server/internal/middleware"
	"github.com/serv/server/pkg"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"
)

// @title Serv API
// @version 1.0
// @description This is the API documentation for the Serv SaaS platform.
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization

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
	r.Use(middleware.RateLimitMiddleware(100, time.Minute))

	// Routes
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	v1 := r.Group("/api/v1")
	{
		authGroup := v1.Group("/auth")
		{
			authGroup.POST("/register", auth.RegisterOrganization)
			authGroup.POST("/login", auth.Login)
			authGroup.POST("/staff/login", auth.StaffLogin)
			authGroup.POST("/refresh", auth.Refresh)
			authGroup.POST("/verify-otp", auth.VerifyOTPHandler)
			authGroup.POST("/password-reset/request", auth.RequestPasswordReset)
			authGroup.POST("/password-reset/verify", auth.VerifyPasswordReset)
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
