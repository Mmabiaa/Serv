# CODING STANDARDS DOCUMENT

# Engineering Philosophy

Code must prioritize:

* readability
* simplicity
* maintainability
* reliability
* scalability

Avoid unnecessary complexity.

---

# 1. General Standards

Rules:

* write self-explanatory code
* avoid deeply nested logic
* prefer explicit naming
* prioritize clarity over cleverness

---

# 2. Go Backend Standards

# Folder Structure

```text id="0b4wgn"
internal/
    auth/
    users/
    inventory/
    sales/
```

---

# Naming Conventions

Use:

* camelCase for variables
* PascalCase for exported structs/functions
* lowercase package names

Example:

```go id="6m0jlwm"
type TransactionService struct {}
```

---

# Error Handling

Always:

* return explicit errors
* wrap contextual errors
* avoid silent failures

Example:

```go id="ex3d5n"
if err != nil {
    return fmt.Errorf("create transaction failed: %w", err)
}
```

---

# Logging

Use structured logging only.

Recommended:

* zap
* zerolog

Never:

* log secrets
* log passwords
* log PINs

---

# DB Access

Rules:

* use transactions for financial operations
* avoid raw dynamic SQL
* parameterize queries
* validate all inputs

---

# API Standards

Use:

* RESTful naming
* versioned APIs

Example:

```text id="jlwm90"
/api/v1/products
```

---

# HTTP Status Codes

Use proper codes:

* 200 OK
* 201 Created
* 400 Bad Request
* 401 Unauthorized
* 403 Forbidden
* 404 Not Found
* 500 Internal Server Error

---

# Frontend Standards

# React Principles

* reusable components
* modular structure
* avoid prop drilling
* isolate business logic

---

# State Management

Use:

* Zustand

Avoid unnecessary global state.

---

# Styling

Use:

* Tailwind CSS

Rules:

* consistent spacing
* mobile-first design
* reusable UI primitives

---

# Forms

Use:

* React Hook Form
* Zod validation

---

# Git Standards

# Branch Strategy

```text id="jlwm91"
main
develop
feature/*
hotfix/*
```

---

# Commit Convention

```text id="jlwm92"
feat:
fix:
refactor:
docs:
test:
```

Example:

```text id="jlwm93"
feat: implement inventory transaction locking
```

---

# Testing Standards

Required:

* unit tests
* integration tests
* API tests

Critical modules:

* inventory
* transactions
* authentication

---

# Security Standards

Never:

* hardcode secrets
* trust frontend validation
* expose internal errors publicly
* bypass RBAC checks

Always:

* validate inputs
* sanitize outputs
* hash sensitive credentials
* enforce transactional consistency

---

# Performance Principles

Optimize:

* indexed queries
* pagination
* aggregation queries
* concurrency safety

Avoid:

* N+1 queries
* unnecessary memory loading
* blocking operations
