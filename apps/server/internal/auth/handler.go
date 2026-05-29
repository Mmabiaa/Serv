package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/serv/server/internal/database"
	"github.com/serv/server/internal/models"
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

func RegisterOrganization(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.ManagerPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Hash PIN
	hashedPIN, err := bcrypt.GenerateFromPassword([]byte(req.ManagerPIN), bcrypt.DefaultCost)
	if err != nil {
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
	database.DB.Create(&managerUser)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Organization registered successfully",
		"org_id":  org.ID,
	})
}
