# SYSTEM DESIGN SPECIFICATION

# Serv — Commerce Operating System

---

# 1. CORE ENGINEERING PRINCIPLES

The system must optimize for:

## A. Reliability

Transactions must never corrupt inventory or financial data.

---

## B. Speed

Cashier workflows must feel instant.

---

## C. Scalability

Architecture must survive growth without rewrites.

---

## D. Security

Every critical operation must be traceable and protected.

---

## E. Maintainability

The codebase must remain understandable years later.

---

# 2. FINAL ARCHITECTURE DECISION

# Architecture Style

## Modular Monolith

NOT microservices initially.

Why?

Because microservices introduce:

* network complexity,
* distributed failures,
* operational overhead,
* deployment complexity.

A modular monolith gives:

* simplicity,
* strong boundaries,
* easier debugging,
* faster development,
* and easier scaling early on.

---

# High-Level Architecture

```text id="n0z52k"
Frontend PWA
      ↓
Gin API Layer
      ↓
Application Services
      ↓
Domain Modules
      ↓
Repositories
      ↓
PostgreSQL + Redis
```

---

# 3. DOMAIN-DRIVEN MODULE DESIGN

Each module owns:

* business logic,
* repositories,
* services,
* validation,
* handlers.

---

# Core Modules

## Authentication Module

Handles:

* JWT
* sessions
* PIN verification
* OTP
* refresh tokens

---

## User Module

Handles:

* staff
* managers
* RBAC
* permissions

---

## Inventory Module

Handles:

* products
* stock
* categories
* stock adjustments

---

## Sales Module

Handles:

* transactions
* carts
* checkout
* discounts
* taxes

MOST CRITICAL MODULE.

---

## Customer Module

Handles:

* customer records
* balances
* purchase history

---

## Reporting Module

Handles:

* analytics
* aggregation
* summaries

---

## Audit Module

Handles:

* immutable logs
* fraud tracking
* system traceability

---

# 4. FINAL DATABASE ENGINEERING STRATEGY

# Database Choice

## PostgreSQL

Why?
Because Serv is:

* transactional,
* relational,
* consistency-critical.

PostgreSQL gives:

* ACID guarantees,
* row locking,
* indexing,
* constraints,
* transactional safety,
* scalability.

Perfect for POS systems.

---

# 5. MULTI-TENANCY STRATEGY

# Decision:

## Shared Database + Tenant Isolation

Every business record contains:

```text id="b0bdx2"
business_id
```

Example:

```sql
products.business_id
transactions.business_id
customers.business_id
```

---

# Why This Is Correct

Advantages:

* cheaper,
* simpler,
* easier scaling,
* easier migrations,
* operationally efficient.

---

# 6. DATABASE NORMALIZATION STRATEGY

Use:

## 3rd Normal Form (3NF)

Avoid:

* duplicated business data,
* inconsistent inventory records,
* redundant transaction storage.

---

# Example Structure

```text id="sn1wml"
transactions
    ↓
transaction_items
    ↓
products
```

NOT:

* storing full product objects inside sales rows.

---

# 7. CRITICAL TRANSACTION DESIGN

This is the MOST IMPORTANT part of the entire system.

---

# Checkout Transaction Flow

```text id="9p0u17"
BEGIN TRANSACTION
    ↓
Validate Staff Permissions
    ↓
Validate Product Availability
    ↓
Lock Product Rows
    ↓
Create Transaction
    ↓
Create Transaction Items
    ↓
Reduce Inventory
    ↓
Generate Receipt
    ↓
Create Audit Log
COMMIT
```

If ANY step fails:

```text id="ytjlwm"
ROLLBACK
```

---

# Why Row Locking Matters

Without row locking:
two cashiers may sell:

> the same last product simultaneously.

Use:

```sql
SELECT ... FOR UPDATE
```

This is enterprise-grade inventory protection.

---

# 8. INVENTORY CONSISTENCY STRATEGY

# Golden Rule

Inventory changes ONLY through:

* sales,
* approved adjustments,
* refunds,
* restocking.

Never arbitrary mutations.

---

# Stock Movement Ledger

VERY IMPORTANT.

Instead of only:

```text id="0vw02w"
products.stock_quantity
```

Also create:

```sql
inventory_movements
```

Tracks:

* additions
* deductions
* refunds
* corrections

This creates:

* traceability,
* reconciliation,
* fraud detection.

---

# 9. DATA STRUCTURES & ALGORITHMS STRATEGY

You specifically asked for DSA optimization.

Good.

---

# Product Search

Use:

## Indexed Search

Indexes:

```sql
CREATE INDEX idx_products_name
CREATE INDEX idx_products_barcode
```

Why?
Cashiers require:

* near-instant product lookup.

---

# Inventory Lookup

Use:

## Hash-based lookup strategy

Example:

```text id="lzhgq1"
barcode → product
```

Fast O(1)-style lookup behavior via indexes.

---

# Reporting

Use:

## Aggregation Queries

Example:

```sql
SUM(total)
GROUP BY date
```

Avoid loading massive datasets into application memory.

---

# Queue Processing

Use:

## FIFO queues

For:

* notifications,
* retries,
* future async tasks.

Redis works perfectly.

---

# Pagination Strategy

Never:

```sql
SELECT * FROM transactions
```

Use:

* cursor pagination,
* indexed sorting.

---

# 10. CACHING STRATEGY

Use:

## Redis

Cache:

* sessions
* OTPs
* rate limits
* dashboard summaries

DO NOT cache:

* live inventory quantities aggressively.

Inventory correctness > cache speed.

---

# 11. AUTHENTICATION ARCHITECTURE

# Staff Login

```text id="jlwmcr"
username + PIN
```

Fast operational flow.

---

# Manager Login

```text id="ot4gbf"
email + password
```

Optional OTP.

---

# Sensitive Actions

Require:

```text id="7l2b4d"
PIN re-authentication
```

Examples:

* refunds
* inventory edits
* permission changes

---

# 12. JWT STRATEGY

# Access Tokens

* short-lived
* stateless

---

# Refresh Tokens

* stored securely
* rotatable

---

# Session Strategy

Track:

* devices
* login history
* suspicious sessions

---

# 13. RATE LIMITING STRATEGY

Protect:

* auth endpoints
* OTP requests
* transaction APIs

Example:

```text id="rvlzq0"
5 failed logins
→ temporary lockout
```

---

# 14. AUDIT SYSTEM DESIGN

Every critical action creates:

```sql
audit_logs
```

Must include:

* actor
* action
* old values
* new values
* timestamps

Audit logs MUST:

* never delete,
* never mutate.

---

# 15. API ENGINEERING STANDARDS

# API Style

RESTful APIs.

---

# Response Structure

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or PIN"
  }
}
```

---

# Validation

ALL APIs MUST:

* validate input,
* sanitize payloads,
* enforce RBAC.

---

# 16. BACKEND FOLDER STRUCTURE

```text id="1p0x2s"
cmd/
internal/
    auth/
    users/
    inventory/
    sales/
    customers/
    reports/
    audit/
    middleware/
    config/
pkg/
database/
migrations/
scripts/
```

---

# 17. FRONTEND ENGINEERING STRATEGY

# Frontend Stack

* React
* Next.js
* Zustand
* Tailwind

---

# Frontend Responsibilities

* rendering
* caching
* offline queueing
* optimistic UI

NOT:

* business security enforcement.

---

# 18. OFFLINE STRATEGY

# MVP Offline Design

Allow:

* cached products
* queued requests
* retry mechanism

Avoid:

* distributed offline conflict resolution initially.

Too complex for MVP.

---

# Retry Queue Algorithm

```text id="qql4x6"
Request Fails
↓
Save To Queue
↓
Internet Returns
↓
Retry Sequentially
```

---

# 19. PRINTING ARCHITECTURE

# MVP

Generate:

* printable HTML receipts
* PDF receipts

Bluetooth support:
Phase 2.

---

# 20. OBSERVABILITY & MONITORING

Add:

* structured logs,
* request tracing,
* metrics,
* error tracking.

Recommended:

* zap logger
* Prometheus
* Grafana
* Sentry

Later phases.

---

# 21. TESTING STRATEGY

# Unit Tests

For:

* services
* validation
* calculations

---

# Integration Tests

For:

* checkout flow
* DB transactions
* permissions

---

# Stress Testing

Test:

* concurrent sales
* inventory contention
* session load

---

# 22. SCALABILITY STRATEGY

# Phase 1

Single server.

---

# Phase 2

Separate:

* frontend
* backend
* database.

---

# Phase 3

Horizontal backend scaling.

---

# Phase 4

Read replicas.

---

# Phase 5

Event-driven architecture if necessary.

NOT before necessary.

---

# 23. MOST IMPORTANT ENGINEERING RULES

# NEVER:

* trust frontend validation,
* mutate inventory outside transactions,
* delete financial records,
* bypass audit logs,
* hardcode secrets,
* skip RBAC checks.

---

# ALWAYS:

* validate input,
* use DB transactions,
* log critical actions,
* isolate tenants,
* protect sensitive endpoints,
* optimize operational speed.

---

# 24. FINAL SYSTEM PHILOSOPHY

Serv is NOT:

> “a POS dashboard.”

Serv is:

> “a transactional commerce operating system.”

The architecture must therefore prioritize:

* trust,
* consistency,
* accountability,
* speed,
* and operational resilience.

That philosophy should influence every engineering decision moving forward.
