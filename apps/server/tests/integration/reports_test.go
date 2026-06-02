package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/serv/server/internal/auth"
	"github.com/serv/server/internal/database"
	"github.com/serv/server/internal/inventory"
	"github.com/serv/server/internal/middleware"
	"github.com/serv/server/internal/reports"
	"github.com/serv/server/internal/sales"
	"github.com/serv/server/pkg"
	"github.com/stretchr/testify/assert"
)

func setupReportsTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	v1 := r.Group("/api/v1")
	{
		v1.POST("/auth/register", auth.RegisterOrganization)
		v1.POST("/auth/login", auth.Login)

		invGroup := v1.Group("/inventory")
		invGroup.Use(middleware.AuthMiddleware())
		{
			invGroup.POST("/categories", inventory.CreateCategory)
			invGroup.POST("/products", inventory.CreateProduct)
			invGroup.POST("/adjust", inventory.AdjustStock)
		}

		salesGroup := v1.Group("/sales")
		salesGroup.Use(middleware.AuthMiddleware())
		{
			salesGroup.POST("/checkout", sales.Checkout)
		}

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
	return r
}

func TestReportingFlow(t *testing.T) {
	// Setup env
	t.Setenv("JWT_SECRET", "test_secret")
	t.Setenv("DB_HOST", "localhost")
	t.Setenv("DB_PORT", "5432")
	t.Setenv("DB_USER", "serv_user")
	t.Setenv("DB_PASSWORD", "serv_password")
	t.Setenv("DB_NAME", "serv_db")
	t.Setenv("DB_SSLMODE", "disable")
	t.Setenv("REDIS_HOST", "localhost")
	t.Setenv("REDIS_PORT", "6379")
	t.Setenv("REDIS_PASSWORD", "")

	pkg.InitLogger("development")
	database.InitDB()
	database.InitRedis()
	database.AutoMigrate()

	// Clean up
	database.DB.Exec("DELETE FROM payments")
	database.DB.Exec("DELETE FROM sale_items")
	database.DB.Exec("DELETE FROM sales")
	database.DB.Exec("DELETE FROM products")
	database.DB.Exec("DELETE FROM categories")
	database.DB.Exec("DELETE FROM users")
	database.DB.Exec("DELETE FROM organizations")

	router := setupReportsTestRouter()

	// 1. Setup: Register and Login
	regReq := struct {
		OrganizationName string `json:"organization_name"`
		ManagerName      string `json:"manager_name"`
		PhoneNumber      string `json:"phone_number"`
		BusinessLocation string `json:"business_location"`
		ManagerEmail     string `json:"manager_email"`
		ManagerPassword  string `json:"manager_password"`
		ManagerPIN       string `json:"manager_security_pin"`
	}{
		OrganizationName: "Report Org",
		ManagerName:      "Manager",
		PhoneNumber:      "111111111",
		BusinessLocation: "Test Location",
		ManagerEmail:     "mgr@test.com",
		ManagerPassword:  "password123",
		ManagerPIN:       "1234",
	}
	jsonBytes, _ := json.Marshal(regReq)
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	loginReq := auth.LoginRequest{Username: "mgr@test.com", PIN: "1234"}
	jsonBytes, _ = json.Marshal(loginReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	var loginResp auth.LoginResponse
	json.Unmarshal(w.Body.Bytes(), &loginResp)
	token := loginResp.Token

	// 2. Setup: Product and Sales
	catReq := inventory.CreateCategoryRequest{Name: "Reports Cat"}
	jsonBytes, _ = json.Marshal(catReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/inventory/categories", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	var catResp struct{ ID uuid.UUID }
	json.Unmarshal(w.Body.Bytes(), &catResp)

	prodReq := inventory.CreateProductRequest{CategoryID: catResp.ID, Name: "Test Prod", Price: 100}
	jsonBytes, _ = json.Marshal(prodReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/inventory/products", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	var prodResp struct{ ID uuid.UUID }
	json.Unmarshal(w.Body.Bytes(), &prodResp)

	adjReq := inventory.StockAdjustmentRequest{ProductID: prodResp.ID, Quantity: 100, Type: "IN"}
	jsonBytes, _ = json.Marshal(adjReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/inventory/adjust", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Make some sales
	checkReq := sales.CheckoutRequest{
		Items:         []sales.CartItem{{ProductID: prodResp.ID, Quantity: 2}},
		PaymentMethod: "CASH",
	}
	for i := 0; i < 3; i++ {
		jsonBytes, _ = json.Marshal(checkReq)
		req, _ = http.NewRequest(http.MethodPost, "/api/v1/sales/checkout", bytes.NewBuffer(jsonBytes))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}

	// 3. Verify Reports
	// Daily Report
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/reports/daily", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	var dailyResults []reports.DailySalesReport
	json.Unmarshal(w.Body.Bytes(), &dailyResults)
	assert.NotEmpty(t, dailyResults)
	assert.Greater(t, dailyResults[0].TotalSales, 0.0)

	// Top Products
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/reports/top-products", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	var topProducts []reports.ProductSalesPerformance
	json.Unmarshal(w.Body.Bytes(), &topProducts)
	assert.NotEmpty(t, topProducts)
	assert.Equal(t, "Test Prod", topProducts[0].ProductName)

	// Staff Performance
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/reports/staff-performance", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	var staffPerf []reports.StaffPerformance
	json.Unmarshal(w.Body.Bytes(), &staffPerf)
	assert.NotEmpty(t, staffPerf)

	// Export CSV
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/reports/export/sales", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "text/csv", w.Header().Get("Content-Type"))
	assert.Contains(t, w.Body.String(), "Receipt Number")
}
