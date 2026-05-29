package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/serv/server/internal/auth"
	"github.com/serv/server/internal/database"
	"github.com/serv/server/internal/middleware"
	"github.com/serv/server/internal/users"
	"github.com/serv/server/pkg"
	"github.com/stretchr/testify/assert"
)

func setupUserTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	v1 := r.Group("/api/v1")
	{
		authGroup := v1.Group("/auth")
		{
			authGroup.POST("/register", auth.RegisterOrganization)
			authGroup.POST("/login", auth.Login)
		}

		userGroup := v1.Group("/users")
		userGroup.Use(middleware.AuthMiddleware())
		{
			userGroup.GET("/profile", users.GetProfile)
			adminGroup := userGroup.Group("")
			adminGroup.Use(middleware.RoleMiddleware("admin", "manager"))
			{
				adminGroup.POST("/staff", users.CreateStaff)
				adminGroup.GET("/staff", users.ListStaff)
				adminGroup.POST("/staff/:id/deactivate", users.DeactivateStaff)
			}
		}
	}
	return r
}

func TestUserManagementFlow(t *testing.T) {
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

	// Initialize dependencies
	pkg.InitLogger("development")
	database.InitDB()
	database.InitRedis()
	database.AutoMigrate()

	// Clean up
	database.DB.Exec("DELETE FROM audit_logs")
	database.DB.Exec("DELETE FROM users")
	database.DB.Exec("DELETE FROM organizations")

	router := setupUserTestRouter()

	// 1. Register and Login as Admin
	regReq := auth.RegisterRequest{
		OrganizationName: "User Test Org",
		ManagerName:      "Admin User",
		PhoneNumber:      "123456789",
		BusinessLocation: "Test Location",
		ManagerEmail:     "admin@test.com",
		ManagerPassword:  "password123",
		ManagerPIN:       "1234",
	}
	jsonBytes, _ := json.Marshal(regReq)
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	loginReq := auth.LoginRequest{
		Email:    "admin@test.com",
		Password: "password123",
	}
	jsonBytes, _ = json.Marshal(loginReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var loginResp auth.LoginResponse
	json.Unmarshal(w.Body.Bytes(), &loginResp)
	token := loginResp.Token

	// 2. Create Staff member
	staffReq := users.CreateStaffRequest{
		FullName:    "Cashier One",
		Username:    "cashier1",
		PhoneNumber: "987654321",
		Email:       "cashier1@test.com",
		StaffPIN:    "1111",
		Role:        "cashier",
	}
	jsonBytes, _ = json.Marshal(staffReq)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/users/staff", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	var staffCreateResp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &staffCreateResp)
	staffID := staffCreateResp["user_id"].(string)

	// 3. List Staff members
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/users/staff", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	var staffList []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &staffList)
	assert.GreaterOrEqual(t, len(staffList), 2) // Admin + Cashier

	// 4. Deactivate Staff member
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/users/staff/"+staffID+"/deactivate", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	var deactivateResp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &deactivateResp)
	assert.Equal(t, false, deactivateResp["is_active"])

	// 5. Get Own Profile
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/users/profile", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	var profile map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &profile)
	assert.Equal(t, "admin@test.com", profile["email"])
}
