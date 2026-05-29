package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/serv/server/internal/database"
	"github.com/serv/server/internal/models"
	"github.com/serv/server/pkg"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	OrganizationName string `json:"organization_name" binding:"required"`
	ManagerName      string `json:"manager_name" binding:"required"`
	PhoneNumber      string `json:"phone_number" binding:"required"`
	BusinessLocation string `json:"business_location" binding:"required"`
	ManagerEmail     string `json:"manager_email" binding:"required,email"`
	ManagerPassword  string `json:"manager_password" binding:"required,min=8"`
	ManagerPIN       string `json:"manager_security_pin" binding:"required,len=4"`
}

// RegisterOrganization godoc
// @Summary Register a new organization
// @Description Register a new organization and its manager user
// @Tags auth
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "Registration details"
// @Success 201 {object} map[string]interface{} "Organization registered successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 409 {object} map[string]interface{} "Organization or Email already exists"
// @Failure 422 {object} map[string]interface{} "Validation error"
// @Router /auth/register [post]
func RegisterOrganization(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.ManagerPassword), bcrypt.DefaultCost)
	if err != nil {
		pkg.Log.Error("failed to hash password", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Hash PIN
	hashedPIN, err := bcrypt.GenerateFromPassword([]byte(req.ManagerPIN), bcrypt.DefaultCost)
	if err != nil {
		pkg.Log.Error("failed to hash PIN", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash PIN"})
		return
	}

	org := models.Organization{
		Name:             req.OrganizationName,
		ManagerName:      req.ManagerName,
		PhoneNumber:      req.PhoneNumber,
		BusinessLocation: req.BusinessLocation,
		ManagerEmail:     req.ManagerEmail,
		ManagerPassword:  string(hashedPassword),
		ManagerPIN:       string(hashedPIN),
	}

	if err := database.DB.Create(&org).Error; err != nil {
		pkg.Log.Warn("organization registration failed", zap.String("email", req.ManagerEmail), zap.Error(err))
		c.JSON(http.StatusConflict, gin.H{"error": "Organization or Email already exists"})
		return
	}

	// Create a corresponding User record for the manager
	managerUser := models.User{
		OrganizationID: org.ID,
		FullName:       org.ManagerName,
		Username:       org.ManagerEmail, // Managers use email as username
		Email:          org.ManagerEmail,
		PIN:            org.ManagerPIN, // Store the hashed PIN
		Role:           "admin",        // Managers are admins
	}
	if err := database.DB.Create(&managerUser).Error; err != nil {
		pkg.Log.Error("failed to create manager user", zap.Error(err))
	}

	pkg.Log.Info("organization registered", zap.String("org", org.Name), zap.String("manager", org.ManagerEmail))

	c.JSON(http.StatusCreated, gin.H{
		"message": "Organization registered successfully",
		"org_id":  org.ID,
	})
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
	User         struct {
		ID       string `json:"id"`
		FullName string `json:"full_name"`
		Role     string `json:"role"`
	} `json:"user"`
}

// Login godoc
// @Summary User login
// @Description Authenticate a manager/staff member
// @Tags auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login credentials"
// @Success 200 {object} LoginResponse
// @Failure 401 {object} map[string]interface{} "Invalid credentials"
// @Router /auth/login [post]
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("username = ? OR email = ?", req.Email, req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// For managers (admins), check organization password
	var org models.Organization
	if err := database.DB.First(&org, "id = ?", user.OrganizationID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify organization"})
		return
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(org.ManagerPassword), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token, err := GenerateToken(user.ID, user.OrganizationID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{
		Token: token,
		User: struct {
			ID       string `json:"id"`
			FullName string `json:"full_name"`
			Role     string `json:"role"`
		}{
			ID:       user.ID.String(),
			FullName: user.FullName,
			Role:     user.Role,
		},
	})
}
