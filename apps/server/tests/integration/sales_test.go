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
		ManagerPIN:       "1234",
	}
	jsonBytes, _ := json.Marshal(regReq)
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	loginReq := auth.LoginRequest{Username: "sales@test.com", PIN: "1234"}
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

	// 6. Test Supermarket Workflow: Fast Customer Creation during Checkout
	checkReq2 := sales.CheckoutRequest{
		Items: []sales.CartItem{
			{ProductID: prodResp.ID, Quantity: 1},
		},
		PaymentMethod: "CASH",
		CustomerPhone: "0241111111",
		CustomerName:  "Supermarket Customer",
	}
	jsonBytes, _ = json.Marshal(checkReq2)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/sales/checkout", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Verify Customer was created
	var cust1 models.Customer
	err := database.DB.Where("phone_number = ?", "0241111111").First(&cust1).Error
	assert.NoError(t, err)
	assert.Equal(t, "Supermarket Customer", cust1.FullName)
	assert.Equal(t, 1, cust1.TotalOrders)

	// 7. Test Lookup by Name Only
	checkReq3 := sales.CheckoutRequest{
		Items: []sales.CartItem{
			{ProductID: prodResp.ID, Quantity: 1},
		},
		PaymentMethod: "CASH",
		CustomerName:  "Supermarket Customer", // Existing name, no phone
	}
	jsonBytes, _ = json.Marshal(checkReq3)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/sales/checkout", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Verify same customer was used (TotalOrders should be 2)
	database.DB.First(&cust1, "id = ?", cust1.ID)
	assert.Equal(t, 2, cust1.TotalOrders)

	// 8. Test Update Name when Phone matches
	checkReq4 := sales.CheckoutRequest{
		Items: []sales.CartItem{
			{ProductID: prodResp.ID, Quantity: 1},
		},
		PaymentMethod: "CASH",
		CustomerPhone: "0241111111",
		CustomerName:  "Updated Name",
	}
	jsonBytes, _ = json.Marshal(checkReq4)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/sales/checkout", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Verify name was updated
	database.DB.First(&cust1, "id = ?", cust1.ID)
	assert.Equal(t, "Updated Name", cust1.FullName)
	assert.Equal(t, 3, cust1.TotalOrders)

	// 9. Test Update Phone when Name matches
	checkReq5 := sales.CheckoutRequest{
		Items: []sales.CartItem{
			{ProductID: prodResp.ID, Quantity: 1},
		},
		PaymentMethod: "CASH",
		CustomerName:  "Updated Name",
		CustomerPhone: "0242222222", // New phone for existing name
	}
	jsonBytes, _ = json.Marshal(checkReq5)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/sales/checkout", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Verify phone was updated
	database.DB.First(&cust1, "id = ?", cust1.ID)
	assert.Equal(t, "0242222222", cust1.PhoneNumber)
	assert.Equal(t, 4, cust1.TotalOrders)
}
