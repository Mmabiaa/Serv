# ROLE-BASED ACCESS CONTROL (RBAC)

| Feature                     | Staff | Manager |
| --------------------------- | ----- | ------- |
| Login                       | Yes   | Yes     |
| Process Sale                | Yes   | Yes     |
| View Products               | Yes   | Yes     |
| Register Customer           | Yes   | Yes     |
| View Own Transactions       | Yes   | Yes     |
| View All Transactions       | No    | Yes     |
| Create Product              | No    | Yes     |
| Edit Product                | No    | Yes     |
| Delete Product              | No    | Yes     |
| Adjust Inventory            | No    | Yes     |
| Create Staff                | No    | Yes     |
| Deactivate Staff            | No    | Yes     |
| Export Reports              | No    | Yes     |
| View Analytics              | No    | Yes     |
| Void Transaction            | No    | Yes     |
| Refund Transaction          | No    | Yes     |
| Configure Business Settings | No    | Yes     |
| View Audit Logs             | No    | Yes     |

---

# Sensitive Actions Requiring PIN

* refunds
* transaction voiding
* inventory adjustments
* report exports
* permission changes

---

# Approval Threshold Rules

Manager approval required for:

* large discounts
* high-value transactions
* inventory bulk adjustments
