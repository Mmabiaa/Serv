package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/serv/server/internal/database"
	"github.com/serv/server/pkg"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize Logger
	pkg.InitLogger()
	defer pkg.Log.Sync()

	// Initialize Database
	database.InitDB()

	// Initialize Redis
	database.InitRedis()

	// Set Gin mode
	gin.SetMode(os.Getenv("GIN_MODE"))

	r := gin.Default()

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

	log.Printf("Server starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
