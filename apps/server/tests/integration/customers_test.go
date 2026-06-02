package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/serv/server/internal/auth"
	"github.com/serv/server/internal/customers"
	"github.com/serv/server/internal/database"
	"github.com/serv/server/internal/middleware"
	"github.com/serv/server/pkg"
	"github.com/stretchr/testify/assert"
)

func setupCustomerTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	v1 := r.Group("/api/v1")
	{
		authGroup := v1.Group("/auth")
		{
			authGroup.POST("/register", auth.RegisterOrganization)
			authGroup.POST("/login", auth.Login)
		}

		custGroup := v1.Group("/customers")
		custGroup.Use(middleware.AuthMiddleware())
		{
			custGroup.POST("/", customers.CreateCustomer)
			custGroup.GET("/", customers.ListCustomers)
			custGroup.GET("/:id", customers.GetCustomerDetails)
		}
	}
	return r
}

func TestCustomerFlow(t *testing.T) {
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
	database.DB.Exec("DELETE FROM customers")
	database.DB.Exec("DELETE FROM users")
	database.DB.Exec("DELETE FROM organizations")

	router := setupCustomerTestRouter()

	// 1. Register & Login
	regReq := auth.RegisterRequest{
		OrganizationName: "Cust Test Org",
		ManagerName:      "Cust Manager",
		PhoneNumber:      "123456789",
		BusinessLocation: "Test Location",
		ManagerEmail:     "cust@test.com",
	}
	jsonBytes, _ := json.Marshal(regReq)
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	loginReq := auth.LoginRequest{Username: "cust@test.com", PIN: "1234"}
	jsonBytes, _ = json.Marshal(loginReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	var loginResp auth.LoginResponse
	json.Unmarshal(w.Body.Bytes(), &loginResp)
	token := loginResp.Token

	// 2. Create Customer
	custReq := customers.CreateCustomerRequest{
		FullName:    "John Doe",
		PhoneNumber: "0555123456",
		Email:       "john@doe.com",
	}
	jsonBytes, _ = json.Marshal(custReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/customers/", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	var custResp customers.CustomerResponse
	json.Unmarshal(w.Body.Bytes(), &custResp)
	assert.Equal(t, "John Doe", custResp.FullName)

	// 3. List Customers
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/customers/?search=John", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	var custList []customers.CustomerResponse
	json.Unmarshal(w.Body.Bytes(), &custList)
	assert.Len(t, custList, 1)
	assert.Equal(t, "John Doe", custList[0].FullName)

	// 4. Get Customer Details
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/customers/"+custResp.ID.String(), nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	var details map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &details)
	profile := details["profile"].(map[string]interface{})
	assert.Equal(t, "John Doe", profile["full_name"])
}
