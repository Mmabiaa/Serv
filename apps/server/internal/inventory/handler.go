package inventory

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
	"gorm.io/gorm"
)

// --- CATEGORY HANDLERS ---

type CategoryResponse struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
}

type CreateCategoryRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

// CreateCategory godoc
// @Summary Create a new product category
// @Tags inventory
// @Accept json
// @Produce json
// @Param request body CreateCategoryRequest true "Category details"
// @Success 201 {object} CategoryResponse
// @Security BearerAuth
// @Router /inventory/categories [post]
func CreateCategory(c *gin.Context) {
	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	orgID, _ := c.Get("org_id")
	userID, _ := c.Get("user_id")

	category := models.Category{
		OrganizationID: orgID.(uuid.UUID),
		Name:           req.Name,
		Description:    req.Description,
	}

	if err := database.DB.Create(&category).Error; err != nil {
		pkg.Log.Error("failed to create category", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
		return
	}

	// Audit Log
	database.DB.Create(&models.AuditLog{
		OrganizationID: orgID.(uuid.UUID),
		UserID:         userID.(uuid.UUID),
		Action:         "CREATE_CATEGORY",
		Entity:         "CATEGORY",
		EntityID:       category.ID.String(),
		IPAddress:      c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
	})

	c.JSON(http.StatusCreated, CategoryResponse{
		ID:          category.ID,
		Name:        category.Name,
		Description: category.Description,
	})
}

// ListCategories godoc
// @Summary List all categories
// @Tags inventory
// @Produce json
// @Success 200 {array} CategoryResponse
// @Security BearerAuth
// @Router /inventory/categories [get]
func ListCategories(c *gin.Context) {
	orgID, _ := c.Get("org_id")
	var categories []models.Category
	database.DB.Where("organization_id = ?", orgID).Find(&categories)

	var resp []CategoryResponse
	for _, cat := range categories {
		resp = append(resp, CategoryResponse{
			ID:          cat.ID,
			Name:        cat.Name,
			Description: cat.Description,
		})
	}

	c.JSON(http.StatusOK, resp)
}

// --- PRODUCT HANDLERS ---

type ProductResponse struct {
	ID            uuid.UUID `json:"id"`
	CategoryID    uuid.UUID `json:"category_id"`
	Name          string    `json:"name"`
	Description   string    `json:"description"`
	SKU           string    `json:"sku"`
	Barcode       string    `json:"barcode"`
	Price         float64   `json:"price"`
	CostPrice     float64   `json:"cost_price"`
	ImageURL      string    `json:"image_url"`
	Quantity      float64   `json:"quantity"`
	MinStockLevel float64   `json:"min_stock_level"`
	Unit          string    `json:"unit"`
}

type CreateProductRequest struct {
	CategoryID    uuid.UUID `json:"category_id" binding:"required"`
	Name          string    `json:"name" binding:"required"`
	Description   string    `json:"description"`
	SKU           string    `json:"sku"`
	Barcode       string    `json:"barcode"`
	Price         float64   `json:"price" binding:"required,gt=0"`
	CostPrice     float64   `json:"cost_price"`
	ImageURL      string    `json:"image_url"`
	MinStockLevel float64   `json:"min_stock_level"`
	Unit          string    `json:"unit"`
}

type UpdateProductRequest struct {
	CategoryID    *uuid.UUID `json:"category_id"`
	Name          *string    `json:"name"`
	Description   *string    `json:"description"`
	SKU           *string    `json:"sku"`
	Barcode       *string    `json:"barcode"`
	Price         *float64   `json:"price" binding:"omitempty,gt=0"`
	CostPrice     *float64   `json:"cost_price"`
	ImageURL      *string    `json:"image_url"`
	MinStockLevel *float64   `json:"min_stock_level"`
	Unit          *string    `json:"unit"`
}

// CreateProduct godoc
// @Summary Create a new product
// @Tags inventory
// @Accept json
// @Produce json
// @Param request body CreateProductRequest true "Product details"
// @Success 201 {object} ProductResponse
// @Security BearerAuth
// @Router /inventory/products [post]
func CreateProduct(c *gin.Context) {
	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	orgID, _ := c.Get("org_id")
	userID, _ := c.Get("user_id")

	product := models.Product{
		OrganizationID: orgID.(uuid.UUID),
		CategoryID:     req.CategoryID,
		Name:           req.Name,
		Description:    req.Description,
		SKU:            req.SKU,
		Barcode:        req.Barcode,
		Price:          req.Price,
		CostPrice:      req.CostPrice,
		ImageURL:       req.ImageURL,
		MinStockLevel:  req.MinStockLevel,
		Unit:           req.Unit,
		Quantity:       0,
	}

	if err := database.DB.Create(&product).Error; err != nil {
		pkg.Log.Error("failed to create product", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	// Audit Log
	database.DB.Create(&models.AuditLog{
		OrganizationID: orgID.(uuid.UUID),
		UserID:         userID.(uuid.UUID),
		Action:         "CREATE_PRODUCT",
		Entity:         "PRODUCT",
		EntityID:       product.ID.String(),
		IPAddress:      c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
	})

	c.JSON(http.StatusCreated, ProductResponse{
		ID:            product.ID,
		CategoryID:    product.CategoryID,
		Name:          product.Name,
		Description:   product.Description,
		SKU:           product.SKU,
		Barcode:       product.Barcode,
		Price:         product.Price,
		CostPrice:     product.CostPrice,
		ImageURL:      product.ImageURL,
		Quantity:      product.Quantity,
		MinStockLevel: product.MinStockLevel,
		Unit:          product.Unit,
	})
}

// ListProducts godoc
// @Summary List products with pagination and filtering
// @Tags inventory
// @Produce json
// @Param page query int false "Page" default(1)
// @Param limit query int false "Limit" default(10)
// @Param search query string false "Search by name or barcode"
// @Param category_id query string false "Filter by category"
// @Param low_stock query bool false "Filter for low stock items"
// @Success 200 {array} ProductResponse
// @Security BearerAuth
// @Router /inventory/products [get]
func ListProducts(c *gin.Context) {
	orgID, _ := c.Get("org_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	search := c.Query("search")
	categoryID := c.Query("category_id")
	lowStock, _ := strconv.ParseBool(c.Query("low_stock"))

	query := database.DB.Where("organization_id = ?", orgID)
	if search != "" {
		query = query.Where("name ILIKE ? OR barcode = ?", "%"+search+"%", search)
	}
	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}
	if lowStock {
		query = query.Where("quantity <= min_stock_level")
	}

	var products []models.Product
	query.Offset(offset).Limit(limit).Find(&products)

	var resp []ProductResponse
	for _, p := range products {
		resp = append(resp, ProductResponse{
			ID:            p.ID,
			CategoryID:    p.CategoryID,
			Name:          p.Name,
			Description:   p.Description,
			SKU:           p.SKU,
			Barcode:       p.Barcode,
			Price:         p.Price,
			CostPrice:     p.CostPrice,
			ImageURL:      p.ImageURL,
			Quantity:      p.Quantity,
			MinStockLevel: p.MinStockLevel,
			Unit:          p.Unit,
		})
	}

	c.JSON(http.StatusOK, resp)
}

// UpdateProduct godoc
// @Summary Update an existing product
// @Tags inventory
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Param request body UpdateProductRequest true "Product details"
// @Success 200 {object} ProductResponse
// @Security BearerAuth
// @Router /inventory/products/{id} [put]
func UpdateProduct(c *gin.Context) {
	id := c.Param("id")
	orgID, _ := c.Get("org_id")
	userID, _ := c.Get("user_id")

	var req UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	var product models.Product
	if err := database.DB.First(&product, "id = ? AND organization_id = ?", id, orgID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Update fields using pointers for precise optional handling
	if req.Name != nil {
		product.Name = *req.Name
	}
	if req.CategoryID != nil {
		product.CategoryID = *req.CategoryID
	}
	if req.Description != nil {
		product.Description = *req.Description
	}
	if req.SKU != nil {
		product.SKU = *req.SKU
	}
	if req.Barcode != nil {
		product.Barcode = *req.Barcode
	}
	if req.Price != nil {
		product.Price = *req.Price
	}
	if req.CostPrice != nil {
		product.CostPrice = *req.CostPrice
	}
	if req.ImageURL != nil {
		product.ImageURL = *req.ImageURL
	}
	if req.MinStockLevel != nil {
		product.MinStockLevel = *req.MinStockLevel
	}
	if req.Unit != nil {
		product.Unit = *req.Unit
	}

	if err := database.DB.Save(&product).Error; err != nil {
		pkg.Log.Error("failed to update product", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}

	// Audit Log
	database.DB.Create(&models.AuditLog{
		OrganizationID: orgID.(uuid.UUID),
		UserID:         userID.(uuid.UUID),
		Action:         "UPDATE_PRODUCT",
		Entity:         "PRODUCT",
		EntityID:       product.ID.String(),
		IPAddress:      c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
	})

	c.JSON(http.StatusOK, ProductResponse{
		ID:            product.ID,
		CategoryID:    product.CategoryID,
		Name:          product.Name,
		Description:   product.Description,
		SKU:           product.SKU,
		Barcode:       product.Barcode,
		Price:         product.Price,
		CostPrice:     product.CostPrice,
		ImageURL:      product.ImageURL,
		Quantity:      product.Quantity,
		MinStockLevel: product.MinStockLevel,
		Unit:          product.Unit,
	})
}

// DeleteProduct godoc
// @Summary Delete a product
// @Tags inventory
// @Param id path string true "Product ID"
// @Success 204 "No Content"
// @Security BearerAuth
// @Router /inventory/products/{id} [delete]
func DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	orgID, _ := c.Get("org_id")
	userID, _ := c.Get("user_id")

	var product models.Product
	if err := database.DB.First(&product, "id = ? AND organization_id = ?", id, orgID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	if err := database.DB.Delete(&product).Error; err != nil {
		pkg.Log.Error("failed to delete product", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
		return
	}

	// Audit Log
	database.DB.Create(&models.AuditLog{
		OrganizationID: orgID.(uuid.UUID),
		UserID:         userID.(uuid.UUID),
		Action:         "DELETE_PRODUCT",
		Entity:         "PRODUCT",
		EntityID:       id,
		IPAddress:      c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
	})

	c.Status(http.StatusNoContent)
}

// --- STOCK ADJUSTMENT HANDLERS ---

type MovementResponse struct {
	ID             uuid.UUID `json:"id"`
	OrganizationID uuid.UUID `json:"organization_id"`
	ProductID      uuid.UUID `json:"product_id"`
	UserID         uuid.UUID `json:"user_id"`
	Type           string    `json:"type"`
	Quantity       float64   `json:"quantity"`
	PreviousQty    float64   `json:"previous_qty"`
	NewQty         float64   `json:"new_qty"`
	Reason         string    `json:"reason"`
	ReferenceID    string    `json:"reference_id"`
	CreatedAt      time.Time `json:"created_at"`
}

type AdjustStockRequest struct {
	ProductID uuid.UUID `json:"product_id" binding:"required"`
	Quantity  float64   `json:"quantity" binding:"required"`
	Type      string    `json:"type" binding:"required,oneof=IN OUT ADJUSTMENT RESTOCK"`
	Reason    string    `json:"reason"`
}

// AdjustStock godoc
// @Summary Adjust product stock level
// @Description Record an inventory movement and update product quantity atomically
// @Tags inventory
// @Accept json
// @Produce json
// @Param request body AdjustStockRequest true "Adjustment details"
// @Success 200 {object} MovementResponse
// @Security BearerAuth
// @Router /inventory/adjust [post]
func AdjustStock(c *gin.Context) {
	var req AdjustStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	orgID, _ := c.Get("org_id")
	userID, _ := c.Get("user_id")

	var movement models.InventoryMovement

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var product models.Product
		// Row-level locking for concurrency safety using standard SQL clause
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&product, "id = ? AND organization_id = ?", req.ProductID, orgID).Error; err != nil {
			return err
		}

		prevQty := product.Quantity
		var newQty float64
		if req.Type == "IN" || req.Type == "RESTOCK" {
			newQty = prevQty + req.Quantity
		} else if req.Type == "OUT" || req.Type == "ADJUSTMENT" {
			// For ADJUSTMENT, req.Quantity can be negative
			newQty = prevQty + req.Quantity
		}

		if newQty < 0 {
			return gorm.ErrInvalidData // Cannot have negative stock
		}

		// Update product quantity
		if err := tx.Model(&product).Update("quantity", newQty).Error; err != nil {
			return err
		}

		// Record movement
		movement = models.InventoryMovement{
			OrganizationID: orgID.(uuid.UUID),
			ProductID:      product.ID,
			UserID:         userID.(uuid.UUID),
			Type:           req.Type,
			Quantity:       req.Quantity,
			PreviousQty:    prevQty,
			NewQty:         newQty,
			Reason:         req.Reason,
		}

		if err := tx.Create(&movement).Error; err != nil {
			return err
		}

		// Audit Log
		audit := models.AuditLog{
			OrganizationID: orgID.(uuid.UUID),
			UserID:         userID.(uuid.UUID),
			Action:         "STOCK_ADJUSTMENT",
			Entity:         "PRODUCT",
			EntityID:       product.ID.String(),
			Metadata:       req.Reason,
			IPAddress:      c.ClientIP(),
			UserAgent:      c.Request.UserAgent(),
		}

		return tx.Create(&audit).Error
	})

	if err != nil {
		pkg.Log.Error("failed to adjust stock", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to adjust stock"})
		return
	}

	c.JSON(http.StatusOK, MovementResponse{
		ID:             movement.ID,
		OrganizationID: movement.OrganizationID,
		ProductID:      movement.ProductID,
		UserID:         movement.UserID,
		Type:           movement.Type,
		Quantity:       movement.Quantity,
		PreviousQty:    movement.PreviousQty,
		NewQty:         movement.NewQty,
		Reason:         movement.Reason,
		ReferenceID:    movement.ReferenceID,
		CreatedAt:      movement.CreatedAt,
	})
}

// GetMovementHistory godoc
// @Summary Get inventory movement history
// @Tags inventory
// @Produce json
// @Param product_id query string false "Filter by product"
// @Param page query int false "Page" default(1)
// @Param limit query int false "Limit" default(20)
// @Success 200 {array} MovementResponse
// @Security BearerAuth
// @Router /inventory/movements [get]
func GetMovementHistory(c *gin.Context) {
	orgID, _ := c.Get("org_id")
	productID := c.Query("product_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	query := database.DB.Where("organization_id = ?", orgID)
	if productID != "" {
		query = query.Where("product_id = ?", productID)
	}

	var movements []models.InventoryMovement
	query.Order("created_at desc").Offset(offset).Limit(limit).Find(&movements)

	var resp []MovementResponse
	for _, m := range movements {
		resp = append(resp, MovementResponse{
			ID:             m.ID,
			OrganizationID: m.OrganizationID,
			ProductID:      m.ProductID,
			UserID:         m.UserID,
			Type:           m.Type,
			Quantity:       m.Quantity,
			PreviousQty:    m.PreviousQty,
			NewQty:         m.NewQty,
			Reason:         m.Reason,
			ReferenceID:    m.ReferenceID,
			CreatedAt:      m.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, resp)
}
