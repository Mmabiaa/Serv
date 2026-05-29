package unit

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/serv/server/internal/auth"
	"github.com/serv/server/internal/middleware"
	"github.com/stretchr/testify/assert"
)

func TestAuthMiddleware(t *testing.T) {
	t.Setenv("JWT_SECRET", "test_secret")
	gin.SetMode(gin.TestMode)

	userID := uuid.New()
	orgID := uuid.New()
	token, _, _ := auth.GenerateToken(userID, orgID, "admin")

	tests := []struct {
		name           string
		token          string
		expectedStatus int
	}{
		{
			name:           "Valid Token",
			token:          "Bearer " + token,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "No Token",
			token:          "",
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Invalid Token",
			token:          "Bearer invalid",
			expectedStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			_, r := gin.CreateTestContext(w)

			r.Use(middleware.AuthMiddleware())
			r.GET("/test", func(c *gin.Context) {
				c.Status(http.StatusOK)
			})

			req, _ := http.NewRequest(http.MethodGet, "/test", nil)
			if tt.token != "" {
				req.Header.Set("Authorization", tt.token)
			}

			r.ServeHTTP(w, req)
			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}
