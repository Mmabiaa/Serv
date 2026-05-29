package database

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
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
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	RedisClient = rdb
	log.Println("Redis connection established")
}
