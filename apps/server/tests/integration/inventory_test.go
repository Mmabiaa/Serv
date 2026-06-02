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
	"github.com/serv/server/pkg"
	"github.com/stretchr/testify/assert"
)

func setupInventoryTestRouter() *gin.Engine {
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
			invGroup.GET("/products", inventory.ListProducts)
			invGroup.GET("/movements", inventory.GetMovementHistory)
		}
	}
	return r
}

func TestInventoryFlow(t *testing.T) {
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
	database.DB.Exec("DELETE FROM inventory_movements")
	database.DB.Exec("DELETE FROM products")
	database.DB.Exec("DELETE FROM categories")
	database.DB.Exec("DELETE FROM users")
	database.DB.Exec("DELETE FROM organizations")

	router := setupInventoryTestRouter()

	// 1. Register & Login
	regReq := auth.RegisterRequest{
		OrganizationName: "Inv Test Org",
		ManagerName:      "Inv Manager",
		PhoneNumber:      "123456789",
		BusinessLocation: "Test Location",
		ManagerEmail:     "inv@test.com",
	}
	jsonBytes, _ := json.Marshal(regReq)
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	loginReq := auth.LoginRequest{Username: "inv@test.com", PIN: "1234"}
	jsonBytes, _ = json.Marshal(loginReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var loginResp auth.LoginResponse
	json.Unmarshal(w.Body.Bytes(), &loginResp)
	token := loginResp.Token

	// 2. Create Category
	catReq := inventory.CreateCategoryRequest{Name: "Beverages", Description: "Drinks"}
	jsonBytes, _ = json.Marshal(catReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/inventory/categories", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	var catResp struct{ ID uuid.UUID }
	json.Unmarshal(w.Body.Bytes(), &catResp)

	// 3. Create Product
	prodReq := inventory.CreateProductRequest{
		CategoryID: catResp.ID,
		Name:       "Coca Cola",
		Price:      2.50,
		Unit:       "bottle",
		Barcode:    "123456789",
	}
	jsonBytes, _ = json.Marshal(prodReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/inventory/products", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	var prodResp struct{ ID uuid.UUID }
	json.Unmarshal(w.Body.Bytes(), &prodResp)

	// 4. Adjust Stock (IN)
	adjReq := inventory.StockAdjustmentRequest{
		ProductID: prodResp.ID,
		Quantity:  100,
		Type:      "IN",
		Reason:    "Initial stock",
	}
	jsonBytes, _ = json.Marshal(adjReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/inventory/adjust", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// 5. Verify Product Quantity
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/inventory/products?search=Coca", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var prodList []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &prodList)
	assert.Equal(t, float64(100), prodList[0]["quantity"])

	// 6. Verify Movement History
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/inventory/movements", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var moveList []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &moveList)
	assert.Len(t, moveList, 1)
	assert.Equal(t, "IN", moveList[0]["type"])
}
