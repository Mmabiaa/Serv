package database

import (
	"os"

	"github.com/google/uuid"
	"github.com/serv/server/internal/models"
	"github.com/serv/server/pkg"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

func SeedData() {
	username := os.Getenv("SEED_MANAGER_USERNAME")
	pin := os.Getenv("SEED_MANAGER_PIN")
	name := os.Getenv("SEED_MANAGER_NAME")
	email := os.Getenv("SEED_MANAGER_EMAIL")
	orgName := os.Getenv("SEED_ORG_NAME")

	if username == "" || pin == "" || name == "" {
		pkg.Log.Info("Skipping seed: Environment variables not set")
		return
	}

	// Hash the PIN for storage
	hashedPIN, _ := bcrypt.GenerateFromPassword([]byte(pin), bcrypt.DefaultCost)

	// 1. Create Organization if not exists
	var org models.Organization
	err := DB.Where("name = ?", orgName).First(&org).Error
	if err != nil {
		org = models.Organization{
			ID:               uuid.New(),
			Name:             orgName,
			ManagerName:      name,
			PhoneNumber:      "+250780000000",
			BusinessLocation: "Kigali, Rwanda",
			ManagerEmail:     email,
			ManagerPassword:  "DUMMY_PASSWORD_FOR_DB_CONSTRAINT",
			ManagerPIN:       string(hashedPIN),
		}
		if err := DB.Create(&org).Error; err != nil {
			pkg.Log.Error("Failed to seed organization", zap.Error(err))
			return
		}
		pkg.Log.Info("Organization seeded", zap.String("name", orgName))
	}

	// 2. Create Manager User if not exists
	var user models.User
	err = DB.Where("username = ?", username).First(&user).Error
	if err != nil {
		user = models.User{
			ID:             uuid.New(),
			OrganizationID: org.ID,
			FullName:       name,
			Username:       username,
			Email:          email,
			PIN:            string(hashedPIN),
			Role:           "admin", // Admin role acts as Manager
			IsActive:       true,
		}
		if err := DB.Create(&user).Error; err != nil {
			pkg.Log.Error("Failed to seed manager user", zap.Error(err))
			return
		}
		pkg.Log.Info("Manager user seeded", zap.String("username", username))
	}
}
