package customers

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
)

type CustomerResponse struct {
	ID          uuid.UUID      `json:"id"`
	FullName    string         `json:"full_name"`
	PhoneNumber string         `json:"phone_number"`
	Email       string         `json:"email"`
	Address     string         `json:"address"`
	TotalSpent  float64        `json:"total_spent"`
	TotalOrders int            `json:"total_orders"`
	Balance     float64        `json:"balance"`
	LastVisitAt *time.Time     `json:"last_visit_at"`
	CreatedAt   time.Time      `json:"created_at"`
	Sales       []SaleResponse `json:"sales,omitempty"`
}

type SaleResponse struct {
	ID            uuid.UUID `json:"id"`
	ReceiptNumber string    `json:"receipt_number"`
	TotalAmount   float64   `json:"total_amount"`
	PaymentMethod string    `json:"payment_method"`
	CreatedAt     time.Time `json:"created_at"`
	ItemCount     int       `json:"item_count"`
}

type CreateCustomerRequest struct {
	FullName    string `json:"full_name" binding:"required"`
	PhoneNumber string `json:"phone_number"`
	Email       string `json:"email"`
	Address     string `json:"address"`
}

// CreateCustomer godoc
// @Summary Create a new customer
// @Tags customers
// @Accept json
// @Produce json
// @Param request body CreateCustomerRequest true "Customer details"
// @Success 201 {object} CustomerResponse
// @Security BearerAuth
// @Router /customers [post]
func CreateCustomer(c *gin.Context) {
	var req CreateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	orgID, _ := c.Get("org_id")
	userID, _ := c.Get("user_id")

	customer := models.Customer{
		OrganizationID: orgID.(uuid.UUID),
		FullName:       req.FullName,
		PhoneNumber:    req.PhoneNumber,
		Email:          req.Email,
		Address:        req.Address,
	}

	if err := database.DB.Create(&customer).Error; err != nil {
		pkg.Log.Error("failed to create customer", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create customer"})
		return
	}

	// Audit Log
	database.DB.Create(&models.AuditLog{
		OrganizationID: orgID.(uuid.UUID),
		UserID:         userID.(uuid.UUID),
		Action:         "CREATE_CUSTOMER",
		Entity:         "CUSTOMER",
		EntityID:       customer.ID.String(),
		IPAddress:      c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
	})

	c.JSON(http.StatusCreated, toCustomerResponse(customer))
}

// ListCustomers godoc
// @Summary List customers with search and pagination
// @Tags customers
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param search query string false "Search by name, phone or email"
// @Success 200 {array} CustomerResponse
// @Security BearerAuth
// @Router /customers [get]
func ListCustomers(c *gin.Context) {
	orgID, _ := c.Get("org_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit
	search := c.Query("search")

	var customers []models.Customer
	query := database.DB.Preload("Sales").Where("organization_id = ?", orgID)

	if search != "" {
		query = query.Where("full_name ILIKE ? OR phone_number ILIKE ? OR email ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Order("full_name ASC").Limit(limit).Offset(offset).Find(&customers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch customers"})
		return
	}

	var resp []CustomerResponse
	for _, cust := range customers {
		resp = append(resp, toCustomerResponse(cust))
	}

	c.JSON(http.StatusOK, resp)
}

// GetCustomerDetails godoc
// @Summary Get customer details and history
// @Tags customers
// @Produce json
// @Param id path string true "Customer ID"
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /customers/{id} [get]
func GetCustomerDetails(c *gin.Context) {
	id := c.Param("id")
	orgID, _ := c.Get("org_id")

	var customer models.Customer
	if err := database.DB.First(&customer, "id = ? AND organization_id = ?", id, orgID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	// Fetch recent sales for this customer
	var sales []models.Sale
	database.DB.Where("customer_id = ?", customer.ID).Order("created_at desc").Limit(10).Find(&sales)

	c.JSON(http.StatusOK, gin.H{
		"profile": toCustomerResponse(customer),
		"history": sales,
	})
}

func toCustomerResponse(c models.Customer) CustomerResponse {
	var sales []SaleResponse
	for _, s := range c.Sales {
		sales = append(sales, SaleResponse{
			ID:            s.ID,
			ReceiptNumber: s.ReceiptNumber,
			TotalAmount:   s.TotalAmount,
			PaymentMethod: s.PaymentMethod,
			CreatedAt:     s.CreatedAt,
			// Note: ItemCount would require preloading Items in Sale
		})
	}

	return CustomerResponse{
		ID:          c.ID,
		FullName:    c.FullName,
		PhoneNumber: c.PhoneNumber,
		Email:       c.Email,
		Address:     c.Address,
		TotalSpent:  c.TotalSpent,
		TotalOrders: c.TotalOrders,
		Balance:     c.Balance,
		LastVisitAt: c.LastVisitAt,
		CreatedAt:   c.CreatedAt,
		Sales:       sales,
	}
}
