package models

import (
	"time"

	"github.com/google/uuid"
)

type AuditLog struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OrganizationID uuid.UUID `gorm:"type:uuid;index;not null"`
	UserID         uuid.UUID `gorm:"type:uuid;index"`
	Action         string    `gorm:"not null"` // e.g., "LOGIN", "VOID_TRANSACTION"
	Entity         string    `gorm:"not null"` // e.g., "USER", "TRANSACTION"
	EntityID       string    `gorm:"index"`
	Metadata       string    `gorm:"type:text"` // JSON metadata
	IPAddress      string
	UserAgent      string
	CreatedAt      time.Time `gorm:"index"`
}
