package auth

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/serv/server/internal/database"
)

func GenerateOTP(email string) (string, error) {
	otp := fmt.Sprintf("%06d", rand.Intn(1000000))
	key := fmt.Sprintf("otp:%s", email)

	// Store OTP in Redis for 5 minutes
	err := database.RedisClient.Set(context.Background(), key, otp, 5*time.Minute).Err()
	if err != nil {
		return "", err
	}

	return otp, nil
}

func VerifyOTP(email, otp string) (bool, error) {
	key := fmt.Sprintf("otp:%s", email)
	val, err := database.RedisClient.Get(context.Background(), key).Result()
	if err != nil {
		return false, err
	}

	return val == otp, nil
}
