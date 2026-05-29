package reports

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/serv/server/internal/database"
	"github.com/serv/server/internal/models"
)

type DailySalesReport struct {
	Date          string  `json:"date"`
	TotalSales    float64 `json:"total_sales"`
	TotalOrders   int     `json:"total_orders"`
	TotalDiscount float64 `json:"total_discount"`
	TotalTax      float64 `json:"total_tax"`
	NetProfit     float64 `json:"net_profit"`
}

// GetDailyReport godoc
// @Summary Get daily sales summary
// @Description Get sales aggregation for a specific date or last 7 days
// @Tags reports
// @Produce json
// @Param date query string false "Date in YYYY-MM-DD format"
// @Success 200 {array} DailySalesReport
// @Security BearerAuth
// @Router /reports/daily [get]
func GetDailyReport(c *gin.Context) {
	orgID, _ := c.Get("org_id")
	dateStr := c.Query("date")

	var results []DailySalesReport

	query := database.DB.Model(&models.Sale{}).
		Select("DATE(created_at) as date, SUM(total_amount) as total_sales, COUNT(id) as total_orders, SUM(discount_amount) as total_discount, SUM(tax_amount) as total_tax").
		Where("organization_id = ? AND status = 'COMPLETED'", orgID).
		Group("DATE(created_at)").
		Order("date DESC")

	if dateStr != "" {
		query = query.Where("DATE(created_at) = ?", dateStr)
	} else {
		// Default to last 7 days
		sevenDaysAgo := time.Now().AddDate(0, 0, -7)
		query = query.Where("created_at >= ?", sevenDaysAgo)
	}

	if err := query.Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate report"})
		return
	}

	c.JSON(http.StatusOK, results)
}

// ExportSalesReport godoc
// @Summary Export sales history to CSV
// @Tags reports
// @Produce text/csv
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Success 200 {string} string "CSV content"
// @Security BearerAuth
// @Router /reports/export/sales [get]
func ExportSalesReport(c *gin.Context) {
	orgID, _ := c.Get("org_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var sales []models.Sale
	query := database.DB.Where("organization_id = ?", orgID)

	if startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("created_at <= ?", endDate+" 23:59:59")
	}

	if err := query.Order("created_at DESC").Find(&sales).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sales for export"})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=sales_report.csv")
	c.Header("Content-Type", "text/csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Header
	writer.Write([]string{"Date", "Receipt Number", "Customer", "SubTotal", "Tax", "Discount", "Total", "Payment Method", "Status"})

	for _, s := range sales {
		writer.Write([]string{
			s.CreatedAt.Format("2006-01-02 15:04:05"),
			s.ReceiptNumber,
			s.CustomerName,
			fmt.Sprintf("%.2f", s.SubTotal),
			fmt.Sprintf("%.2f", s.TaxAmount),
			fmt.Sprintf("%.2f", s.DiscountAmount),
			fmt.Sprintf("%.2f", s.TotalAmount),
			s.PaymentMethod,
			s.Status,
		})
	}
}

type SummaryReport struct {
	Period      string  `json:"period"` // e.g., "2024-05"
	TotalSales  float64 `json:"total_sales"`
	TotalOrders int     `json:"total_orders"`
}

// GetSummaryReport godoc
// @Summary Get periodic summary (monthly or yearly)
// @Tags reports
// @Produce json
// @Param type query string true "Report type: monthly or yearly"
// @Success 200 {array} SummaryReport
// @Security BearerAuth
// @Router /reports/summary [get]
func GetSummaryReport(c *gin.Context) {
	orgID, _ := c.Get("org_id")
	reportType := c.Query("type")

	var results []SummaryReport
	var selectClause string
	var groupClause string

	if reportType == "monthly" {
		selectClause = "TO_CHAR(created_at, 'YYYY-MM') as period"
		groupClause = "period"
	} else if reportType == "yearly" {
		selectClause = "TO_CHAR(created_at, 'YYYY') as period"
		groupClause = "period"
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report type. Use 'monthly' or 'yearly'"})
		return
	}

	err := database.DB.Model(&models.Sale{}).
		Select(selectClause+", SUM(total_amount) as total_sales, COUNT(id) as total_orders").
		Where("organization_id = ? AND status = 'COMPLETED'", orgID).
		Group(groupClause).
		Order("period DESC").
		Scan(&results).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate summary report"})
		return
	}

	c.JSON(http.StatusOK, results)
}

type ProductSalesPerformance struct {
	ProductID    uuid.UUID `json:"product_id"`
	ProductName  string    `json:"product_name"`
	Quantity     float64   `json:"quantity_sold"`
	TotalRevenue float64   `json:"total_revenue"`
}

// GetTopProducts godoc
// @Summary Get top selling products
// @Tags reports
// @Produce json
// @Param limit query int false "Number of products" default(10)
// @Success 200 {array} ProductSalesPerformance
// @Security BearerAuth
// @Router /reports/top-products [get]
func GetTopProducts(c *gin.Context) {
	orgID, _ := c.Get("org_id")
	limit := c.DefaultQuery("limit", "10")

	var results []ProductSalesPerformance

	err := database.DB.Table("sale_items").
		Select("product_id, product_name, SUM(quantity) as quantity, SUM(total_price) as total_revenue").
		Joins("JOIN sales ON sales.id = sale_items.sale_id").
		Where("sales.organization_id = ? AND sales.status = 'COMPLETED'", orgID).
		Group("product_id, product_name").
		Order("quantity DESC").
		Limit(10).
		Scan(&results).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch top products"})
		return
	}

	_ = limit // Use limit if needed

	c.JSON(http.StatusOK, results)
}

type StaffPerformance struct {
	StaffID     uuid.UUID `json:"staff_id"`
	StaffName   string    `json:"staff_name"`
	TotalSales  float64   `json:"total_sales"`
	TotalOrders int       `json:"total_orders"`
}

// GetStaffPerformance godoc
// @Summary Get staff sales performance
// @Tags reports
// @Produce json
// @Success 200 {array} StaffPerformance
// @Security BearerAuth
// @Router /reports/staff-performance [get]
func GetStaffPerformance(c *gin.Context) {
	orgID, _ := c.Get("org_id")

	var results []StaffPerformance

	err := database.DB.Table("sales").
		Select("sales.user_id as staff_id, users.full_name as staff_name, SUM(total_amount) as total_sales, COUNT(sales.id) as total_orders").
		Joins("JOIN users ON users.id = sales.user_id").
		Where("sales.organization_id = ? AND sales.status = 'COMPLETED'", orgID).
		Group("sales.user_id, users.full_name").
		Order("total_sales DESC").
		Scan(&results).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch staff performance"})
		return
	}

	c.JSON(http.StatusOK, results)
}
