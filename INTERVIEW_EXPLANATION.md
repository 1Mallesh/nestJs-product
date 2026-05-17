# TOKOMORT — Interview Explanation Guide

> How to explain this project confidently in a senior developer interview.

---

## 30-Second Elevator Pitch

> "TOKOMORT is a production-grade multi-vendor e-commerce platform — think a simplified Meesho or Amazon Marketplace. I built it with NestJS on the backend, Next.js 15 on the frontend, PostgreSQL with Prisma ORM, and Socket.IO for real-time events. It supports four user roles, live Razorpay payments with server-side webhook verification, GST-inclusive pricing, per-vendor commission settlement, and GPS-based delivery assignment. The architecture is built for scale: every financial operation is atomic using Prisma transactions, webhooks are idempotent, and real-time events are decoupled through a Socket.IO gateway module."

---

## Architecture Explanation

### Q: Walk me through your overall architecture.

**Answer:**

The system has three main layers:

1. **Frontend** — Next.js 15 App Router with route groups per role. Client state (cart, auth tokens) lives in Redux Toolkit. Server state (products, orders, notifications) is managed by React Query with automatic cache invalidation. An adapter layer in `lib/adapters.ts` normalizes backend field names to frontend types — this isolates the frontend from backend naming changes.

2. **Backend** — NestJS with a modular architecture. Each domain (orders, payments, products, delivery) is its own module with its own service, controller, and DTOs. Cross-cutting concerns — auth guards, role guards, validation, exception filtering — are in the `common/` module. Socket.IO runs in a `TrackingModule` that is imported by any module needing real-time emit capability.

3. **Database** — PostgreSQL via Prisma ORM on Supabase. Every write that spans multiple tables uses `prisma.$transaction()` for atomicity. The schema has 18 models covering the full e-commerce domain.

---

## Tech Stack Justification

### Q: Why NestJS over Express?

NestJS gives you a production-ready structure out of the box: dependency injection, module system, decorators for guards/interceptors/pipes. In Express you'd build all of that yourself. For a multi-role platform with auth guards, role guards, validation pipes, and exception filters, NestJS means less boilerplate and more consistency across the team.

### Q: Why Prisma over TypeORM or raw SQL?

Prisma has the best TypeScript integration — the generated client gives you fully typed queries with autocompletion. The schema file is the single source of truth for your DB structure. TypeORM decorators on entities get messy fast; Prisma keeps schema separate from application code. The `$transaction()` API is also clean and composable.

### Q: Why Next.js App Router instead of Pages Router or a pure SPA?

The App Router gives us SSR for product listing pages (important for SEO and initial load performance) while dashboard pages are client-rendered. Route groups let us apply different layouts — public storefront, dashboard — without URL path changes. Server components reduce the JavaScript bundle sent to the browser.

### Q: Why Redux Toolkit for cart instead of just React Query?

The cart needs to work offline, survive page reloads, and update instantly without a network round-trip. That's client state, not server state. React Query is for data that lives on the server and needs to stay in sync. Redux is for data the user owns locally. Using the right tool for each keeps the architecture clean.

---

## Key Design Decisions

### Q: How do you handle the Razorpay webhook reliably?

Three layers of reliability:

1. **Signature verification** — HMAC-SHA256 of the raw request body using `RAZORPAY_WEBHOOK_SECRET`. We need `rawBody: true` in NestFactory so Express preserves the raw buffer before JSON parsing.

2. **Idempotency** — Every Razorpay webhook delivery has a unique `event.id`. We store this in `Payment.webhookEventId` (unique constraint). On receipt, we check if `webhookEventId` already exists in DB — if yes, we skip. This means even if Razorpay delivers the same event twice, we process it exactly once.

3. **Atomicity** — The `payment.captured` handler runs inside a single `prisma.$transaction()`: update Payment, confirm Order, create OrderDelivery, write PaymentLedger, and increment vendor earnings. Either all succeed or none do.

### Q: How do you calculate GST?

Prices are GST-inclusive (18%). To extract the GST component:

```
GST = subtotal × (18 / 118)
```

For example: ₹1180 total → GST = ₹1180 × (18/118) = ₹180. The vendor lists prices inclusive of GST, which is the standard Indian retail practice. The platform then records the extracted GST separately in `PaymentLedger.gstAmount`.

### Q: How does the product approval workflow work?

When a vendor creates a product, it gets `approvalStatus: PENDING` and `isPublished: false`. The public product listing query filters by `approvalStatus = APPROVED AND isPublished = true`, so unapproved products are completely invisible to customers regardless of any other flags.

When an admin approves a product, we set:
- `approvalStatus = APPROVED`
- `isPublished = true`
- `approvedBy = adminId`
- `approvedAt`, `publishedAt` = current timestamp

These audit fields let you answer "who approved this product and when?" at any time.

### Q: How does auto-delivery assignment work?

After payment confirmation:
1. Query all delivery boys where `approvalStatus = APPROVED AND isAvailable = true`
2. If the customer's address has GPS coordinates (latitude/longitude), calculate Haversine distance to each delivery boy's last reported location
3. Assign the nearest one
4. If no GPS data exists, fallback to the boy with the lowest `totalDeliveries` count (load balancing)
5. Generate a 4-digit OTP stored in `OrderDelivery.deliveryOtp` for secure handoff verification

---

## Security

### Q: How do you secure the API?

- **JWT** with short-lived access tokens (15 min) + long-lived refresh tokens (7 days). Access tokens are stateless; refresh tokens are stored in DB and invalidated on logout.
- **Role-based access control** via `@Roles()` decorator + `RolesGuard`. A customer cannot access `/admin/*` endpoints.
- **Validation pipe** with `whitelist: true` and `forbidNonWhitelisted: true` — any unknown field in the request body causes a 400. This prevents mass assignment attacks.
- **Webhook endpoint is public but authenticated by HMAC** — it bypasses JWT (it's a server-to-server call from Razorpay) but verifies the `x-razorpay-signature` header against the raw body.
- **Helmet.js** sets security headers (X-Frame-Options, Content-Security-Policy, etc.)

### Q: How do you prevent SQL injection?

Prisma uses parameterized queries by default. There is no raw SQL string concatenation in the codebase.

---

## Scalability

### Q: How would you scale this system?

**Database:**
- Read replicas for product listing queries (read-heavy, can be stale by seconds)
- Database connection pooling via PgBouncer (Supabase provides this)
- Index on `products(approvalStatus, isPublished, isActive)` for the public product query

**Backend:**
- NestJS can run in PM2 cluster mode (one process per CPU core)
- Stateless design — JWT auth means any instance can serve any request
- BullMQ queues offload email/SMS sending from the request path

**Real-Time:**
- For multiple NestJS instances, Socket.IO needs a Redis adapter (`@socket.io/redis-adapter`) so events emitted by one instance are broadcast to clients connected to other instances

**Frontend:**
- Vercel edge network handles CDN and auto-scaling
- React Query caching reduces redundant API calls
- Product pages use ISR (Incremental Static Regeneration) for fast loads without full SSR on every request

### Q: What's the bottleneck in your current architecture?

The Socket.IO gateway runs in-process. At scale with multiple server instances, a client connected to instance A won't receive events emitted by instance B. The fix is adding `@socket.io/redis-adapter` so all instances share a pub/sub channel through Redis.

---

## Common Interview Questions

### Q: What's the difference between `PENDING` order status and `PENDING` payment status?

They're independent state machines on the same `Order` record:
- `Order.status` tracks the fulfillment state (PENDING → CONFIRMED → PACKED → SHIPPED → DELIVERED)
- `Order.paymentStatus` tracks the financial state (PENDING → PAID / FAILED / REFUNDED)

A COD order is `status=CONFIRMED, paymentStatus=PENDING` immediately. A Razorpay order starts as `status=PENDING, paymentStatus=PENDING` and moves to `status=CONFIRMED, paymentStatus=PAID` after webhook confirmation.

### Q: How do you handle the case where a webhook arrives before the client-side verify call?

Both paths converge safely:
- `POST /payments/verify` updates the payment and creates the delivery record
- `payment.captured` webhook checks if `OrderDelivery` already exists before creating it (prevents duplicate)
- The webhook's idempotency check on `webhookEventId` ensures it runs at most once

### Q: What happens if stock runs out between add-to-cart and checkout?

Stock is validated and decremented atomically in the `POST /orders` transaction. If stock is insufficient for any item, the entire transaction rolls back and the customer gets a 409 or 400 error. The cart is not affected — they can reduce quantity and retry.

### Q: Why do you store `vendorBreakdown` as JSON in `PaymentLedger`?

The commission breakdown is a snapshot at the time of payment. If the vendor's `commissionRate` changes later, the historical ledger should reflect the rate that was active when the order was placed. Storing it as a JSON blob in `PaymentLedger.vendorBreakdown` creates an immutable record. The alternative — a normalized `CommissionLine` table — would require a join but wouldn't change the fundamental snapshot requirement.

### Q: How do you ensure data consistency between order creation (stock deduction) and payment failure (stock restoration)?

- Stock is deducted in the `POST /orders` Prisma transaction
- If payment fails (webhook `payment.failed`), `restoreStock()` re-increments stock for each order item
- The gap between deduction and restoration is intentional: stock is "reserved" while payment is in-flight, which prevents overselling

---

## What I Would Add Next

1. **Redis adapter for Socket.IO** — multi-instance real-time support
2. **Webhook retry/dead-letter queue** — if webhook processing throws, the event should be retried via BullMQ
3. **Vendor settlement cron** — weekly batch job that marks `PaymentLedger.settledAt` and initiates bank transfers
4. **Rate limiting** — `@nestjs/throttler` on auth endpoints
5. **Elasticsearch** — product search with full-text, facets, and fuzzy matching
6. **Separate read/write models** — CQRS for analytics queries that shouldn't block the write path
