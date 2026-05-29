package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Organization struct {
	ID               uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name             string    `gorm:"uniqueIndex;not null"`
	ManagerName      string    `gorm:"not null"`
	PhoneNumber      string    `gorm:"not null"`
	BusinessLocation string    `gorm:"not null"`
	ManagerEmail     string    `gorm:"uniqueIndex;not null"`
	ManagerPassword  string    `gorm:"not null"`
	ManagerPIN       string    `gorm:"not null"`
	CreatedAt        time.Time
	UpdatedAt        time.Time
	DeletedAt        gorm.DeletedAt `gorm:"index"`
}

type User struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OrganizationID uuid.UUID `gorm:"type:uuid;index;not null"`
	FullName       string    `gorm:"not null"`
	Username       string    `gorm:"index;not null"`
	PhoneNumber    string
	Email          string
	PIN            string `gorm:"not null"`
	Role           string `gorm:"not null"` // e.g., "admin", "manager", "cashier"
	IsActive       bool   `gorm:"default:true"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      gorm.DeletedAt `gorm:"index"`
}

type UserDevice struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID     uuid.UUID `gorm:"type:uuid;index;not null"`
	DeviceID   string    `gorm:"index;not null"` // Client-generated or browser fingerprint
	DeviceName string
	LastUsedAt time.Time
	IsTrusted  bool `gorm:"default:false"`
	CreatedAt  time.Time
}
