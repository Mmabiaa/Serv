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
  - Refactored staff creation to use **GORM Transactions** for atomic data consistency.
  - Implemented **Graceful Shutdown** to ensure no requests are lost during deployment.

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

## [Phase 4: Sales & Transaction Engine] - 2026-05-29

### Added
- Implemented **Atomic Checkout Engine**:
  - `POST /api/v1/sales/checkout`: Processes sales using ACID transactions.
  - Automatic inventory deduction with **Row-Level Locking** (`FOR UPDATE`) for concurrency safety.
  - Integrated support for taxes (15% VAT) and item-level/total-level discounts.
  - Automatic generation of unique receipt numbers.
- Implemented **Secure Transaction Voiding**:
  - `POST /api/v1/sales/:id/void`: Reverts sales and restores inventory.
  - **PIN Authorization**: Requires Manager/Admin security PIN as per SRS 16.1.
  - Immutable audit trail for all voided transactions.
- Implemented **Sales History & Reporting**:
  - `GET /api/v1/sales/history`: Paginated list of all sales with preloaded items.
  - `GET /api/v1/sales/:id`: Detailed view of a specific transaction and its line items.
- **Enterprise Engineering**:
  - Full Audit Logging for every sale and void action.
  - Comprehensive integration tests for the full sales lifecycle (Register -> Stock -> Sale -> Void -> Stock Reversal).
  - Updated Swagger documentation with high-fidelity DTO responses.

## [Phase 8: UI/UX & Enterprise Refactor] - 2026-06-02

### Changed
- **Authentication Overhaul**: 
  - Unified login flow for all users (Managers and Staff) using Username + PIN.
  - Eliminated the insecure staff list selection to prevent data leakage.
  - Implemented automated role-based redirection: Managers are directed to the Executive Dashboard, while Staff are directed to the POS Terminal.
- **Frontend Architecture**:
  - Migrated from TanStack Start to a standard Vite + React 19 SPA for improved stability and performance.
  - Reorganized project structure into a modular, feature-based organization (KISS/SOLID principles).
  - Extracted shared and complex UI components into feature directories (`src/features`).
- **Data Integration**:
  - Removed all mock data from the frontend.
- **Enterprise Engineering**:
  - Implemented **Professional Receipt Engine**: Hidden iframe-based native printing for supermarket-style thermal receipts.
  - Standardized **Data Architecture**: Synchronized all frontend models with backend snake_case JSON responses.
  - Implemented **Resilient State Management**: Zustand selectors now use `useMemo` for stable identity, preventing React 19 infinite update loops.
  - Hardened **Security PINs**: Enabled flexible 4-digit or 6-digit PIN support across the entire stack (API validation, DB models, and POS keypad).
  - Automated **Customer CRM**: Transactions now automatically create or update customer records using phone numbers as primary keys, with spend/visit tracking.
  - Real-time **Stock Synchronization**: Frontend now triggers atomic refetches of product and report data immediately after successful checkouts or restocks.
  - Unified **Activity Monitoring**: Replaced mock security logs with a real-time audit trail fetched from the backend `/api/v1/users/activity` endpoint.
  - **Localization**: Changed system currency to Ghana Cedis (GHS/GH₵) with localized formatting.
  - **API Expansion**: Added backend handlers for `PUT` (Update) and `DELETE` (Remove) for inventory management.
  - Improved **RESTful Standards**:- Standardized all API calls to include `limit=100` for consistent performance and scalability.
- **Retail & Financial Core**:
  - Switched system currency to **Ghana Cedis (GHS/GH₵)** with precise 2-decimal formatting.
  - Implemented **Immutable Stock Ledger**: Stock levels can no longer be directly overwritten; all changes (Restocks, Sales, Manual Adjustments) now generate verifiable movement records.
  - Developed **Transaction-Based CRM**: Automated customer profiling using phone numbers as primary keys, featuring lifetime spend tracking and visit history.
  - Enhanced **Executive Reporting**: Real-time sales analytics and weekly performance charts now fetch data from production APIs instead of mock objects.
  - Hardened **Audit Monitoring**: Fully integrated the backend's security audit trail into the Manager Portal, tracking all sensitive organizational actions.
  - Fixed **Data Synchronization**: Implemented atomic state refetching after checkouts and stock adjustments to ensure absolute UI consistency.
  - Resolved **Type Safety Errors**: Synchronized frontend `Transaction` and `Customer` types with backend snake_case JSON schemas.
  - Optimized **Printing Experience**: Implemented a non-disruptive, hidden-iframe native printing strategy for supermarket-grade receipts. Implemented full API integration with the Go backend via a secured `api-client`.
  - Switched from local state persistence to server-driven data fetching for Products, Staff, Customers, and Transactions.
- **UI/UX Enhancements**:
  - Implemented a high-end, 10x engineer quality aesthetic using Tailwind CSS 4.
  - Standardized page naming and routing for better maintainability.
  - Improved real-time feedback with `sonner` toasts and loading states.

## [Phase 5: Customer Management] - 2026-05-29

### Added
- Implemented **Customer Management System**:
  - `POST /api/v1/customers`: Register new customers with full profile data.
  - `GET /api/v1/customers`: Searchable customer directory with pagination.
  - `GET /api/v1/customers/:id`: Detailed view including purchase history and engagement metrics.
- **Sales Integration**:
  - Automatically track `TotalSpent`, `TotalOrders`, and `LastVisitAt` for customers during checkout.
  - Added optional `CustomerID` support to the Sales checkout engine.
- **Supermarket Workflow Optimization**:
  - Refined Checkout handler to support **Just-in-Time Customer Creation**.
  - Priority lookup by **Phone Number** or **Full Name** during checkout.
  - Automatic upsert of customer details if matches are found.
  - Immutable **Receipt Snapshots**: Customer name and phone at the time of purchase are saved on the `Sale` record.
- **Enterprise Engineering**:
  - Full Audit Logging for customer registration.
  - Immutable purchase history linking sales to customer profiles.
  - Enhanced database indexing for fast customer lookups by name/phone.

## [Phase 6: Reporting & Analytics] - 2026-05-29

### Added
- Implemented **Sales Analytics Engine**:
  - `GET /api/v1/reports/daily`: Daily sales aggregation with multi-day history.
  - `GET /api/v1/reports/summary`: Periodic reporting (Monthly/Yearly) with SQL-optimized aggregation.
  - `GET /api/v1/reports/top-products`: Analytics on top-selling products by volume and revenue.
  - `GET /api/v1/reports/staff-performance`: Performance tracking for cashiers and managers.
- **Data Export Infrastructure**:
  - `GET /api/v1/reports/export/sales`: High-speed CSV export of sales history for external accounting.
  - Implemented streaming CSV generation for performance with large datasets.
- **Security & RBAC**:
  - Restricted all reporting endpoints to **Manager/Admin roles only**.
  - Integrated reporting access into the global Audit Logging system.
- **Enterprise Engineering**:
  - Used SQL grouping and aggregation for high-performance reporting.
  - Added comprehensive integration tests for the full reporting suite.
  - Updated Swagger documentation for all Phase 6 endpoints.
  - Automated integration tests for the full customer lifecycle.
  - Updated Swagger documentation with customer DTOs.
- **Enhanced Checkout Workflow**:
  - Integrated "Just-in-Time" customer creation during checkout.
  - Cashiers can now provide `customer_phone` and `customer_name` directly in the checkout request.
  - System automatically looks up existing customers by phone or creates a new profile if not found, significantly speeding up the operational workflow.
