# USER FLOW & WORKFLOW DOCUMENT

# 1. Staff Login Workflow

```text id="rj4j2h"
Open App
↓
Enter Username + PIN
↓
Validate Credentials
↓
Generate JWT Session
↓
Redirect To Staff Dashboard
```

Failure Handling:

* invalid PIN → error message
* repeated failures → temporary lockout

---

# 2. Manager Login Workflow

```text id="1jlwm4"
Open App
↓
Enter Email + Password
↓
Validate Credentials
↓
Check Device Trust
↓
Optional OTP Verification
↓
Generate JWT Session
↓
Redirect To Admin Dashboard
```

---

# 3. Sales Checkout Workflow

```text id="a9ok2z"
Search Product
↓
Add Product To Cart
↓
Adjust Quantity
↓
Calculate Totals
↓
Select Payment Method
↓
Validate Inventory
↓
Begin DB Transaction
↓
Lock Product Rows
↓
Create Transaction
↓
Reduce Inventory
↓
Generate Receipt
↓
Create Audit Log
↓
Commit Transaction
↓
Print Receipt
```

Failure Rule:
Any failure triggers rollback.

---

# 4. Refund Workflow

```text id="sx0w8y"
Search Transaction
↓
Manager PIN Verification
↓
Validate Refund Eligibility
↓
Begin DB Transaction
↓
Reverse Inventory Movement
↓
Create Refund Audit Log
↓
Update Transaction Status
↓
Commit Transaction
```

---

# 5. Inventory Adjustment Workflow

```text id="4twlyf"
Manager Opens Inventory
↓
Select Product
↓
Enter Adjustment Quantity
↓
Manager PIN Verification
↓
Create Inventory Movement Record
↓
Update Product Quantity
↓
Create Audit Log
```

---

# 6. Offline Retry Workflow

```text id="r53x8q"
Request Fails
↓
Save Request To Local Queue
↓
Connection Restored
↓
Retry Sequentially
↓
Mark Successful Requests
```

---

# Workflow Design Principles

* checkout speed prioritized
* inventory consistency mandatory
* sensitive actions require approval
* failures must rollback safely
* audit logs required for critical operations
