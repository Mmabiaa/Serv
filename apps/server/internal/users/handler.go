package users

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/serv/server/internal/database"
	"github.com/serv/server/internal/models"
	"github.com/serv/server/pkg"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type CreateStaffRequest struct {
	FullName    string `json:"full_name" binding:"required"`
	Username    string `json:"username" binding:"required"`
	PhoneNumber string `json:"phone_number"`
	Email       string `json:"email" binding:"required,email"`
	StaffPIN    string `json:"staff_pin" binding:"required,len=4"`
	Role        string `json:"role" binding:"required,oneof=manager cashier"`
}

type UpdateStaffRequest struct {
	FullName    string `json:"full_name"`
	PhoneNumber string `json:"phone_number"`
	Email       string `json:"email" binding:"omitempty,email"`
	Role        string `json:"role" binding:"omitempty,oneof=manager cashier"`
	IsActive    *bool  `json:"is_active"`
}

type UserResponse struct {
	ID             uuid.UUID `json:"id"`
	OrganizationID uuid.UUID `json:"organization_id"`
	FullName       string    `json:"full_name"`
	Username       string    `json:"username"`
	PhoneNumber    string    `json:"phone_number"`
	Email          string    `json:"email"`
	Role           string    `json:"role"`
	IsActive       bool      `json:"is_active"`
}

// CreateStaff godoc
// @Summary Create a new staff member
// @Description Only admins/managers can create staff accounts within their organization
// @Tags users
// @Accept json
// @Produce json
// @Param request body CreateStaffRequest true "Staff details"
// @Success 201 {object} map[string]interface{} "Staff created successfully"
// @Security BearerAuth
// @Router /users/staff [post]
func CreateStaff(c *gin.Context) {
	var req CreateStaffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	orgID, _ := c.Get("org_id")
	adminID, _ := c.Get("user_id")

	// Start Transaction for Atomic creation + Audit Log
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		// Check if username is unique within organization
		var existingUser models.User
		if err := tx.Where("organization_id = ? AND username = ?", orgID, req.Username).First(&existingUser).Error; err == nil {
			return gorm.ErrDuplicatedKey
		}

		// Hash PIN
		hashedPIN, err := bcrypt.GenerateFromPassword([]byte(req.StaffPIN), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		staff := models.User{
			OrganizationID: orgID.(uuid.UUID),
			FullName:       req.FullName,
			Username:       req.Username,
			PhoneNumber:    req.PhoneNumber,
			Email:          req.Email,
			PIN:            string(hashedPIN),
			Role:           req.Role,
			IsActive:       true,
		}

		if err := tx.Create(&staff).Error; err != nil {
			return err
		}

		// Audit Log
		audit := models.AuditLog{
			OrganizationID: orgID.(uuid.UUID),
			UserID:         adminID.(uuid.UUID),
			Action:         "CREATE_STAFF",
			Entity:         "USER",
			EntityID:       staff.ID.String(),
			IPAddress:      c.ClientIP(),
			UserAgent:      c.Request.UserAgent(),
		}

		if err := tx.Create(&audit).Error; err != nil {
			return err
		}

		c.Set("new_staff_id", staff.ID)
		return nil
	})

	if err != nil {
		if err == gorm.ErrDuplicatedKey {
			c.JSON(http.StatusConflict, gin.H{"error": "Username already exists in this organization"})
		} else {
			pkg.Log.Error("failed to create staff user", zap.Error(err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create staff member"})
		}
		return
	}

	newID, _ := c.Get("new_staff_id")
	c.JSON(http.StatusCreated, gin.H{
		"message": "Staff member created successfully",
		"user_id": newID,
	})
}

// ListStaff godoc
// @Summary List all staff members
// @Description Get all staff members for the current organization with pagination and filtering
// @Tags users
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param role query string false "Filter by role"
// @Param search query string false "Search by name or email"
// @Success 200 {array} UserResponse
// @Security BearerAuth
// @Router /users/staff [get]
func ListStaff(c *gin.Context) {
	orgID, _ := c.Get("org_id")

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	// Filtering
	role := c.Query("role")
	search := c.Query("search")

	query := database.DB.Where("organization_id = ?", orgID)

	if role != "" {
		query = query.Where("role = ?", role)
	}

	if search != "" {
		query = query.Where("full_name ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var staff []models.User
	if err := query.Offset(offset).Limit(limit).Find(&staff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch staff members"})
		return
	}

	var resp []UserResponse
	for _, s := range staff {
		resp = append(resp, UserResponse{
			ID:             s.ID,
			OrganizationID: s.OrganizationID,
			FullName:       s.FullName,
			Username:       s.Username,
			PhoneNumber:    s.PhoneNumber,
			Email:          s.Email,
			Role:           s.Role,
			IsActive:       s.IsActive,
		})
	}

	c.JSON(http.StatusOK, resp)
}

// DeactivateStaff godoc
// @Summary Deactivate a staff member
// @Description Toggle active status of a staff member
// @Tags users
// @Param id path string true "User ID"
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /users/staff/{id}/deactivate [post]
func DeactivateStaff(c *gin.Context) {
	userID := c.Param("id")
	orgID, _ := c.Get("org_id")
	adminID, _ := c.Get("user_id")

	var user models.User
	if err := database.DB.Where("id = ? AND organization_id = ?", userID, orgID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Staff member not found"})
		return
	}

	// Toggle active status
	user.IsActive = !user.IsActive
	database.DB.Save(&user)

	// Audit Log
	action := "DEACTIVATE_STAFF"
	if user.IsActive {
		action = "ACTIVATE_STAFF"
	}

	database.DB.Create(&models.AuditLog{
		OrganizationID: orgID.(uuid.UUID),
		UserID:         adminID.(uuid.UUID),
		Action:         action,
		Entity:         "USER",
		EntityID:       user.ID.String(),
		IPAddress:      c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
	})

	c.JSON(http.StatusOK, gin.H{
		"message":   "Staff status updated successfully",
		"is_active": user.IsActive,
	})
}

// GetProfile godoc
// @Summary Get user profile
// @Description Get details of the currently authenticated user
// @Tags users
// @Produce json
// @Success 200 {object} UserResponse
// @Security BearerAuth
// @Router /users/profile [get]
func GetProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, UserResponse{
		ID:             user.ID,
		OrganizationID: user.OrganizationID,
		FullName:       user.FullName,
		Username:       user.Username,
		PhoneNumber:    user.PhoneNumber,
		Email:          user.Email,
		Role:           user.Role,
		IsActive:       user.IsActive,
	})
}

type AuditLogResponse struct {
	ID             uuid.UUID `json:"id"`
	OrganizationID uuid.UUID `json:"organization_id"`
	UserID         uuid.UUID `json:"user_id"`
	Action         string    `json:"action"`
	Entity         string    `json:"entity"`
	EntityID       string    `json:"entity_id"`
	Metadata       string    `json:"metadata"`
	IPAddress      string    `json:"ip_address"`
	UserAgent      string    `json:"user_agent"`
	CreatedAt      time.Time `json:"created_at"`
}

// GetActivityMonitoring godoc
// @Summary Get user activity logs
// @Description Get audit logs for the current organization with pagination
// @Tags users
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {array} AuditLogResponse
// @Security BearerAuth
// @Router /users/activity [get]
func GetActivityMonitoring(c *gin.Context) {
	orgID, _ := c.Get("org_id")

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	var logs []models.AuditLog
	if err := database.DB.Where("organization_id = ?", orgID).Order("created_at desc").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch activity logs"})
		return
	}

	var resp []AuditLogResponse
	for _, l := range logs {
		resp = append(resp, AuditLogResponse{
			ID:             l.ID,
			OrganizationID: l.OrganizationID,
			UserID:         l.UserID,
			Action:         l.Action,
			Entity:         l.Entity,
			EntityID:       l.EntityID,
			Metadata:       l.Metadata,
			IPAddress:      l.IPAddress,
			UserAgent:      l.UserAgent,
			CreatedAt:      l.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, resp)
}
