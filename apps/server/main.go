package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/serv/server/docs"
	"github.com/serv/server/internal/auth"
	"github.com/serv/server/internal/customers"
	"github.com/serv/server/internal/database"
	"github.com/serv/server/internal/inventory"
	"github.com/serv/server/internal/middleware"
	"github.com/serv/server/internal/reports"
	"github.com/serv/server/internal/sales"
	"github.com/serv/server/internal/users"
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

	// Custom Zap middleware
	r.Use(middleware.GinLogger())
	r.Use(middleware.GinRecovery())
	r.Use(middleware.CORSConfig())
	r.Use(middleware.SecurityHeaders())
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

		userGroup := v1.Group("/users")
		userGroup.Use(middleware.AuthMiddleware())
		{
			userGroup.GET("/profile", users.GetProfile)

			// Admin/Manager only actions
			adminGroup := userGroup.Group("")
			adminGroup.Use(middleware.RoleMiddleware("admin", "manager"))
			{
				adminGroup.POST("/staff", users.CreateStaff)
				adminGroup.GET("/staff", users.ListStaff)
				adminGroup.POST("/staff/:id/deactivate", users.DeactivateStaff)
				adminGroup.GET("/activity", users.GetActivityMonitoring)
			}
		}

		// Inventory Routes
		inventoryGroup := v1.Group("/inventory")
		inventoryGroup.Use(middleware.AuthMiddleware())
		{
			// Categories
			inventoryGroup.POST("/categories", inventory.CreateCategory)
			inventoryGroup.GET("/categories", inventory.ListCategories)

			// Products
			inventoryGroup.POST("/products", inventory.CreateProduct)
			inventoryGroup.GET("/products", inventory.ListProducts)

			// Stock Movements
			inventoryGroup.POST("/adjust", inventory.AdjustStock)
			inventoryGroup.GET("/movements", inventory.GetMovementHistory)
		}

		// Sales Routes
		salesGroup := v1.Group("/sales")
		salesGroup.Use(middleware.AuthMiddleware())
		{
			salesGroup.POST("/checkout", sales.Checkout)
			salesGroup.GET("/history", sales.GetSalesHistory)
			salesGroup.GET("/:id", sales.GetSaleDetails)
			salesGroup.POST("/:id/void", sales.VoidSale)
		}

		// Customer Routes
		customerGroup := v1.Group("/customers")
		customerGroup.Use(middleware.AuthMiddleware())
		{
			customerGroup.POST("/", customers.CreateCustomer)
			customerGroup.GET("/", customers.ListCustomers)
			customerGroup.GET("/:id", customers.GetCustomerDetails)
		}

		// Reporting Routes (Manager/Admin Only)
		reportGroup := v1.Group("/reports")
		reportGroup.Use(middleware.AuthMiddleware(), middleware.RoleMiddleware("admin", "manager"))
		{
			reportGroup.GET("/daily", reports.GetDailyReport)
			reportGroup.GET("/summary", reports.GetSummaryReport)
			reportGroup.GET("/top-products", reports.GetTopProducts)
			reportGroup.GET("/staff-performance", reports.GetStaffPerformance)
			reportGroup.GET("/export/sales", reports.ExportSalesReport)
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

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	// Initializing the server in a goroutine so that
	// it won't block the graceful shutdown handling below
	go func() {
		pkg.Log.Info("Server starting", zap.String("port", port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			pkg.Log.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server with
	// a timeout of 5 seconds.
	quit := make(chan os.Signal, 1)
	// kill (no parameter) default send syscall.SIGTERM
	// kill -2 is syscall.SIGINT
	// kill -9 is syscall.SIGKILL but can't be caught, so no need to add it
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	pkg.Log.Info("Shutting down server...")

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		pkg.Log.Fatal("Server forced to shutdown", zap.Error(err))
	}

	pkg.Log.Info("Server exiting")
}
