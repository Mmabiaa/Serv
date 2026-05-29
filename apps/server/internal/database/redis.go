package database

import (
	"context"
	"fmt"
	"os"

	"github.com/redis/go-redis/v9"
	"github.com/serv/server/pkg"
	"go.uber.org/zap"
)

var RedisClient *redis.Client
var ctx = context.Background()

func InitRedis() {
	addr := fmt.Sprintf("%s:%s", os.Getenv("REDIS_HOST"), os.Getenv("REDIS_PORT"))
	
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})

	if _, err := rdb.Ping(ctx).Result(); err != nil {
		pkg.Log.Fatal("Failed to connect to Redis", zap.Error(err))
	}

	RedisClient = rdb
	pkg.Log.Info("Redis connection established")
}
