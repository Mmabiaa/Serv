# ENTITY RELATIONSHIP DESIGN (ERD)

# Core Entities

## businesses

Represents tenant organizations using the platform.

Fields:

* id
* name
* phone
* email
* location
* manager_name
* created_at
* updated_at

Relationships:

* has many users
* has many products
* has many customers
* has many transactions

---

## users

Fields:

* id
* business_id
* full_name
* username
* email
* phone
* password_hash
* pin_hash
* role
* status
* last_login_at
* created_at
* updated_at

Relationships:

* belongs to business
* has many transactions
* has many audit_logs

Indexes:

* username
* email
* business_id

---

## categories

Fields:

* id
* business_id
* name
* description
* created_at

Relationships:

* belongs to business
* has many products

---

## products

Fields:

* id
* business_id
* category_id
* name
* sku
* barcode
* price
* cost_price
* stock_quantity
* low_stock_threshold
* status
* created_at
* updated_at

Relationships:

* belongs to category
* belongs to business
* has many transaction_items
* has many inventory_movements

Indexes:

* barcode
* sku
* name
* business_id

---

## customers

Fields:

* id
* business_id
* full_name
* phone
* email
* address
* balance
* created_at
* updated_at

Relationships:

* belongs to business
* has many transactions

Indexes:

* phone
* business_id

---

## transactions

Fields:

* id
* business_id
* customer_id
* staff_id
* transaction_number
* subtotal
* discount
* tax
* total
* payment_method
* payment_status
* transaction_status
* approved_by
* created_at

Relationships:

* belongs to business
* belongs to customer
* belongs to user
* has many transaction_items

Indexes:

* transaction_number
* business_id
* created_at

---

## transaction_items

Fields:

* id
* transaction_id
* product_id
* quantity
* unit_price
* subtotal
* created_at

Relationships:

* belongs to transaction
* belongs to product

---

## inventory_movements

Fields:

* id
* business_id
* product_id
* performed_by
* movement_type
* quantity
* previous_quantity
* new_quantity
* reference_id
* notes
* created_at

Movement Types:

* SALE
* RESTOCK
* REFUND
* ADJUSTMENT

Relationships:

* belongs to product
* belongs to user

Indexes:

* product_id
* business_id
* created_at

---

## audit_logs

Fields:

* id
* business_id
* user_id
* action
* entity_type
* entity_id
* old_values
* new_values
* ip_address
* device_metadata
* created_at

Relationships:

* belongs to user
* belongs to business

Indexes:

* business_id
* user_id
* action
* created_at

---

# Database Design Principles

* All tenant-owned tables must contain business_id
* Financial data must never be hard deleted
* Use soft deletes where necessary
* Critical operations must be transactional
* Inventory consistency must be preserved
* Audit logs must remain immutable
