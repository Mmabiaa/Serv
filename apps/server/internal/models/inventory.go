package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Category struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OrganizationID uuid.UUID `gorm:"type:uuid;index;not null"`
	Name             string    `gorm:"not null"`
	Description      string
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      gorm.DeletedAt `gorm:"index"`
}

type Product struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OrganizationID uuid.UUID `gorm:"type:uuid;index;not null"`
	CategoryID     uuid.UUID `gorm:"type:uuid;index;not null"`
	Name             string    `gorm:"not null"`
	Description      string
	SKU              string    `gorm:"index"` // Stock Keeping Unit
	Barcode          string    `gorm:"index"`
	Price            float64   `gorm:"type:decimal(10,2);not null"`
	CostPrice        float64   `gorm:"type:decimal(10,2)"`
	ImageURL         string
	Quantity         float64   `gorm:"type:decimal(10,3);default:0"` // Supports fractional units (kg, liters)
	MinStockLevel    float64   `gorm:"type:decimal(10,3);default:0"`
	Unit             string    `gorm:"default:'pcs'"` // pcs, kg, l, etc.
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      gorm.DeletedAt `gorm:"index"`
}

type InventoryMovement struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OrganizationID uuid.UUID `gorm:"type:uuid;index;not null"`
	ProductID      uuid.UUID `gorm:"type:uuid;index;not null"`
	UserID         uuid.UUID `gorm:"type:uuid;index;not null"`
	Type           string    `gorm:"not null"` // IN, OUT, ADJUSTMENT, SALE, RETURN
	Quantity       float64   `gorm:"type:decimal(10,3);not null"`
	PreviousQty    float64   `gorm:"type:decimal(10,3);not null"`
	NewQty         float64   `gorm:"type:decimal(10,3);not null"`
	Reason         string
	ReferenceID    string    `gorm:"index"` // e.g., Sale ID or Purchase Order ID
	CreatedAt      time.Time `gorm:"index"`
}
