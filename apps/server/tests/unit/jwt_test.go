package unit

import (
	"testing"

	"github.com/google/uuid"
	"github.com/serv/server/internal/auth"
	"github.com/stretchr/testify/assert"
)

func TestJWT(t *testing.T) {
	userID := uuid.New()
	orgID := uuid.New()
	role := "admin"

	// Mock JWT_SECRET
	t.Setenv("JWT_SECRET", "test_secret")

	token, refreshToken, err := auth.GenerateToken(userID, orgID, role)
	assert.NoError(t, err)
	assert.NotEmpty(t, token)
	assert.NotEmpty(t, refreshToken)

	claims, err := auth.ValidateToken(token)
	assert.NoError(t, err)
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, orgID, claims.OrganizationID)
	assert.Equal(t, role, claims.Role)
}

func TestInvalidJWT(t *testing.T) {
	t.Setenv("JWT_SECRET", "test_secret")

	_, err := auth.ValidateToken("invalid.token.here")
	assert.Error(t, err)
	assert.Equal(t, auth.ErrInvalidToken, err)
}
