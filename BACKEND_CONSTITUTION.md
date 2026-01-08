# Backend Constitution — Real Estate CRM (Frontend-Derived)

## 0) Scope, Guarantees, and Non-Goals

### Scope
This document defines a backend constitution and implementation blueprint for the Real Estate CRM.

All requirements are derived strictly from observed frontend behavior and the mock backend layer (`mockApi`).

### Guarantees
- Only flows directly used by the frontend are considered **v1 required**.
- Any feature implied by UI but not backed by an actual API call site is marked **future**.
- Multi-tenant isolation and role-based access control (RBAC) are treated as first-class invariants.

### Non-goals (explicitly excluded)
- No backend code generation.
- No concrete schema/DDL output.
- No fabricated endpoints or features beyond the observed frontend flows.

---

## 1) Roles & Access Model

### Roles (canonical)
- `SUPER_ADMIN`
- `ADMIN`
- `MANAGER`
- `AGENT`
- `CUSTOMER`

> Note: Frontend sometimes uses lowercase role strings (`manager`, `agent`) in admin staff screens. Backend must normalize to canonical roles.

### Tenant Scoping
- Almost all reads/writes are tenant-scoped.
- `SUPER_ADMIN` can cross tenant boundaries.

### High-level permissions
- **SUPER_ADMIN**: manage tenants, view global users/analytics.
- **ADMIN**: manage tenant catalog (projects/units), staff users (agents/managers), lead operations, hold approvals, booking/payment finalization.
- **MANAGER**: manage leads, approve/reject bookings, create/schedule reminders.
- **AGENT**: view assigned leads/bookings; view own reviews.
- **CUSTOMER**: browse properties/projects, request holds, view bookings, cancel bookings (when allowed), view payments/receipts, create/edit/delete own pending reviews.

---

## 2) Domain Workflows (Authoritative)

### 2.1 Leads
- List leads (filtered client-side today; recommended server-side).
- Create lead (full + quick add).
- Update lead.
- Delete lead.
- Bulk operations exist in UI but are implemented as loops of single-item operations.

**Future (not required by call sites)**
- CSV import that actually creates leads server-side (UI parses CSV but does not POST created leads).

### 2.2 Projects & Units (Inventory)
- CRUD projects.
- CRUD units.
- Close project: sets project status closed and marks all units closed/unavailable.
- Units have a state lifecycle: AVAILABLE → HOLD → BOOKED → SOLD; CLOSED via project close.

### 2.3 Bookings / Holds
Frontend uses a single conceptual “booking” stream for:
- Hold requests (`PENDING/APPROVED/REJECTED`) with expiry.
- Booking approval (`BOOKING_PENDING_APPROVAL` → `BOOKING_CONFIRMED`).
- Payment pending/booking completion (`PAYMENT_PENDING`, `BOOKED`).
- Cancellation (`CANCELLED`) and refund states (`REFUNDED`) visible.

Critical invariant: booking + unit state transitions must be atomic.

### 2.4 Payments
- Create payment (receipt number generated server-side).
- List payments (customer filters via booking/customer).
- Download payment receipt.

### 2.5 Payment Reminders
- Create reminder for payment (send now or schedule).
- Run scheduled reminders (UI has manual trigger; production should use a job runner).

### 2.6 Reviews
- Create review (pending).
- Update review.
- Delete review (customer only; pending only per UI).
- List reviews; agent view filters by targetId + approved.

### 2.7 Dashboard Metrics
- Backend provides aggregated metrics used by admin/manager dashboards.

---

## 3) v1 API Surface (Minimum Required)

> Naming is conceptual; implementation may choose different route naming as long as semantics match.

### 3.1 Auth / Session
- `POST /auth/login-otp` — email + otp → authenticated user
- `POST /auth/logout` — optional

### 3.2 Users (tenant staff management)
- `GET /users` — filter by role, search; tenant-scoped
- `POST /users`
- `PATCH /users/:id` — partial updates including `isActive`
- `DELETE /users/:id`

### 3.3 Leads
- `GET /leads` — supports filters and pagination
- `POST /leads`
- `PATCH /leads/:id`
- `DELETE /leads/:id`

Optional (recommended future optimization):
- `POST /leads/bulk/status`
- `POST /leads/bulk/assign`
- `POST /leads/bulk/delete`

### 3.4 Projects
- `GET /projects`
- `POST /projects`
- `PATCH /projects/:id`
- `DELETE /projects/:id`
- `POST /projects/:id/close` — project close cascade to units

### 3.5 Units
- `GET /units`
- `POST /units`
- `PATCH /units/:id`
- `DELETE /units/:id`

### 3.6 Bookings
- `GET /bookings` — filters: customerId, agentId, status list
- `POST /bookings/hold` — creates hold request with expiry
- `POST /bookings/:id/approve-hold` — atomic booking+unit
- `POST /bookings/:id/reject-hold` — atomic booking+unit
- `POST /bookings/:id/approve` — booking approval (manager)
- `POST /bookings/:id/reject` — booking rejection (manager)
- `POST /bookings/:id/cancel` — customer cancel with reason; atomic booking+unit

### 3.7 Payments
- `GET /payments` — filters: customerId, bookingId, status, search; pagination
- `POST /payments` — create payment, generate `receiptNo`
- `PATCH /payments/:id` — used for reminder flags in finance UI

### 3.8 Reminders
- `POST /payments/:id/reminders` — send now or schedule
- `POST /reminders/run` — optional manual trigger (debug/admin)

### 3.9 Reviews
- `GET /reviews` — filter by type, targetId, status, customerId
- `POST /reviews` — creates pending review
- `PATCH /reviews/:id`
- `DELETE /reviews/:id`

### 3.10 Dashboards
- `GET /dashboard/metrics`

---

## 4) Response Shapes (Strictly From UI Reads)

### 4.1 Pagination Envelope (recommended)
```json
{
  "items": [],
  "page": 1,
  "pageSize": 10,
  "totalItems": 0,
  "totalPages": 0
}
```
UI currently paginates client-side; server-side pagination is recommended but not required to function.

### 4.2 Lead
Required fields used by UI:
- `id`, `tenantId?`
- `name`, `email`, `phone`
- `status`, `source`, `priority?`
- `project?`, `budget?`, `notes?`
- `assignedToId?`, `assignedTo?`
- `createdAt`, `updatedAt?`

### 4.3 Booking
Required fields used across pages/components:
- Identifiers: `id`, `tenantId?`
- Customer: `customerId`, `customerName`, `customerEmail?`, `customerPhone?`
- Unit/project: `unitId`, `unitNo`, `projectId?`, `projectName`
- Assignment: `agentId?`, `agentName?`, `managerId?`, `managerName?`
- Financials: `tokenAmount`, `totalPrice`
- State: `status`, `holdHours?`, `holdExpiresAt?`
- Lifecycle timestamps: `createdAt`, `updatedAt?`, `bookedAt?`, `approvedAt?`, `rejectedAt?`, `cancelledAt?`
- Payment recording metadata: `paymentMode?`, `paymentRecordedAt?`, `paymentRemarks?`
- Cancellation: `cancellationReason?`

> Status values are inconsistent in frontend; backend must canonicalize.

### 4.4 Payment
Required fields:
- `id`, `tenantId?`
- `customerId`, `customerName`
- `bookingId?`, `unitId`, `unitNo`
- `amount`, `type`, `method`, `date`, `dueDate?`
- `status`, `receiptNo?`, `notes?`
- Reminder fields: `reminders?`, `nextReminderAt?`
- Flags: `reminderSent?`, `reminderSentAt?`
- `createdAt`, `updatedAt?`

### 4.5 Reminder
- `id`, `type`, `message`, `scheduledAt`, `status`, `sentAt?`, `createdAt`

### 4.6 User
- `id`, `tenantId?`, `tenantName?`
- `name`, `email`, `phone?`
- `role`, `isActive?`
- `createdAt?`, `updatedAt?`

### 4.7 Review
- `id`, `tenantId?`
- `type`, `targetId`, `targetName?`
- `customerId`, `customerName`
- `rating`, `comment`, `images?`
- `status`, `createdAt`, `updatedAt?`

### 4.8 DashboardMetrics
- `totalLeads`, `newToday`, `newYesterday`, `activeLeads`, `conversionRate`, `closedDeals`
- `pendingTasks`, `overdueTasks`, `communications`
- `leadsThisMonth`, `revenueThisMonth`, `activeProperties`

---

## 5) Conceptual Relational Model (No DDL)

### Entities
- Tenant
- User
- Lead
- Project
- Unit
- Booking (includes hold requests)
- Payment
- PaymentReminder
- Review
- AuditLog (future; static in UI)

### Relationships (core)
- Tenant 1—N Users (staff)
- Tenant 1—N Leads
- Tenant 1—N Projects → N Units
- Tenant 1—N Bookings → N Payments → N Reminders
- Tenant 1—N Reviews
- User(Agent) 1—N Leads (assigned)
- User(Agent) 1—N Bookings (agentId)
- User(Customer) 1—N Bookings/Payments/Reviews
- Unit 1—N Bookings (history)
- Unit 1—N Payments

### Consistency invariants
- Prevent double-hold/double-booking for the same unit.
- All booking approval/rejection/cancellation/finalization must be atomic booking+unit updates.
- Project close must atomically close project and cascade units to CLOSED/unavailable.
- Receipt numbers generated server-side and unique.
- Tenant isolation enforced on every query and mutation.

---

## 6) Team Module Split (4-person ownership)

### Engineer A — Identity & Tenancy (IAM)
Owns: `Tenant`, `User`, Auth
- Endpoints: auth, users CRUD
- Forbidden: writing leads/projects/units/bookings/payments/reviews

### Engineer B — CRM Core (Leads)
Owns: `Lead`
- Endpoints: leads CRUD (+ optional bulk)
- Allowed read: Users (read-only for assignment validation), Projects (read-only if normalized)
- Forbidden: writing users/projects/units/bookings/payments/reviews

### Engineer C — Inventory & Catalog
Owns: `Project`, `Unit`
- Endpoints: projects CRUD + close, units CRUD
- Forbidden: creating/approving bookings, creating payments/reminders

### Engineer D — Transactions
Owns: `Booking`, `Payment`, `PaymentReminder`, Reviews
- Endpoints: bookings/holds approval, cancellations, payments, reminders, reviews, dashboards
- Allowed: update Unit status only for transactional workflows (prefer via Inventory contract)
- Forbidden: mutating leads or user roles

---

## 7) v1 vs Future (explicit)

### v1 Required
- All endpoints listed in Section 3.

### Future (not required by observed call sites)
- Lead CSV import endpoint that actually persists leads.
- Attendance/salary endpoints (present in mockApi but no frontend call sites).
- Enquiries endpoints (present in mockApi but no frontend call sites).
- Audit log feed from backend (super-admin audit logs page is static today).

---

## 8) Implementation Notes (non-code)
- Use PostgreSQL with Prisma as persistence layer.
- Use strict transaction boundaries for booking/unit/payment workflows.
- Normalize inconsistent frontend statuses into canonical enums server-side and provide mapping.

