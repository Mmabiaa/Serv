package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/serv/server/internal/auth"
	"github.com/serv/server/internal/database"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header must be Bearer token"})
			c.Abort()
			return
		}

		claims, err := auth.ValidateToken(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Store claims in context for later use
		c.Set("user_id", claims.UserID)
		c.Set("org_id", claims.OrganizationID)
		c.Set("role", claims.Role)

		// Extra check: Is user still active?
		// Note: In production, you might want to cache this in Redis to avoid DB hit on every request
		// For now, we'll do a quick DB check or assume token expiry handles it.
		// Let's implement a simple check.
		var userIsActive bool
		err = database.DB.Table("users").Select("is_active").Where("id = ?", claims.UserID).Scan(&userIsActive).Error
		if err == nil && !userIsActive {
			c.JSON(http.StatusForbidden, gin.H{"error": "Account is deactivated"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Role not found in context"})
			c.Abort()
			return
		}

		roleStr := userRole.(string)
		isAllowed := false
		for _, role := range allowedRoles {
			if roleStr == role {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to perform this action"})
			c.Abort()
			return
		}

		c.Next()
	}
}
