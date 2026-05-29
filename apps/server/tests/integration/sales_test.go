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
	"github.com/serv/server/internal/models"
	"github.com/serv/server/internal/sales"
	"github.com/serv/server/pkg"
	"github.com/stretchr/testify/assert"
)

func setupSalesTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	v1 := r.Group("/api/v1")
	{
		authGroup := v1.Group("/auth")
		{
			authGroup.POST("/register", auth.RegisterOrganization)
			authGroup.POST("/login", auth.Login)
		}

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
			salesGroup.POST("/:id/void", sales.VoidSale)
		}
	}
	return r
}

func TestSalesFlow(t *testing.T) {
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
	database.DB.Exec("DELETE FROM inventory_movements")
	database.DB.Exec("DELETE FROM products")
	database.DB.Exec("DELETE FROM categories")
	database.DB.Exec("DELETE FROM users")
	database.DB.Exec("DELETE FROM organizations")

	router := setupSalesTestRouter()

	// 1. Setup Data (Register -> Login -> Category -> Product -> Stock)
	regReq := auth.RegisterRequest{
		OrganizationName: "Sales Test Org",
		ManagerName:      "Sales Manager",
		PhoneNumber:      "123456789",
		BusinessLocation: "Test Location",
		ManagerEmail:     "sales@test.com",
		ManagerPassword:  "password123",
		ManagerPIN:       "1234",
	}
	jsonBytes, _ := json.Marshal(regReq)
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	loginReq := auth.LoginRequest{Email: "sales@test.com", Password: "password123"}
	jsonBytes, _ = json.Marshal(loginReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	var loginResp auth.LoginResponse
	json.Unmarshal(w.Body.Bytes(), &loginResp)
	token := loginResp.Token

	catReq := inventory.CreateCategoryRequest{Name: "Electronics"}
	jsonBytes, _ = json.Marshal(catReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/inventory/categories", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	var catResp struct{ ID uuid.UUID }
	json.Unmarshal(w.Body.Bytes(), &catResp)

	prodReq := inventory.CreateProductRequest{
		CategoryID: catResp.ID,
		Name:       "iPhone",
		Price:      1000,
		Unit:       "pcs",
	}
	jsonBytes, _ = json.Marshal(prodReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/inventory/products", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	var prodResp struct{ ID uuid.UUID }
	json.Unmarshal(w.Body.Bytes(), &prodResp)

	adjReq := inventory.StockAdjustmentRequest{
		ProductID: prodResp.ID,
		Quantity:  10,
		Type:      "IN",
	}
	jsonBytes, _ = json.Marshal(adjReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/inventory/adjust", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// 2. Checkout
	checkReq := sales.CheckoutRequest{
		Items: []sales.CartItem{
			{ProductID: prodResp.ID, Quantity: 2},
		},
		PaymentMethod: "CASH",
	}
	jsonBytes, _ = json.Marshal(checkReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/sales/checkout", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	var saleResp sales.SaleResponse
	json.Unmarshal(w.Body.Bytes(), &saleResp)

	// 3. Verify Stock Deducted (Should be 10 - 2 = 8)
	var product models.Product
	database.DB.First(&product, "id = ?", prodResp.ID)
	assert.Equal(t, float64(8), product.Quantity)

	// 4. Void Sale (Requires PIN)
	voidReq := sales.VoidSaleRequest{
		PIN:    "1234",
		Reason: "Customer changed mind",
	}
	jsonBytes, _ = json.Marshal(voidReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/sales/"+saleResp.ID.String()+"/void", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// 5. Verify Stock Reverted (Should be 8 + 2 = 10)
	database.DB.First(&product, "id = ?", prodResp.ID)
	assert.Equal(t, float64(10), product.Quantity)
}
