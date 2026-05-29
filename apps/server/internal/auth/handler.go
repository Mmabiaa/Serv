package auth

import (
	"context"
	"net/http"
	"time"

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

	// Audit Log
	database.DB.Create(&models.AuditLog{
		OrganizationID: org.ID,
		UserID:         managerUser.ID,
		Action:         "REGISTER",
		Entity:         "ORGANIZATION",
		EntityID:       org.ID.String(),
		IPAddress:      c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
	})

	pkg.Log.Info("organization registered", zap.String("org", org.Name), zap.String("manager", org.ManagerEmail))

	c.JSON(http.StatusCreated, gin.H{
		"message": "Organization registered successfully",
		"org_id":  org.ID,
	})
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
	DeviceID string `json:"device_id"` // Optional device tracking
}

type LoginResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
	RequireOTP   bool   `json:"require_otp,omitempty"`
	User         struct {
		ID       string `json:"id"`
		FullName string `json:"full_name"`
		Role     string `json:"role"`
	} `json:"user"`
}

type StaffLoginRequest struct {
	Username string `json:"username" binding:"required"`
	PIN      string `json:"pin" binding:"required,len=4"`
}

// Login godoc
// @Summary Manager login
// @Description Authenticate a manager using email and password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Manager credentials"
// @Success 200 {object} LoginResponse
// @Failure 401 {object} map[string]interface{} "Invalid credentials"
// @Router /auth/login [post]
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	// Rate limiting failed attempts (lockout logic)
	lockoutKey := "lockout:" + req.Email
	ctx := context.Background()
	attempts, _ := database.RedisClient.Get(ctx, lockoutKey).Int()
	if attempts >= 5 {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "Account locked due to too many failed attempts. Try again in 15 minutes."})
		return
	}

	var org models.Organization
	if err := database.DB.Where("manager_email = ?", req.Email).First(&org).Error; err != nil {
		database.RedisClient.Incr(ctx, lockoutKey)
		database.RedisClient.Expire(ctx, lockoutKey, 15*time.Minute)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(org.ManagerPassword), []byte(req.Password)); err != nil {
		database.RedisClient.Incr(ctx, lockoutKey)
		database.RedisClient.Expire(ctx, lockoutKey, 15*time.Minute)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Success - Reset lockout
	database.RedisClient.Del(ctx, lockoutKey)

	// Find the manager user record
	var user models.User
	if err := database.DB.Where("organization_id = ? AND role = 'admin'", org.ID).First(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Manager account not found"})
		return
	}

	// Check for new device (SRS 15.4 / 15.5)
	if req.DeviceID != "" {
		var device models.UserDevice
		err := database.DB.Where("user_id = ? AND device_id = ?", user.ID, req.DeviceID).First(&device).Error
		if err != nil {
			// New device - Trigger OTP (SRS 16.6 Risk Triggers)
			otp, _ := GenerateOTP(user.Email)
			pkg.Log.Info("New device detected, OTP required", zap.String("email", user.Email), zap.String("otp", otp)) // In real app, send via email/SMS

			c.JSON(http.StatusAccepted, LoginResponse{
				RequireOTP: true,
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
			return
		}

		// Update last used
		database.DB.Model(&device).Update("last_used_at", time.Now())
	}

	token, refreshToken, err := GenerateToken(user.ID, user.OrganizationID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Audit Log
	database.DB.Create(&models.AuditLog{
		OrganizationID: user.OrganizationID,
		UserID:         user.ID,
		Action:         "LOGIN",
		Entity:         "USER",
		EntityID:       user.ID.String(),
		IPAddress:      c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
	})

	c.JSON(http.StatusOK, LoginResponse{
		Token:        token,
		RefreshToken: refreshToken,
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

// VerifyPasswordReset godoc
// @Summary Verify password reset
// @Description Verify OTP and reset password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body PasswordResetVerifyRequest true "Reset details"
// @Success 200 {object} map[string]interface{} "Password reset successful"
// @Failure 401 {object} map[string]interface{} "Invalid OTP"
// @Router /auth/password-reset/verify [post]
func VerifyPasswordReset(c *gin.Context) {
	var req PasswordResetVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	valid, err := VerifyOTP(req.Email, req.OTP)
	if err != nil || !valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	// Fetch user
	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Fetch organization for manager password update
	var org models.Organization
	if err := database.DB.First(&org, "id = ?", user.OrganizationID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify organization"})
		return
	}

	// Hash new password
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)

	// Update organization password
	if err := database.DB.Model(&org).Update("manager_password", string(hashedPassword)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	// Audit Log
	database.DB.Create(&models.AuditLog{
		OrganizationID: user.OrganizationID,
		UserID:         user.ID,
		Action:         "PASSWORD_RESET",
		Entity:         "USER",
		EntityID:       user.ID.String(),
		IPAddress:      c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
	})

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successful"})
}

type VerifyOTPRequest struct {
	Email    string `json:"email" binding:"required,email"`
	OTP      string `json:"otp" binding:"required,len=6"`
	DeviceID string `json:"device_id" binding:"required"`
}

// VerifyOTP godoc
// @Summary Verify OTP and trust device
// @Description Verify OTP for a new device and mark it as trusted
// @Tags auth
// @Accept json
// @Produce json
// @Param request body VerifyOTPRequest true "OTP verification details"
// @Success 200 {object} LoginResponse
// @Failure 401 {object} map[string]interface{} "Invalid OTP"
// @Router /auth/verify-otp [post]
func VerifyOTPHandler(c *gin.Context) {
	var req VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	valid, err := VerifyOTP(req.Email, req.OTP)
	if err != nil || !valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	// Fetch user
	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Trust the device
	device := models.UserDevice{
		UserID:     user.ID,
		DeviceID:   req.DeviceID,
		IsTrusted:  true,
		LastUsedAt: time.Now(),
	}
	database.DB.Create(&device)

	token, refreshToken, err := GenerateToken(user.ID, user.OrganizationID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{
		Token:        token,
		RefreshToken: refreshToken,
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

// StaffLogin godoc
// @Summary Staff login
// @Description Authenticate a staff member using PIN
// @Tags auth
// @Accept json
// @Produce json
// @Param request body StaffLoginRequest true "Staff credentials"
// @Success 200 {object} LoginResponse
// @Failure 401 {object} map[string]interface{} "Invalid credentials"
// @Router /auth/staff/login [post]
func StaffLogin(c *gin.Context) {
	var req StaffLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	// Rate limiting failed attempts
	lockoutKey := "lockout_staff:" + req.Username
	ctx := context.Background()
	attempts, _ := database.RedisClient.Get(ctx, lockoutKey).Int()
	if attempts >= 5 {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "Account locked. Try again in 15 minutes."})
		return
	}

	var user models.User
	if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		database.RedisClient.Incr(ctx, lockoutKey)
		database.RedisClient.Expire(ctx, lockoutKey, 15*time.Minute)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check PIN (stored as bcrypt hash)
	if err := bcrypt.CompareHashAndPassword([]byte(user.PIN), []byte(req.PIN)); err != nil {
		database.RedisClient.Incr(ctx, lockoutKey)
		database.RedisClient.Expire(ctx, lockoutKey, 15*time.Minute)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Success - Reset lockout
	database.RedisClient.Del(ctx, lockoutKey)

	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account is deactivated"})
		return
	}

	token, refreshToken, err := GenerateToken(user.ID, user.OrganizationID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Audit Log
	database.DB.Create(&models.AuditLog{
		OrganizationID: user.OrganizationID,
		UserID:         user.ID,
		Action:         "STAFF_LOGIN",
		Entity:         "USER",
		EntityID:       user.ID.String(),
		IPAddress:      c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
	})

	c.JSON(http.StatusOK, LoginResponse{
		Token:        token,
		RefreshToken: refreshToken,
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

// StaffLogin godoc
// @Summary Staff login
// @Description Authenticate a staff member using PIN
// @Tags auth
// @Accept json
// @Produce json
// @Param request body StaffLoginRequest true "Staff credentials"
// @Success 200 {object} LoginResponse
// @Failure 401 {object} map[string]interface{} "Invalid credentials"
// @Router /auth/staff/login [post]
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// Refresh godoc
// @Summary Refresh access token
// @Description Get a new access token using a refresh token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body RefreshRequest true "Refresh token"
// @Success 200 {object} LoginResponse
// @Failure 401 {object} map[string]interface{} "Invalid refresh token"
// @Router /auth/refresh [post]
type PasswordResetRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type PasswordResetVerifyRequest struct {
	Email       string `json:"email" binding:"required,email"`
	OTP         string `json:"otp" binding:"required,len=6"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

// RequestPasswordReset godoc
// @Summary Request password reset
// @Description Send OTP to email for password reset
// @Tags auth
// @Accept json
// @Produce json
// @Param request body PasswordResetRequest true "Email details"
// @Success 200 {object} map[string]interface{} "OTP sent"
// @Router /auth/password-reset/request [post]
func RequestPasswordReset(c *gin.Context) {
	var req PasswordResetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	// Check if user exists
	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		// Don't reveal if user exists for security
		c.JSON(http.StatusOK, gin.H{"message": "If the email exists, an OTP has been sent"})
		return
	}

	otp, _ := GenerateOTP(user.Email)
	pkg.Log.Info("Password reset OTP generated", zap.String("email", user.Email), zap.String("otp", otp))

	c.JSON(http.StatusOK, gin.H{"message": "If the email exists, an OTP has been sent"})
}

// Refresh godoc
// @Summary Refresh access token
// @Description Get a new access token using a refresh token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body RefreshRequest true "Refresh token"
// @Success 200 {object} LoginResponse
// @Failure 401 {object} map[string]interface{} "Invalid refresh token"
// @Router /auth/refresh [post]
func Refresh(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	claims, err := ValidateToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired refresh token"})
		return
	}

	// Fetch user to ensure they still exist and are active
	var user models.User
	if err := database.DB.First(&user, "id = ?", claims.UserID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account is deactivated"})
		return
	}

	token, refreshToken, err := GenerateToken(user.ID, user.OrganizationID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{
		Token:        token,
		RefreshToken: refreshToken,
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
