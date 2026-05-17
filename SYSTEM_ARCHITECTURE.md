# TOKOMORT — System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│                                                                     │
│   Next.js 15 App Router (SSR + CSR)                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐      │
│   │ Storefront│  │  Vendor  │  │  Admin   │  │   Delivery   │      │
│   │  (public) │  │Dashboard │  │  Panel   │  │   Dashboard  │      │
│   └──────────┘  └──────────┘  └──────────┘  └──────────────┘      │
│                                                                     │
│   Redux Toolkit (auth/cart/wishlist) + React Query (server state)  │
│   Axios (REST) + Socket.IO Client (real-time)                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTP / WebSocket
┌───────────────────────────▼─────────────────────────────────────────┐
│                         API GATEWAY                                 │
│                                                                     │
│   NestJS (Express platform)                                         │
│   Global prefix: /api/v1                                            │
│   Swagger docs: /api/docs                                           │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ Cross-cutting: JwtAuthGuard, RolesGuard, ValidationPipe,    │   │
│   │ AllExceptionsFilter, RawBody (Razorpay webhook)             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   REST Modules          WebSocket              Queue                │
│   ┌────────────┐        ┌───────────────┐      ┌──────────────┐    │
│   │ Auth       │        │ TrackingGateway│      │ BullMQ       │    │
│   │ Orders     │        │ /tracking ns  │      │ Processors   │    │
│   │ Payments   │        └───────────────┘      └──────────────┘    │
│   │ Products   │                                                    │
│   │ Vendor     │                                                    │
│   │ Admin      │                                                    │
│   │ Delivery   │                                                    │
│   └────────────┘                                                    │
└───────┬───────────────────────────────────┬─────────────────────────┘
        │ Prisma ORM                         │ Redis
┌───────▼───────────┐               ┌───────▼──────────┐
│  PostgreSQL        │               │  Redis           │
│  (Supabase)        │               │  Sessions/Cache  │
│                    │               │  BullMQ Queues   │
│  18 models         │               └──────────────────┘
└────────────────────┘
        │
┌───────▼─────────────────────────────┐
│  External Services                  │
│  Razorpay (payments + webhooks)     │
│  Shiprocket (shipping)              │
│  AWS S3 (file storage)              │
│  Twilio (SMS OTP)                   │
│  SMTP/Gmail (email)                 │
└─────────────────────────────────────┘
```

---

## Frontend Architecture

### Route Groups (Next.js App Router)

```
app/
├── (auth)/                    # Unauthenticated layout
│   └── auth/
│       ├── login/
│       ├── register/
│       └── forgot-password/
│
├── (store)/                   # Public storefront layout
│   ├── products/[slug]        # Product detail page (SSR)
│   ├── cart/                  # Shopping cart
│   ├── checkout/              # Razorpay checkout
│   ├── orders/[id]            # Order tracking
│   ├── categories/[slug]      # Category listing
│   └── wishlist/
│
└── dashboard/
    ├── admin/                 # Protected: ADMIN only
    │   ├── products/          # Product approval queue
    │   ├── vendors/           # Vendor approval
    │   ├── orders/
    │   ├── analytics/
    │   └── reports/
    ├── vendor/                # Protected: VENDOR only
    │   ├── products/          # Product CRUD
    │   ├── orders/
    │   ├── earnings/
    │   └── analytics/
    ├── customer/              # Protected: CUSTOMER
    │   ├── orders/
    │   ├── addresses/
    │   └── profile/
    └── delivery/              # Protected: DELIVERY_BOY
        ├── orders/
        ├── tracking/
        └── earnings/
```

### State Management Strategy

```
┌─────────────────────────────────────────────────────────┐
│                   State Layers                          │
│                                                         │
│  Redux Toolkit (client state — persisted)               │
│  ┌──────────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ authSlice    │ │cartSlice │ │ wishlistSlice    │    │
│  │ user, tokens │ │ items[]  │ │ productIds[]     │    │
│  └──────────────┘ └──────────┘ └──────────────────┘    │
│                                                         │
│  React Query (server state — cached + synced)           │
│  ┌──────────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ useProducts  │ │useOrders │ │ useNotifications │    │
│  │ useProfile   │ │useCart   │ │ useAnalytics     │    │
│  └──────────────┘ └──────────┘ └──────────────────┘    │
│                                                         │
│  Adapters (lib/adapters.ts)                             │
│  Backend field names → Frontend type field names        │
│  fullName→name, addressLine1→line1, comparePrice→mrp   │
└─────────────────────────────────────────────────────────┘
```

---

## Backend Architecture

### Module Dependency Graph

```
AppModule
├── ConfigModule (global)
├── PrismaModule (global)
├── AuthModule
│   └── JwtModule, PassportModule
├── TrackingModule         ← Socket.IO Gateway (exported)
│   └── AuthModule
├── NotificationsModule    ← DB notification service (exported)
├── OrdersModule
│   ├── TrackingModule
│   ├── NotificationsModule
│   └── ShippingModule
├── PaymentsModule
│   ├── TrackingModule
│   └── NotificationsModule
├── ProductsModule
│   ├── TrackingModule
│   └── NotificationsModule
└── AdminModule
    ├── TrackingModule
    └── NotificationsModule
```

### Request Pipeline

```
HTTP Request
    │
    ▼
helmet() → CORS middleware
    │
    ▼
JwtAuthGuard (checks @Public() skip)
    │
    ▼
RolesGuard (checks @Roles(...))
    │
    ▼
ValidationPipe (whitelist + transform)
    │
    ▼
Controller → Service → Prisma → PostgreSQL
    │
    ▼
AllExceptionsFilter (on error)
    → Prisma P2002/P2003/P2025 → human-readable messages
    → HttpException → standard JSON error
    → Unknown → 500
```

### Socket.IO Gateway Architecture

```
TrackingGateway (/tracking namespace)
│
├── Rooms:
│   ├── user:{userId}        → personal notifications
│   └── order:{orderId}      → order status updates
│
├── Events emitted by server:
│   ├── notification         → user-scoped alerts
│   ├── order-status-update  → order state change
│   └── location-update      → delivery GPS coordinates
│
└── Client join events:
    ├── joinOrderRoom        → client subscribes to order
    └── joinUserRoom         → client subscribes to self
```

---

## Database Schema

### Core Models

```
User (users)
├── id, name, email, phone, password, role
├── isEmailVerified, isPhoneVerified, isActive
├── refreshToken, otp, otpExpiresAt
└── → Vendor?, DeliveryBoy?, Address[], Order[], Cart?, Notification[]

Vendor (vendors)
├── userId (FK → User)
├── shopName, gstNumber, panNumber, aadhaarNumber
├── bankAccountNumber, bankIfscCode, bankAccountName
├── approvalStatus (PENDING|APPROVED|REJECTED|DRAFT)
├── commissionRate (default 10.0%)
└── totalEarnings

Product (products)
├── vendorId, categoryId
├── name, slug, sku, price, comparePrice, stock
├── approvalStatus, isPublished
├── approvedBy, approvedAt, publishedAt
└── → ProductVariant[], OrderItem[], Review[]

Order (orders)
├── userId, addressId
├── orderNumber, status, paymentStatus, paymentMethod
├── subtotal, shippingCharge, discount, totalAmount
├── deliveryType (LOCAL|SHIPROCKET)
└── → OrderItem[], Payment?, OrderDelivery?

Payment (payments)
├── orderId (FK → Order)
├── razorpayOrderId, razorpayPaymentId, razorpaySignature
├── webhookEventId (UNIQUE — idempotency key)
├── status (PENDING|PAID|FAILED|REFUNDED)
└── → PaymentLedger?

PaymentLedger (payment_ledger)
├── paymentId, orderId
├── totalAmount, subtotal, gstAmount, shippingCharge, discount
├── platformCommission, gstOnCommission
├── deliveryPayout, netPlatformEarning
└── vendorBreakdown (JSON: {vendorId, shopName, itemTotal, commission, vendorEarning}[])
```

### Enums

```
Role:           ADMIN | CUSTOMER | VENDOR | DELIVERY_BOY
ApprovalStatus: PENDING | APPROVED | REJECTED | DRAFT
OrderStatus:    PENDING | CONFIRMED | PACKED | SHIPPED | OUT_FOR_DELIVERY | DELIVERED | CANCELLED | RETURNED
PaymentStatus:  PENDING | PAID | FAILED | REFUNDED
PaymentMethod:  RAZORPAY | COD
DeliveryType:   LOCAL | SHIPROCKET
NotificationType: ORDER_UPDATE | PRODUCT_APPROVED | VENDOR_APPROVED | DELIVERY_ASSIGNED | PAYMENT_SUCCESS | GENERAL
```

---

## Razorpay Payment Flow

```
CUSTOMER CHECKOUT
      │
      ▼
POST /orders                     ← Creates order, deducts stock
      │
      ├── COD → order status = CONFIRMED immediately
      │
      └── RAZORPAY ──────────────────────────────────────────────────┐
                                                                      │
POST /payments/create-order       ← Creates Razorpay order via API   │
      │                                                               │
      ▼                                                               │
Razorpay Checkout Modal (frontend)                                    │
      │                                                               │
      ▼                                                               │
POST /payments/verify             ← Client-side HMAC verify          │
      │                           ← Confirms order in DB             │
      │                           ← Auto-assigns delivery boy        │
      │                                                               │
      │  (async, server-to-server)                                    │
      ▼                                                               │
POST /payments/webhook/razorpay   ← Razorpay server webhook ─────────┘
      │
      ├── Verify HMAC with RAZORPAY_WEBHOOK_SECRET
      ├── Check webhookEventId for idempotency
      ├── payment.captured:
      │   ├── Update Payment status → PAID
      │   ├── Update Order status → CONFIRMED
      │   ├── Create OrderDelivery record
      │   ├── Create PaymentLedger (GST, commission, payout)
      │   ├── Increment vendor totalEarnings
      │   ├── Notify customer + vendors via DB + Socket.IO
      │   └── Emit order-status-update real-time event
      │
      ├── payment.failed:
      │   ├── Update Payment → FAILED
      │   ├── Cancel Order
      │   └── Restore stock
      │
      └── refund.created:
          └── Update Payment → REFUNDED
```

---

## Order Lifecycle

```
POST /orders
      │
      ▼
  PENDING ──── COD ──────────────────► CONFIRMED
      │
      └── RAZORPAY ──► (await payment) ► CONFIRMED
                                              │
                                              ▼
                                           PACKED
                                              │
                                              ▼
                                           SHIPPED
                                              │
                                              ▼
                                       OUT_FOR_DELIVERY
                                              │
                                              ▼
                                          DELIVERED
                                              │
                             ┌────────────────┘
                             ▼
                         RETURNED (if applicable)

     CONFIRMED / PACKED → CANCELLED (admin or customer)
```

---

## Product Approval Lifecycle

```
Vendor Creates Product
        │
        ▼
  approvalStatus = PENDING
  isPublished = false
        │
        ▼
  Admin notified (DB + Socket.IO event: product.pending)
        │
        ├── Admin APPROVES
        │       │
        │       ▼
        │   approvalStatus = APPROVED
        │   isPublished = true
        │   approvedBy = adminId
        │   approvedAt = now()
        │   publishedAt = now()
        │       │
        │       ▼
        │   Socket.IO event: product.approved → vendor
        │   Public catalog: product NOW visible
        │
        └── Admin REJECTS
                │
                ▼
            approvalStatus = REJECTED
            rejectionReason = "..."
            isPublished = false
                │
                ▼
            Socket.IO event: product.rejected → vendor
            Public catalog: product NOT visible
```

---

## Delivery Flow

```
Order CONFIRMED
      │
      ▼
Auto-assign delivery boy:
  1. Find boys with approvalStatus=APPROVED, isAvailable=true
  2. If customer address has GPS:
     → Calculate Haversine distance to each boy's currentLatitude/Longitude
     → Pick closest boy
  3. Fallback: pick boy with lowest totalDeliveries
      │
      ▼
OrderDelivery record created:
  deliveryBoyId = assigned boy
  assignedAt = now()
  deliveryOtp = 4-digit PIN (for secure handoff)
      │
      ▼
Socket.IO notification → delivery boy's userId room
      │
      ▼
Delivery Boy App Flow:
  CONFIRMED → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
      │
      ▼
On DELIVERED:
  OrderDelivery.deliveredAt = now()
  DeliveryBoy.totalDeliveries += 1
  PaymentLedger.deliveryPayout updated
  DeliveryBoy.totalEarnings += deliveryPayout
```

---

## Financial Settlement Model

```
Order Total = ₹1000 (GST-inclusive)

Breakdown:
  Subtotal             = ₹1000.00
  GST (18% inclusive)  = ₹1000 × (18/118) = ₹152.54
  Shipping             = ₹0 (free for local)
  Discount (coupon)    = ₹0

Per Vendor (commissionRate = 10%):
  Item Total           = ₹1000
  Platform Commission  = ₹100  (10%)
  Vendor Earning       = ₹900  (90%)

Platform:
  Gross Commission     = ₹100
  GST on Commission    = ₹18   (18% on ₹100)
  Delivery Payout      = ₹40   (set on delivery)
  Net Platform Earning = ₹42

All persisted in PaymentLedger per payment.
Vendor.totalEarnings incremented atomically in $transaction.
```

---

## Deployment Architecture

```
Production Setup (recommended)

Internet
    │
    ▼
Cloudflare (CDN + DDoS protection)
    │
    ├── nextjs-product-ecommerce → Vercel (serverless)
    │
    └── nestJs-product → VPS / Railway / Render
            │
            ├── PM2 cluster mode (multi-core)
            ├── Nginx reverse proxy (port 80/443 → 3000)
            │
            ├── PostgreSQL → Supabase (managed)
            ├── Redis      → Upstash or self-hosted
            └── Files      → AWS S3 + CloudFront CDN

Environment:
  NODE_ENV=production
  All secrets in environment variables (never in code)
  RAZORPAY_WEBHOOK_SECRET set in Razorpay Dashboard
  Webhook URL: https://api.tokomort.com/api/v1/payments/webhook/razorpay
```
