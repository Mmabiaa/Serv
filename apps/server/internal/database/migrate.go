package database

import (
	"log"

	"github.com/serv/server/internal/models"
)

func AutoMigrate() {
	err := DB.AutoMigrate(
		&models.Organization{},
		&models.User{},
		&models.AuditLog{},
	)
	if err != nil {
		log.Fatalf("Migration failed: %v", err)
	}
	log.Println("Database migration completed")
}
