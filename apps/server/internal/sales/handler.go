package sales

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/serv/server/internal/database"
	"github.com/serv/server/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type CartItem struct {
	ProductID uuid.UUID `json:"product_id" binding:"required"`
	Quantity  float64   `json:"quantity" binding:"required,gt=0"`
	Discount  float64   `json:"discount"`
}

type CheckoutRequest struct {
	Items         []CartItem `json:"items" binding:"required,min=1"`
	PaymentMethod string     `json:"payment_method" binding:"required,oneof=CASH MOMO CARD"`
	CustomerID    *uuid.UUID `json:"customer_id"`
	CustomerPhone string     `json:"customer_phone"` // For fast lookup/creation
	CustomerName  string     `json:"customer_name"`  // Optional for creation
	TotalDiscount float64    `json:"total_discount"`
}

type SaleResponse struct {
	ID            uuid.UUID         `json:"id"`
	ReceiptNumber string            `json:"receipt_number"`
	CustomerName  string            `json:"customer_name"`
	CustomerPhone string            `json:"customer_phone"`
	TotalAmount   float64           `json:"total_amount"`
	SubTotal      float64           `json:"sub_total"`
	TaxAmount     float64           `json:"tax_amount"`
	PaymentMethod string            `json:"payment_method"`
	CreatedAt     time.Time         `json:"created_at"`
	Items         []models.SaleItem `json:"items"`
}

// Checkout godoc
// @Summary Process a new sale
// @Description Deduct inventory, record sale, and generate receipt atomically
// @Tags sales
// @Accept json
// @Produce json
// @Param request body CheckoutRequest true "Checkout details"
// @Success 201 {object} SaleResponse
// @Security BearerAuth
// @Router /sales/checkout [post]
func Checkout(c *gin.Context) {
	var req CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	orgID, _ := c.Get("org_id")
	userID, _ := c.Get("user_id")

	var sale models.Sale
	receiptNum := fmt.Sprintf("REC-%d", time.Now().UnixNano())

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var subTotal float64
		var totalDiscount float64 = req.TotalDiscount
		var saleItems []models.SaleItem

		for _, item := range req.Items {
			var product models.Product
			// Row-level lock to prevent race conditions during checkout
			if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&product, "id = ? AND organization_id = ?", item.ProductID, orgID).Error; err != nil {
				return fmt.Errorf("product %s not found", item.ProductID)
			}

			if product.Quantity < item.Quantity {
				return fmt.Errorf("insufficient stock for product %s", product.Name)
			}

			// Calculate item price
			itemTotal := product.Price * item.Quantity
			itemDiscount := item.Discount
			itemFinalTotal := itemTotal - itemDiscount
			subTotal += itemFinalTotal

			// 1. Deduct stock
			newQty := product.Quantity - item.Quantity
			if err := tx.Model(&product).Update("quantity", newQty).Error; err != nil {
				return err
			}

			// 2. Record inventory movement
			movement := models.InventoryMovement{
				OrganizationID: orgID.(uuid.UUID),
				ProductID:      product.ID,
				UserID:         userID.(uuid.UUID),
				Type:           "SALE",
				Quantity:       item.Quantity,
				PreviousQty:    product.Quantity + item.Quantity, // Before deduction
				NewQty:         newQty,
				ReferenceID:    receiptNum,
				Reason:         "Sale Transaction",
			}
			if err := tx.Create(&movement).Error; err != nil {
				return err
			}

			saleItems = append(saleItems, models.SaleItem{
				ProductID:      product.ID,
				ProductName:    product.Name,
				Quantity:       item.Quantity,
				UnitPrice:      product.Price,
				TotalPrice:     itemFinalTotal,
				DiscountAmount: itemDiscount,
			})
		}

		// Calculate Taxes (Ghana VAT 15% + NHIL 2.5% + GETFund 2.5% = ~20%)
		// For simplicity let's stick to 15% or as requested (user mentioned professional supermarket receipt)
		taxRate := 0.15
		taxAmount := subTotal * taxRate
		finalTotal := subTotal + taxAmount

		// 3. Handle Customer Lookup/Creation/Update (Phone number primary lookup)
		var customerID *uuid.UUID
		customerName := req.CustomerName
		customerPhone := req.CustomerPhone

		if customerPhone != "" {
			var customer models.Customer

			if err := tx.Where("organization_id = ? AND phone_number = ?", orgID, customerPhone).First(&customer).Error; err == nil {
				// Update name if provided and different
				if customerName != "" && customer.FullName != customerName {
					customer.FullName = customerName
					tx.Save(&customer)
				}
				customerName = customer.FullName
				customerID = &customer.ID
			} else {
				// Create new customer
				if customerName == "" {
					customerName = "Customer " + customerPhone
				}
				customer = models.Customer{
					OrganizationID: orgID.(uuid.UUID),
					FullName:       customerName,
					PhoneNumber:    customerPhone,
				}
				if err := tx.Create(&customer).Error; err == nil {
					customerID = &customer.ID
				}
			}
		}

		// 4. Create Sale record
		sale = models.Sale{
			OrganizationID: orgID.(uuid.UUID),
			UserID:         userID.(uuid.UUID),
			CustomerID:     customerID,
			CustomerName:   customerName,
			CustomerPhone:  customerPhone,
			SubTotal:       subTotal,
			TaxAmount:      taxAmount,
			DiscountAmount: totalDiscount,
			TotalAmount:    finalTotal - totalDiscount,
			Status:         "COMPLETED",
			PaymentMethod:  req.PaymentMethod,
			ReceiptNumber:  receiptNum,
			Items:          saleItems,
		}
		if err := tx.Create(&sale).Error; err != nil {
			return err
		}

		// 5. Update Customer Statistics
		if customerID != nil {
			tx.Model(&models.Customer{}).Where("id = ?", customerID).Updates(map[string]interface{}{
				"total_spent":   gorm.Expr("total_spent + ?", sale.TotalAmount),
				"total_orders":  gorm.Expr("total_orders + 1"),
				"last_visit_at": time.Now(),
			})
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Response matching DetailedSaleResponse for printing
	c.JSON(http.StatusCreated, SaleResponse{
		ID:            sale.ID,
		ReceiptNumber: sale.ReceiptNumber,
		CustomerName:  sale.CustomerName,
		CustomerPhone: sale.CustomerPhone,
		TotalAmount:   sale.TotalAmount,
		SubTotal:      sale.SubTotal,
		TaxAmount:     sale.TaxAmount,
		PaymentMethod: sale.PaymentMethod,
		CreatedAt:     sale.CreatedAt,
		Items:         sale.Items,
	})
}

type VoidSaleRequest struct {
	PIN    string `json:"pin" binding:"required,len=4"`
	Reason string `json:"reason" binding:"required"`
}

// VoidSale godoc
// @Summary Void a sale
// @Description Revert inventory and mark sale as voided. Requires Manager/Admin PIN.
// @Tags sales
// @Accept json
// @Produce json
// @Param id path string true "Sale ID"
// @Param request body VoidSaleRequest true "Void details"
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /sales/{id}/void [post]
func VoidSale(c *gin.Context) {
	saleID := c.Param("id")
	var req VoidSaleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	orgID, _ := c.Get("org_id")
	userID, _ := c.Get("user_id")

	// 1. Verify Manager PIN (SRS 16.1)
	var manager models.User
	if err := database.DB.First(&manager, "id = ? AND organization_id = ?", userID, orgID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(manager.PIN), []byte(req.PIN)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid PIN"})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var sale models.Sale
		if err := tx.Preload("Items").First(&sale, "id = ? AND organization_id = ?", saleID, orgID).Error; err != nil {
			return err
		}

		if sale.Status == "VOIDED" {
			return fmt.Errorf("sale is already voided")
		}

		// 2. Revert Inventory
		for _, item := range sale.Items {
			var product models.Product
			if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&product, "id = ?", item.ProductID).Error; err != nil {
				continue // Skip if product deleted
			}

			newQty := product.Quantity + item.Quantity
			tx.Model(&product).Update("quantity", newQty)

			// Record Reversal Movement
			tx.Create(&models.InventoryMovement{
				OrganizationID: orgID.(uuid.UUID),
				ProductID:      product.ID,
				UserID:         userID.(uuid.UUID),
				Type:           "RETURN",
				Quantity:       item.Quantity,
				PreviousQty:    product.Quantity - item.Quantity,
				NewQty:         newQty,
				ReferenceID:    sale.ReceiptNumber,
				Reason:         "Voided Sale: " + req.Reason,
			})
		}

		// 3. Update Sale Status
		tx.Model(&sale).Update("status", "VOIDED")

		// 4. Audit Log
		audit := models.AuditLog{
			OrganizationID: orgID.(uuid.UUID),
			UserID:         userID.(uuid.UUID),
			Action:         "VOID_SALE",
			Entity:         "SALE",
			EntityID:       sale.ID.String(),
			Metadata:       req.Reason,
			IPAddress:      c.ClientIP(),
			UserAgent:      c.Request.UserAgent(),
		}
		return tx.Create(&audit).Error
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Sale voided successfully"})
}

type SaleItemResponse struct {
	ID             uuid.UUID `json:"id"`
	ProductID      uuid.UUID `json:"product_id"`
	ProductName    string    `json:"product_name"`
	Quantity       float64   `json:"quantity"`
	UnitPrice      float64   `json:"unit_price"`
	TotalPrice     float64   `json:"total_price"`
	DiscountAmount float64   `json:"discount_amount"`
}

type DetailedSaleResponse struct {
	ID             uuid.UUID          `json:"id"`
	ReceiptNumber  string             `json:"receipt_number"`
	CustomerName   string             `json:"customer_name"`
	CustomerPhone  string             `json:"customer_phone"`
	TotalAmount    float64            `json:"total_amount"`
	SubTotal       float64            `json:"sub_total"`
	TaxAmount      float64            `json:"tax_amount"`
	DiscountAmount float64            `json:"discount_amount"`
	Status         string             `json:"status"`
	PaymentMethod  string             `json:"payment_method"`
	CreatedAt      time.Time          `json:"created_at"`
	Items          []SaleItemResponse `json:"items"`
}

// GetSalesHistory godoc
// @Summary Get sales history with pagination
// @Tags sales
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {array} DetailedSaleResponse
// @Security BearerAuth
// @Router /sales/history [get]
func GetSalesHistory(c *gin.Context) {
	orgID, _ := c.Get("org_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	var sales []models.Sale
	if err := database.DB.Preload("Items").Where("organization_id = ?", orgID).Order("created_at desc").Offset(offset).Limit(limit).Find(&sales).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sales history"})
		return
	}

	var resp []DetailedSaleResponse
	for _, s := range sales {
		var items []SaleItemResponse
		for _, item := range s.Items {
			items = append(items, SaleItemResponse{
				ID:             item.ID,
				ProductID:      item.ProductID,
				ProductName:    item.ProductName,
				Quantity:       item.Quantity,
				UnitPrice:      item.UnitPrice,
				TotalPrice:     item.TotalPrice,
				DiscountAmount: item.DiscountAmount,
			})
		}
		resp = append(resp, DetailedSaleResponse{
			ID:             s.ID,
			ReceiptNumber:  s.ReceiptNumber,
			CustomerName:   s.CustomerName,
			CustomerPhone:  s.CustomerPhone,
			TotalAmount:    s.TotalAmount,
			SubTotal:       s.SubTotal,
			TaxAmount:      s.TaxAmount,
			DiscountAmount: s.DiscountAmount,
			Status:         s.Status,
			PaymentMethod:  s.PaymentMethod,
			CreatedAt:      s.CreatedAt,
			Items:          items,
		})
	}

	c.JSON(http.StatusOK, resp)
}

// GetSaleDetails godoc
// @Summary Get detailed information of a specific sale
// @Tags sales
// @Produce json
// @Param id path string true "Sale ID"
// @Success 200 {object} DetailedSaleResponse
// @Security BearerAuth
// @Router /sales/{id} [get]
func GetSaleDetails(c *gin.Context) {
	saleID := c.Param("id")
	orgID, _ := c.Get("org_id")

	var s models.Sale
	if err := database.DB.Preload("Items").First(&s, "id = ? AND organization_id = ?", saleID, orgID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sale not found"})
		return
	}

	var items []SaleItemResponse
	for _, item := range s.Items {
		items = append(items, SaleItemResponse{
			ID:             item.ID,
			ProductID:      item.ProductID,
			ProductName:    item.ProductName,
			Quantity:       item.Quantity,
			UnitPrice:      item.UnitPrice,
			TotalPrice:     item.TotalPrice,
			DiscountAmount: item.DiscountAmount,
		})
	}

	c.JSON(http.StatusOK, DetailedSaleResponse{
		ID:             s.ID,
		ReceiptNumber:  s.ReceiptNumber,
		CustomerName:   s.CustomerName,
		CustomerPhone:  s.CustomerPhone,
		TotalAmount:    s.TotalAmount,
		SubTotal:       s.SubTotal,
		TaxAmount:      s.TaxAmount,
		DiscountAmount: s.DiscountAmount,
		Status:         s.Status,
		PaymentMethod:  s.PaymentMethod,
		CreatedAt:      s.CreatedAt,
		Items:          items,
	})
}
