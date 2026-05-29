package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Customer struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OrganizationID uuid.UUID `gorm:"type:uuid;index;not null"`
	FullName       string    `gorm:"not null"`
	PhoneNumber    string    `gorm:"index"`
	Email          string    `gorm:"index"`
	Address        string
	TotalSpent     float64 `gorm:"type:decimal(12,2);default:0"`
	TotalOrders    int     `gorm:"default:0"`
	Balance        float64 `gorm:"type:decimal(12,2);default:0"` // For future credit management
	LastVisitAt    *time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      gorm.DeletedAt `gorm:"index"`
}
