package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Sale struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OrganizationID uuid.UUID  `gorm:"type:uuid;index;not null"`
	UserID         uuid.UUID  `gorm:"type:uuid;index;not null"` // Cashier ID
	CustomerID     *uuid.UUID `gorm:"type:uuid;index"`
	CustomerName   string     // Snapshot for receipt
	CustomerPhone  string     // Snapshot for receipt
	TotalAmount    float64    `gorm:"type:decimal(10,2);not null"`
	TaxAmount      float64    `gorm:"type:decimal(10,2);default:0"`
	DiscountAmount float64    `gorm:"type:decimal(10,2);default:0"`
	SubTotal       float64    `gorm:"type:decimal(10,2);not null"`
	Status         string     `gorm:"default:'COMPLETED'"` // COMPLETED, VOIDED, REFUNDED
	PaymentMethod  string     `gorm:"not null"`            // CASH, MOMO, CARD
	ReceiptNumber  string     `gorm:"uniqueIndex;not null"`
	CreatedAt      time.Time  `gorm:"index"`
	UpdatedAt      time.Time
	DeletedAt      gorm.DeletedAt `gorm:"index"`
	Items          []SaleItem     `gorm:"foreignKey:SaleID"`
}

type SaleItem struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SaleID         uuid.UUID `gorm:"type:uuid;index;not null"`
	ProductID      uuid.UUID `gorm:"type:uuid;index;not null"`
	ProductName    string    `gorm:"not null"`
	Quantity       float64   `gorm:"type:decimal(10,3);not null"`
	UnitPrice      float64   `gorm:"type:decimal(10,2);not null"`
	TotalPrice     float64   `gorm:"type:decimal(10,2);not null"`
	DiscountAmount float64   `gorm:"type:decimal(10,2);default:0"`
	CreatedAt      time.Time
}

type Payment struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SaleID         uuid.UUID `gorm:"type:uuid;index;not null"`
	OrganizationID uuid.UUID `gorm:"type:uuid;index;not null"`
	Amount         float64   `gorm:"type:decimal(10,2);not null"`
	Method         string    `gorm:"not null"` // CASH, MOMO, CARD
	Reference      string    // Transaction reference for MOMO/CARD
	Status         string    `gorm:"default:'SUCCESS'"`
	CreatedAt      time.Time
}
