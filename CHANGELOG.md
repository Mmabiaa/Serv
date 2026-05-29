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
- Initialized Phase 2: User Management implementation.
  - Implemented Staff Management endpoints (Create, List, Deactivate).
  - Added RBAC enforcement and Audit Logging for user actions.
  - Added Pagination and Filtering for staff and activity logs.
  - Hardened security with CORS, XSS, CSP, and HSTS headers.
  - Implemented Graceful Shutdown for operational stability.

## [Phase 3: Inventory Management System] - 2026-05-29

### Added
- Implemented **Category Management**:
  - `POST /api/v1/inventory/categories`: Create product categories.
  - `GET /api/v1/inventory/categories`: List all categories.
- Implemented **Product Management**:
  - `POST /api/v1/inventory/products`: Create new products with barcode and unit support.
  - `GET /api/v1/inventory/products`: List products with pagination, search, and category filters.
  - Added **Low Stock Alert** filter to product listing.
- Implemented **Stock Adjustment & Ledger**:
  - `POST /api/v1/inventory/adjust`: Atomic stock updates using **Database Transactions**.
  - Integrated **Row-Level Locking** (`FOR UPDATE`) to ensure consistency under high concurrency.
  - `GET /api/v1/inventory/movements`: Immutable inventory movement ledger.
- **Enterprise Engineering**:
  - Full Audit Logging for every inventory change.
  - Fractional unit support (kg, liters) via decimal precision.
  - Automated integration tests for the full inventory lifecycle.
  - Updated Swagger documentation with all Phase 3 endpoints.
