# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initialized `CHANGELOG.md` to track project progress.
- Initialized Phase 0: Engineering Foundation.
  - Setup `pnpm` workspaces and Turborepo configuration.
  - Initialized Go backend in `apps/server` with Gin framework.
  - Created modular monorepo directory structure (`apps/`, `packages/`, `infrastructure/`).
  - Added `docker-compose.yml` for PostgreSQL and Redis infrastructure.
  - Configured initial environment variables in `.env`.
- Initialized Phase 1: Authentication & Security Core.
  - Defined `Organization` and `User` models for multi-tenant support.
  - Implemented JWT authentication and validation logic.
  - Created `AuthMiddleware` and `RoleMiddleware` for request protection.
  - Implemented Organization Registration flow (hashing passwords/PINs).
  - Configured GORM Auto-migration.
  - Setup structured logging with Zap.
  - Improved logging: added development/production modes, Gin middleware for request logging, and unified Zap logging across the backend.
  - Added Swagger API documentation at `/swagger/index.html`.
  - Reorganized testing suite: moved all tests to a dedicated `tests/` directory (`tests/unit` and `tests/integration`).
  - Implemented `Login` endpoint with JWT response.
  - Added end-to-end integration tests for the full Registration -> Login workflow.
  - Implemented unit tests for JWT authentication and Auth Middleware.
  - Added `AuditLog` model for tracking sensitive actions.
  - Implemented OTP generation and verification using Redis.
  - Implemented Trusted Device tracking and Risk-Based Authentication (OTP for new devices).
  - Added Password Reset flow using OTP.
  - Implemented IP-based Rate Limiting and Account Lockout logic.

## [Phase 2: User Management] - 2026-05-29

### Added
- Implemented Staff Management endpoints:
  - `POST /api/v1/users/staff`: Create new staff member (Admin/Manager only).
  - `GET /api/v1/users/staff`: List organization staff (Admin/Manager only).
  - `POST /api/v1/users/staff/:id/deactivate`: Toggle staff account status (Admin/Manager only).
  - `GET /api/v1/users/profile`: Get authenticated user profile.
  - `GET /api/v1/users/activity`: Get organization audit logs (Admin/Manager only).
- Added RBAC enforcement for user management actions.
- Integrated Audit Logging for staff creation and status changes.
- Added automated integration tests for User Management flow.
- Updated Swagger documentation with Phase 2 endpoints.
- Enhanced `AuthMiddleware` to verify account activity status on every request.
