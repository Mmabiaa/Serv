# SECURITY ARCHITECTURE DOCUMENT

# Security Philosophy

Serv prioritizes:

* operational trust,
* transactional integrity,
* fraud prevention,
* accountability,
* and secure scalability.

Security must never unnecessarily slow cashier workflows.

---

# 1. Authentication Architecture

# Staff Authentication

* username + PIN
* JWT session issuance

# Manager Authentication

* email/username + password
* optional OTP verification

---

# 2. OTP Strategy

OTP SHALL be used only for:

* suspicious logins
* new devices
* password resets
* sensitive account recovery
* future high-risk actions

OTP SHALL NOT be required for:

* every sale
* every login
* standard cashier workflows

---

# 3. Session Management

Requirements:

* short-lived access tokens
* rotating refresh tokens
* inactivity expiration
* device session tracking

Session expiration example:

```text id="jlwm4n"
15 minutes inactivity
→ session lock
```

---

# 4. PIN Security

PINs must:

* be hashed
* never stored plaintext
* never logged
* require rate limiting

Sensitive operations requiring PIN:

* refunds
* void transactions
* inventory adjustments
* permission changes

---

# 5. Authorization Model

RBAC enforced:

* server-side only

Frontend permissions are:

* visual convenience only

Backend remains source of truth.

---

# 6. Transaction Security

Critical transaction rules:

* ACID DB transactions mandatory
* inventory locking mandatory
* rollback required on failure
* audit logging mandatory

---

# 7. Fraud Prevention Strategy

Controls include:

* immutable audit logs
* transaction traceability
* session monitoring
* inventory reconciliation
* role isolation
* approval thresholds

---

# 8. Rate Limiting

Protect:

* login endpoints
* OTP endpoints
* transaction endpoints

Example:

```text id="9n7d9n"
5 failed attempts
→ temporary lockout
```

---

# 9. Data Protection

Requirements:

* HTTPS mandatory
* encrypted transport
* secure cookies
* input validation
* SQL injection prevention
* XSS prevention
* CSRF protection

---

# 10. Audit Logging

Every critical action must log:

* actor
* action
* timestamps
* old values
* new values
* IP metadata

Audit logs must:

* never mutate
* never delete
* remain searchable
