package database

import (
	"github.com/serv/server/internal/models"
	"github.com/serv/server/pkg"
	"go.uber.org/zap"
)

func AutoMigrate() {
	err := DB.AutoMigrate(
		&models.Organization{},
		&models.User{},
		&models.AuditLog{},
		&models.UserDevice{},
	)
	if err != nil {
		pkg.Log.Fatal("Migration failed", zap.Error(err))
	}
	pkg.Log.Info("Database migration completed")
}
