# API SPECIFICATION DOCUMENT

# API Standards

Base URL:

```text
/api/v1
```

Response Format:

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
    "code": "INVALID_REQUEST",
    "message": "Validation failed"
  }
}
```

---

# AUTHENTICATION APIs

## POST /auth/login

Description:
Authenticate staff or manager.

Request:

```json
{
  "username": "john",
  "password_or_pin": "1234"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "access_token": "",
    "refresh_token": "",
    "user": {}
  }
}
```

---

## POST /auth/logout

Description:
Invalidate active session.

Authentication:
Required.

---

## POST /auth/refresh

Description:
Refresh expired access token.

---

# USER APIs

## GET /users

Description:
Fetch all staff.

Authorization:
Manager only.

---

## POST /users

Description:
Create staff account.

Authorization:
Manager only.

---

# PRODUCT APIs

## GET /products

Description:
Fetch products.

Supports:

* pagination
* search
* barcode lookup

---

## POST /products

Description:
Create product.

Authorization:
Manager only.

---

## PATCH /products/{id}

Description:
Update product.

Authorization:
Manager only.

---

# SALES APIs

## POST /transactions

Description:
Create transaction.

Requirements:

* atomic DB transaction
* inventory locking
* audit logging

---

## GET /transactions

Description:
Fetch transactions.

Staff:
Only own transactions.

Managers:
All business transactions.

---

# REPORT APIs

## GET /reports/daily

Description:
Fetch daily sales report.

Authorization:
Manager only.

---

# API Security Rules

* All APIs require JWT authentication except login
* RBAC must be enforced server-side
* Input validation mandatory
* Rate limiting required
* Structured errors mandatory
