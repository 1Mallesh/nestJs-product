# TOKOMORT — Multi-Vendor E-Commerce Platform

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

> Production-grade multi-vendor e-commerce backend with Razorpay live payments, real-time GPS delivery tracking, GST calculation, vendor commission settlement, automated delivery assignment, and a full CI/CD pipeline.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Modules & Features](#modules--features)
- [End-to-End Payment Flow](#end-to-end-payment-flow)
- [Complete API Reference](#complete-api-reference)
- [Authentication & Role System](#authentication--role-system)
- [Real-Time Tracking (WebSocket)](#real-time-tracking-websocket)
- [Database Schema](#database-schema)
- [Order Status Lifecycle](#order-status-lifecycle)
- [Financial Settlement Logic](#financial-settlement-logic)
- [Delivery Auto-Assignment](#delivery-auto-assignment)
- [Environment Variables](#environment-variables)
- [Installation & Local Setup](#installation--local-setup)
- [Running the App](#running-the-app)
- [Swagger API Docs](#swagger-api-docs)
- [Testing](#testing)
- [End-to-End Test Checklist](#end-to-end-test-checklist)
- [CI/CD Pipeline](#cicd-pipeline)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Test Credentials](#test-credentials)
- [Key Design Decisions](#key-design-decisions)

---

## Overview

TOKOMORT is a production-level multi-vendor marketplace backend built with NestJS. It powers a complete e-commerce ecosystem where:

- **Customers** browse products, manage their cart, place orders via Razorpay or COD, and track deliveries in real time via WebSocket.
- **Vendors** onboard their shops, list products (pending admin approval), manage inventory, and track earnings with per-order commission breakdowns.
- **Delivery Boys** receive GPS-proximity-based auto-assignments, update live location, and confirm delivery via OTP.
- **Admins** approve vendors and products, manage users, issue refunds, and view platform-wide financial reports.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 (TypeScript) |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Cache | Redis (ioredis + cache-manager) |
| Authentication | JWT (access + refresh tokens) |
| Payments | Razorpay (orders, verify, webhook, refund) |
| File Storage | AWS S3 |
| Real-Time | Socket.IO (WebSocket gateway) |
| Push Notifications | Firebase FCM |
| SMS | Twilio |
| Email | Nodemailer (SMTP) |
| Shipping | Shiprocket API |
| Background Jobs | BullMQ (Redis-backed) |
| Rate Limiting | @nestjs/throttler |
| Security | Helmet, CORS, class-validator, bcrypt |
| Documentation | Swagger / OpenAPI |
| CI/CD | GitHub Actions |

---

## Architecture

```
Client (Browser / Mobile App)
        │
        ├── HTTP REST API         ├── WebSocket ws://
        ▼                         ▼
 ┌────────────────────────────────────────┐
 │           NestJS Application           │
 │                                        │
 │  LoggerMiddleware (all routes)         │
 │  ┌──────────┐   ┌───────────────────┐  │
 │  │  REST    │   │  Tracking Gateway │  │
 │  │ Controllers│  │  (Socket.IO)      │  │
 │  └──────────┘   └───────────────────┘  │
 │                                        │
 │  Global Guards: JwtAuthGuard, RolesGuard, ThrottlerGuard
 │  Global Pipe:   ValidationPipe         │
 │  Global Filter: AllExceptionsFilter    │
 │  Global Interceptors: Response, Logging│
 └───────────┬────────────────────────────┘
             │
     ┌───────┴────────────────┐
     │                        │
  Prisma ORM              Redis
  (PostgreSQL)         (Cache + BullMQ)
     │
  Razorpay   AWS S3   Firebase   Twilio   Shiprocket
```

### Request Lifecycle

```
Incoming Request
  → LoggerMiddleware          (logs method, path, IP)
  → ThrottlerGuard            (100 req / 60s rate limit)
  → JwtAuthGuard              (validates Bearer token; skips @Public() routes)
  → RolesGuard                (checks @Roles() decorator)
  → ValidationPipe            (validates & transforms DTOs)
  → Controller method
  → Service logic (Prisma / Redis / Razorpay / S3)
  → ResponseInterceptor       (wraps response in { success, data, timestamp })
  → Client
```

---

## Modules & Features

### Auth (`src/auth`)
- Register with email/phone → OTP sent
- OTP verification → account activated
- Login → JWT access token (15 min) + refresh token (7 days)
- Token refresh via `POST /auth/refresh`
- Forgot password → OTP → reset password
- Logout → refresh token invalidated in DB

### Users (`src/users`)
- View and update own profile
- Add / update / delete delivery addresses
- Address stores optional GPS coordinates for delivery assignment

### Vendor (`src/vendor`)
- Vendor onboarding with shop details, GST, PAN, Aadhaar, bank account
- Status starts as `PENDING` until admin approves
- View own orders, products, and earnings dashboard

### Admin (`src/admin`)
- Approve/reject vendor applications
- Approve/reject product listings
- View all users, orders, financial stats
- Manage platform coupons

### Products (`src/products`)
- Create product with images, variants, SKU, and stock
- Products start as `DRAFT/PENDING` → approved by admin → appear in public catalog
- Product variants (size, color) with individual pricing and stock
- Search, filter by category, price range, rating

### Categories (`src/categories`)
- Hierarchical categories (Admin CRUD)
- Products linked to categories for filtering

### Cart (`src/cart`)
- Persistent server-side cart
- Add, update quantity, remove items
- Cart cleared automatically on successful order

### Wishlist (`src/wishlist`)
- Save and remove products
- View wishlist with product details

### Orders (`src/orders`)
- Create order from cart or explicit item payload
- Supports both COD and Razorpay payment methods
- Coupon code application at checkout
- GST-inclusive price breakdown
- Shipping charge: free above ₹499 or for local delivery
- `REALTEST` coupon for real payment testing (reduces to ₹1)
- Stock deducted atomically at order creation

### Payments (`src/payments`)
- **Razorpay Order Creation**: `POST /payments/create-order`
- **Signature Verification**: `POST /payments/verify` (HMAC-SHA256)
- **Webhook Handler**: `POST /payments/webhook/razorpay`
  - `payment.captured`: financial ledger, vendor earnings
  - `payment.failed`: stock restored, order cancelled
  - `refund.created`: payment marked REFUNDED
- **Idempotency**: `webhookEventId` prevents duplicate processing
- **Refund**: Admin can trigger Razorpay refund via API

### Delivery (`src/delivery`)
- Delivery boy registration and profile
- Admin approves delivery boy
- GPS location update (latitude/longitude)
- Update delivery status (PICKED_UP, OUT_FOR_DELIVERY, DELIVERED)
- OTP-based delivery confirmation

### Shipping (`src/shipping`)
- Shiprocket API integration for non-local orders
- Create shipment, generate AWB, track shipment

### Tracking (`src/tracking`)
- Socket.IO WebSocket gateway at `/tracking`
- Real-time events: order status, delivery GPS, notifications

### Notifications (`src/notifications`)
- In-app notification records in DB
- Delivered via WebSocket in real time
- Types: ORDER_UPDATE, PAYMENT_SUCCESS, VENDOR_APPROVED, PRODUCT_APPROVED, DELIVERY_ASSIGNED, GENERAL

### Reviews (`src/reviews`)
- Customers submit product reviews and star ratings
- Average rating computed per product

### Upload (`src/upload`)
- Single and multi-file upload to AWS S3
- Returns public CDN URLs for use in products, avatars, etc.

---

## End-to-End Payment Flow

### Razorpay Online Payment (Step by Step)

```
STEP 1 — Place Order
POST /api/v1/orders
Body: { addressId, paymentMethod: "RAZORPAY", couponCode? }

Server:
  ✓ Validate delivery address
  ✓ Load cart items (DB cart or request payload)
  ✓ Validate stock availability
  ✓ Calculate: subtotal, GST (18% inclusive), discount, shipping, totalAmount
  ✓ Create Order record (status: PENDING, paymentStatus: PENDING)
  ✓ Create OrderItem records
  ✓ Decrement product stock atomically
  ✓ Notify vendors and admins via WebSocket
Response: { orderId, orderNumber, totalAmount, ... }

─────────────────────────────────────────────────────

STEP 2 — Create Razorpay Order
POST /api/v1/payments/create-order
Body: { orderId }

Server:
  ✓ Verify order belongs to current user
  ✓ Check order not already paid
  ✓ Call Razorpay SDK: orders.create({ amount, currency, receipt })
  ✓ Upsert Payment record with razorpayOrderId
Response: { razorpayOrderId, amount, currency, key }

─────────────────────────────────────────────────────

STEP 3 — Customer Pays (Client-Side)
  • Open Razorpay checkout modal with razorpayOrderId + amount
  • Customer completes UPI / card / netbanking
  • Razorpay calls onSuccess with: razorpayPaymentId, razorpayOrderId, razorpaySignature

─────────────────────────────────────────────────────

STEP 4 — Verify Signature
POST /api/v1/payments/verify
Body: { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }

Server:
  ✓ HMAC-SHA256: expectedSig = hash(razorpayOrderId + "|" + razorpayPaymentId, KEY_SECRET)
  ✓ Compare expectedSig with razorpaySignature
  ✓ Update Payment: status → PAID
  ✓ Update Order: status → CONFIRMED, paymentStatus → PAID
  ✓ Create OrderDelivery record
  ✓ Auto-assign nearest delivery boy (GPS proximity → fallback: least-loaded)
  ✓ Notify delivery boy via WebSocket
  ✓ Notify customer via WebSocket + FCM
  ✓ Emit real-time order status update
Response: { orderId }

─────────────────────────────────────────────────────

STEP 5 — Razorpay Webhook (Authoritative Confirmation)
POST /api/v1/payments/webhook/razorpay  [Public, raw body]
Header: x-razorpay-signature

Server (payment.captured):
  ✓ Verify HMAC-SHA256 webhook signature
  ✓ Check idempotency via webhookEventId
  ✓ Calculate per-vendor commission breakdown
  ✓ Save PaymentLedger: subtotal, GST, commission, net platform earning
  ✓ Increment vendor totalEarnings
  ✓ Confirm order and delivery record
  ✓ Notify customer + each vendor
  ✓ Emit real-time events

Server (payment.failed):
  ✓ Mark payment FAILED
  ✓ Cancel order
  ✓ Restore product stock

Server (refund.created):
  ✓ Mark payment REFUNDED
  ✓ Update order paymentStatus
```

### COD Flow

```
STEP 1 — Place Order (COD)
POST /api/v1/orders
Body: { addressId, paymentMethod: "COD" }

Server:
  ✓ Order status → CONFIRMED immediately
  ✓ Payment record created (method: COD, status: PENDING)
  ✓ OrderDelivery created
  ✓ Auto-assign nearest delivery boy
  ✓ Generate 4-digit delivery OTP
  ✓ Delivery boy notified

─────────────────────────────────────────────────────

STEP 2 — Delivery Boy Picks Up
PATCH /api/v1/delivery/:id/status
Body: { status: "PICKED_UP" }  →  "OUT_FOR_DELIVERY"

─────────────────────────────────────────────────────

STEP 3 — OTP Confirmation on Delivery
POST /api/v1/delivery/confirm-otp
Body: { orderId, otp }

Server:
  ✓ Verify OTP matches
  ✓ Order status → DELIVERED
  ✓ Payment status → PAID (COD collected)
  ✓ Delivery boy totalDeliveries incremented
  ✓ Customer notified
```

### Refund Flow (Admin)

```
POST /api/v1/payments/refund  [Admin only]
Body: { orderId, amount }

Server:
  ✓ Verify order payment is in PAID state
  ✓ Call Razorpay refund API
  ✓ Payment status → REFUNDED
  ✓ Order paymentStatus → REFUNDED
```

---

## Complete API Reference

Base URL: `http://localhost:3000/api/v1`

### Authentication

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/auth/register` | Register user | Public |
| POST | `/auth/verify-otp` | Verify OTP | Public |
| POST | `/auth/login` | Login | Public |
| POST | `/auth/refresh` | Refresh access token | JWT Refresh |
| POST | `/auth/forgot-password` | Send reset OTP | Public |
| POST | `/auth/reset-password` | Reset with OTP | Public |
| POST | `/auth/logout` | Invalidate token | JWT |

### Users

| Method | Path | Description | Access |
|---|---|---|---|
| GET | `/users/profile` | Get own profile | JWT |
| PATCH | `/users/profile` | Update profile | JWT |
| POST | `/users/address` | Add address | JWT |
| GET | `/users/address` | List addresses | JWT |
| PATCH | `/users/address/:id` | Update address | JWT |
| DELETE | `/users/address/:id` | Delete address | JWT |

### Vendor

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/vendor/onboard` | Vendor onboarding | JWT |
| GET | `/vendor/dashboard` | Vendor stats & earnings | VENDOR |
| GET | `/vendor/orders` | Vendor's order list | VENDOR |
| PATCH | `/vendor/profile` | Update shop details | VENDOR |

### Categories

| Method | Path | Description | Access |
|---|---|---|---|
| GET | `/categories` | List all categories | Public |
| POST | `/categories` | Create category | ADMIN |
| PATCH | `/categories/:id` | Update category | ADMIN |
| DELETE | `/categories/:id` | Delete category | ADMIN |

### Products

| Method | Path | Description | Access |
|---|---|---|---|
| GET | `/products` | List approved products | Public |
| GET | `/products/:id` | Get product detail | Public |
| POST | `/products` | Create product | VENDOR |
| PATCH | `/products/:id` | Update product | VENDOR |
| DELETE | `/products/:id` | Delete product | VENDOR |

### Cart

| Method | Path | Description | Access |
|---|---|---|---|
| GET | `/cart` | Get current cart | JWT |
| POST | `/cart/add` | Add item to cart | JWT |
| PATCH | `/cart/update` | Update item quantity | JWT |
| DELETE | `/cart/remove/:productId` | Remove item | JWT |
| DELETE | `/cart/clear` | Clear cart | JWT |

### Wishlist

| Method | Path | Description | Access |
|---|---|---|---|
| GET | `/wishlist` | Get wishlist | JWT |
| POST | `/wishlist/add` | Add to wishlist | JWT |
| DELETE | `/wishlist/remove/:productId` | Remove from wishlist | JWT |

### Orders

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/orders` | Place order (COD or Razorpay) | JWT |
| GET | `/orders` | List user's orders (paginated) | JWT |
| GET | `/orders/:id` | Order detail with tracking | JWT |
| POST | `/orders/:id/cancel` | Cancel order | JWT |
| GET | `/orders/:id/tracking` | Full tracking + Shiprocket live | JWT |

### Payments

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/payments/create-order` | Create Razorpay order | JWT |
| POST | `/payments/verify` | Verify payment signature | JWT |
| GET | `/payments/:orderId/status` | Get payment status | JWT |
| POST | `/payments/refund` | Process refund | ADMIN |
| POST | `/payments/webhook/razorpay` | Razorpay webhook (raw body) | Public |

### Delivery

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/delivery/register` | Register as delivery boy | JWT |
| GET | `/delivery/my-deliveries` | Assigned deliveries | DELIVERY_BOY |
| PATCH | `/delivery/location` | Update GPS coordinates | DELIVERY_BOY |
| PATCH | `/delivery/:id/status` | Update delivery status | DELIVERY_BOY |
| POST | `/delivery/confirm-otp` | Confirm delivery with OTP | DELIVERY_BOY |

### Admin

| Method | Path | Description | Access |
|---|---|---|---|
| GET | `/admin/dashboard` | Platform statistics | ADMIN |
| GET | `/admin/vendors` | List all vendors | ADMIN |
| PATCH | `/admin/vendors/:id/approve` | Approve/reject vendor | ADMIN |
| GET | `/admin/products` | Pending product list | ADMIN |
| PATCH | `/admin/products/:id/approve` | Approve/reject product | ADMIN |
| GET | `/admin/users` | List all users | ADMIN |
| PATCH | `/admin/users/:id/toggle` | Toggle user active status | ADMIN |

### Notifications

| Method | Path | Description | Access |
|---|---|---|---|
| GET | `/notifications` | Get user notifications | JWT |
| PATCH | `/notifications/:id/read` | Mark as read | JWT |
| PATCH | `/notifications/read-all` | Mark all as read | JWT |

### Reviews

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/reviews` | Submit product review | JWT |
| GET | `/reviews/product/:productId` | Get product reviews | Public |

### Upload

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/upload/single` | Upload single file to S3 | JWT |
| POST | `/upload/multiple` | Upload multiple files to S3 | JWT |

---

## Authentication & Role System

### Bearer Token

```
Authorization: Bearer <access_token>
```

### Roles

| Role | Permissions |
|---|---|
| `CUSTOMER` | Browse, cart, orders, wishlist, reviews, notifications |
| `VENDOR` | All CUSTOMER permissions + manage products, view earnings |
| `DELIVERY_BOY` | View assigned orders, update GPS, update status, confirm OTP |
| `ADMIN` | Full platform access including approvals, refunds, user management |

### JWT Token Flow

```
POST /auth/login
  → { accessToken (15 min), refreshToken (7 days) }

[accessToken expires]
POST /auth/refresh
  → { accessToken (new), refreshToken (rotated) }

POST /auth/logout
  → refreshToken cleared from DB
```

### Public Routes (no JWT required)

- `GET /products`, `GET /products/:id`
- `GET /categories`
- `GET /reviews/product/:productId`
- `POST /auth/register`, `/auth/login`, `/auth/verify-otp`
- `POST /auth/forgot-password`, `/auth/reset-password`
- `POST /payments/webhook/razorpay`

---

## Real-Time Tracking (WebSocket)

Connect to: `ws://localhost:3000/tracking`

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/tracking', {
  auth: { token: 'Bearer <JWT_ACCESS_TOKEN>' }
});

// Subscribe to an order's updates
socket.emit('join.order', { orderId: 'order-uuid-here' });

// Listen for order status changes
socket.on('order-status-update', ({ orderId, status }) => {
  console.log(`Order ${orderId} is now ${status}`);
});

// Listen for delivery GPS updates
socket.on('location-update', ({ deliveryBoyId, lat, lng }) => {
  updateMapMarker(lat, lng);
});

// Listen for push notifications
socket.on('notification', ({ title, message, type, orderId }) => {
  showToast(title, message);
});
```

### Server-Emitted Events

| Event | Payload | Trigger |
|---|---|---|
| `order-status-update` | `{ orderId, status }` | Order status changes |
| `location-update` | `{ deliveryBoyId, lat, lng }` | Delivery boy GPS update |
| `notification` | `{ title, message, type, orderId }` | Any notification |
| `order.created` | `{ orderId, orderNumber, totalAmount }` | New order placed |

### Client-Emitted Events

| Event | Payload | Purpose |
|---|---|---|
| `join.order` | `{ orderId }` | Subscribe to specific order updates |
| `delivery.location` | `{ lat, lng }` | Delivery boy sends GPS position |

---

## Database Schema

Key models and relationships:

```
User
 ├── Vendor (1:1)
 │    └── Product[] ──< ProductVariant
 ├── DeliveryBoy (1:1)
 ├── Address[]
 ├── Order[] ──< OrderItem
 │              ├── Payment (1:1)
 │              ├── OrderDelivery (1:1) ── DeliveryBoy
 │              ├── OrderTracking[]
 │              └── PaymentLedger (1:1)
 ├── Cart ──< CartItem
 ├── Wishlist[]
 ├── Review[]
 └── Notification[]

Product
 ├── Category
 ├── Vendor
 └── ProductVariant[]

Coupon (global discount codes)
```

---

## Order Status Lifecycle

```
                   ┌─────────────────┐
                   │     PENDING     │  ← Order created (Razorpay)
                   └────────┬────────┘
                            │ Payment verified / COD placed
                   ┌────────▼────────┐
                   │   CONFIRMED     │  ← Payment confirmed
                   └────────┬────────┘
                            │ Vendor packs
                   ┌────────▼────────┐
                   │     PACKED      │
                   └────────┬────────┘
                            │ Shipped via Shiprocket
                   ┌────────▼────────┐
                   │    SHIPPED      │
                   └────────┬────────┘
                            │ Out for local delivery
                   ┌────────▼────────┐
                   │ OUT_FOR_DELIVERY │
                   └────────┬────────┘
                            │ OTP confirmed / delivered
                   ┌────────▼────────┐
                   │   DELIVERED     │
                   └─────────────────┘

At any stage before SHIPPED:
    → CANCELLED (by customer or payment failure → stock restored)
    → RETURNED (post-delivery)
```

### Payment Status Flow

```
PENDING → PAID (Razorpay verify or COD on delivery)
        → FAILED (payment.failed webhook → stock restored, order CANCELLED)
        → REFUNDED (admin refund or order cancellation after payment)
```

---

## Financial Settlement Logic

Every confirmed Razorpay payment creates a `PaymentLedger` record:

```
totalAmount     = subtotal - discount + shippingCharge

gstAmount       = subtotal × (18 / 118)          // GST is inclusive (reverse-calculated)

Per vendor item:
  commission    = item.total × (vendor.commissionRate / 100)
  vendorEarning = item.total - commission

totalCommission = Σ all vendor commissions
gstOnCommission = totalCommission × 0.18          // GST platform owes on its income
deliveryPayout  = 0                               // set when delivery boy is paid
netPlatformEarning = totalCommission - gstOnCommission - deliveryPayout
```

`vendor.totalEarnings` is incremented atomically per `payment.captured` webhook — idempotent via `webhookEventId`.

---

## Delivery Auto-Assignment

When an order is confirmed (Razorpay verify or COD creation), the system auto-assigns a delivery boy:

```
1. If customer address has GPS coordinates:
   → Fetch all APPROVED + isAvailable delivery boys with GPS
   → Calculate Haversine distance to each
   → Assign the nearest one

2. If no GPS match (no coordinates or no boys nearby):
   → Fallback: find APPROVED + isAvailable boy with lowest totalDeliveries

3. On assignment:
   → Generate 4-digit delivery OTP
   → Upsert OrderDelivery with deliveryBoyId + otp
   → Emit WebSocket notification to delivery boy
   → Emit order status update to customer
```

Haversine formula ensures accurate great-circle distance for routing.

---

## Environment Variables

Create `.env` in the project root:

```env
# App
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce_db

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-s3-bucket-name

# Firebase FCM
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_gmail_app_password

# Shiprocket
SHIPROCKET_EMAIL=your@email.com
SHIPROCKET_PASSWORD=your_shiprocket_password
```

---

## Installation & Local Setup

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6
- npm

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/1Mallesh/nestJs-product.git
cd nestJs-product

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your actual credentials

# 4. Generate Prisma client
npm run db:generate

# 5. Apply database migrations
npm run db:migrate

# 6. (Optional) Seed with sample data
npm run db:seed
```

---

## Running the App

```bash
# Development with hot-reload
npm run start:dev

# Production build + run
npm run start:prod

# Debug mode
npm run start:debug

# Prisma Studio (DB browser)
npm run db:studio
```

Once running:

| URL | Purpose |
|---|---|
| `http://localhost:3000/api/v1` | REST API |
| `http://localhost:3000/api/docs` | Swagger documentation |
| `ws://localhost:3000/tracking` | WebSocket real-time |

### Razorpay Webhook (Local Testing)

```bash
# Option 1: ngrok
ngrok http 3000
# Set webhook URL in Razorpay Dashboard:
# https://<ngrok-id>.ngrok.io/api/v1/payments/webhook/razorpay

# Option 2: Razorpay CLI
razorpay-cli webhook listen --forward-to http://localhost:3000/api/v1/payments/webhook/razorpay
```

---

## Swagger API Docs

Full interactive Swagger documentation is available at:

```
http://localhost:3000/api/docs
```

Features:
- All endpoints with schemas and examples
- JWT Bearer token authentication (enter once, persists across requests)
- Try-it-out for every endpoint
- Grouped by module tags (Auth, Products, Payments, etc.)
- Response format documentation

---

## Testing

```bash
# Unit tests
npm run test

# Unit tests with coverage report
npm run test:cov

# End-to-end tests
npm run test:e2e

# Watch mode
npm run test:watch
```

---

## End-to-End Test Checklist

### Authentication Flow
- [ ] Register new customer → OTP returned in dev mode
- [ ] Verify OTP → account activated
- [ ] Login → receive accessToken + refreshToken
- [ ] Use refreshToken → receive new accessToken
- [ ] Logout → refreshToken invalidated

### Product & Vendor Flow
- [ ] Vendor onboards → status PENDING
- [ ] Admin approves vendor → status APPROVED
- [ ] Vendor creates product → status PENDING
- [ ] Admin approves product → product appears in public listing
- [ ] Customer searches and filters products

### Cart & Order Flow
- [ ] Customer adds items to cart
- [ ] Customer places Razorpay order → PENDING status
- [ ] Cart cleared automatically after order
- [ ] Stock decremented on order creation

### Razorpay Payment Flow
- [ ] `POST /payments/create-order` → Razorpay order created
- [ ] Client opens Razorpay modal → completes test payment
- [ ] `POST /payments/verify` → signature verified → order CONFIRMED
- [ ] Delivery boy auto-assigned → WebSocket notification delivered
- [ ] Customer receives WebSocket + FCM payment success notification

### Razorpay Webhook Flow
- [ ] `payment.captured` webhook → PaymentLedger created
- [ ] Vendor `totalEarnings` incremented correctly
- [ ] Duplicate webhook rejected via idempotency (webhookEventId)
- [ ] `payment.failed` webhook → order CANCELLED, stock restored
- [ ] `refund.created` webhook → payment REFUNDED

### COD Flow
- [ ] COD order placed → immediately CONFIRMED
- [ ] Delivery boy auto-assigned, OTP generated
- [ ] Delivery boy updates status: PICKED_UP → OUT_FOR_DELIVERY
- [ ] Customer provides OTP → delivery boy confirms
- [ ] Order → DELIVERED, payment → PAID

### Admin Refund Flow
- [ ] Admin calls `POST /payments/refund`
- [ ] Razorpay refund API invoked
- [ ] Payment status → REFUNDED, order paymentStatus → REFUNDED

### Real-Time Events
- [ ] WebSocket connection established with JWT
- [ ] `join.order` → order room joined
- [ ] Order status change emits `order-status-update`
- [ ] Delivery boy location update emits `location-update`
- [ ] Notification emits `notification` event to correct user

### Delivery Flow
- [ ] Delivery boy registers and is approved by admin
- [ ] Delivery boy updates GPS coordinates
- [ ] Nearest delivery boy assigned to order
- [ ] Fallback: least-loaded delivery boy assigned when no GPS match

### Edge Cases
- [ ] Stock validation: insufficient stock → 400 error
- [ ] Duplicate payment attempt → 400 "Order already paid"
- [ ] Invalid Razorpay signature → 400 "Invalid payment signature"
- [ ] Order cancellation after SHIPPED → 400 error
- [ ] Coupon `REALTEST` → order total reduced to ₹1 for testing
- [ ] Rate limiting → 429 after 100 requests per minute

---

## CI/CD Pipeline

This project uses **GitHub Actions** for continuous integration and deployment.

### Pipeline Location

`.github/workflows/ci.yml`

### Triggers

- Push to `main` branch
- Pull request targeting `main`

### Pipeline Stages

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Actions CI                     │
│                                                         │
│  1. Checkout code                                       │
│  2. Setup Node.js 20                                    │
│  3. Cache node_modules                                  │
│  4. npm ci (clean install)                              │
│  5. Lint (ESLint)                                       │
│  6. Type check (tsc --noEmit)                           │
│  7. Run unit tests (Jest) with coverage                 │
│  8. Build (nest build)                                  │
│  9. Upload coverage report artifact                     │
│                                                         │
│  [main branch only]                                     │
│  10. Notify deployment readiness                        │
└─────────────────────────────────────────────────────────┘
```

### Service Containers

The CI pipeline spins up:
- **PostgreSQL 15** for database tests
- **Redis 7** for cache/queue tests

### Status Badge

Add to your repo README:
```
![CI](https://github.com/1Mallesh/nestJs-product/actions/workflows/ci.yml/badge.svg)
```

---

## Project Structure

```
nestJs-product/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI/CD pipeline
│
├── src/
│   ├── main.ts                       # App bootstrap, Swagger, Helmet, CORS
│   ├── app.module.ts                 # Root module with all imports
│   │
│   ├── prisma/
│   │   ├── prisma.service.ts         # Prisma client singleton
│   │   └── prisma.module.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts   # @CurrentUser()
│   │   │   ├── roles.decorator.ts          # @Roles(Role.ADMIN)
│   │   │   └── public.decorator.ts         # @Public() — skip JWT
│   │   ├── guards/
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   ├── response.interceptor.ts     # Wraps all responses
│   │   │   └── logging.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts    # Global error handler
│   │   └── middleware/
│   │       └── logger.middleware.ts
│   │
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts             # Access token strategy
│   │   │   └── jwt-refresh.strategy.ts     # Refresh token strategy
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── jwt-refresh.guard.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       ├── login.dto.ts
│   │       ├── refresh-token.dto.ts
│   │       └── forgot-password.dto.ts
│   │
│   ├── users/                        # Profile & addresses
│   ├── vendor/                       # Vendor onboarding
│   ├── admin/                        # Admin panel
│   ├── products/                     # Product catalog
│   ├── categories/                   # Category management
│   ├── cart/                         # Shopping cart
│   ├── wishlist/                     # Wishlist
│   │
│   ├── orders/
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts         # Full order lifecycle, stock, coupons
│   │   ├── orders.module.ts
│   │   └── dto/order.dto.ts
│   │
│   ├── payments/
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts       # Razorpay, webhook, refund, ledger
│   │   ├── payments.module.ts
│   │   └── dto/payment.dto.ts
│   │
│   ├── delivery/                     # Delivery boy management
│   ├── shipping/                     # Shiprocket integration
│   │
│   ├── tracking/
│   │   └── tracking.gateway.ts       # Socket.IO WebSocket gateway
│   │
│   ├── notifications/                # In-app notifications
│   ├── reviews/                      # Product reviews
│   └── upload/                       # AWS S3 file upload
│
├── prisma/
│   ├── schema.prisma                 # Full database schema (all models)
│   ├── seed.ts                       # Sample data seeder
│   └── migrations/                   # Prisma migration history
│
├── test/
│   ├── app.e2e-spec.ts               # End-to-end tests
│   └── jest-e2e.json                 # E2E Jest config
│
├── .env                              # Environment variables (not committed)
├── .env.example                      # Template for environment variables
├── .prettierrc                       # Prettier config
├── eslint.config.mjs                 # ESLint config
├── package.json
├── tsconfig.json
└── README.md
```

---

## Deployment

### Backend (VPS / Railway / Render)

```bash
# Build
npm run build

# Run production
NODE_ENV=production node dist/main.js

# With PM2
pm2 start dist/main.js --name nestjs-product --env production
pm2 save
pm2 startup
```

### Database Migration (Production)

```bash
npx prisma migrate deploy
```

### Environment Checklist for Production

- [ ] `NODE_ENV=production`
- [ ] Strong `JWT_SECRET` and `JWT_REFRESH_SECRET` (32+ chars)
- [ ] `RAZORPAY_KEY_ID` uses live key (`rzp_live_...`)
- [ ] `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard
- [ ] `ALLOWED_ORIGINS` set to production frontend domain
- [ ] Redis connection string points to production Redis
- [ ] AWS S3 bucket in correct region with proper IAM permissions
- [ ] Firebase credentials loaded from secure secret store

---

## Test Credentials

After running `npm run db:seed`:

| Role | Email | Password |
|---|---|---|
| Admin | admin@ecommerce.com | Admin@123456 |
| Vendor | vendor@ecommerce.com | Vendor@123456 |
| Customer | customer@ecommerce.com | Customer@123456 |
| Delivery Boy | delivery@ecommerce.com | Delivery@123456 |

**Razorpay Test Card:**
- Card: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits
- OTP: `1234`

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| Server-side Razorpay signature verification | Prevents client-side payment spoofing |
| Webhook idempotency via `webhookEventId` | Razorpay can retry webhooks; duplicate processing prevented |
| GPS Haversine distance for delivery assignment | Accurate great-circle distance over flat-earth approximation |
| GST reverse-calculated from inclusive price | Indian marketplace compliance: product prices already include 18% GST |
| `$transaction` for order + stock + payment | Atomic operations prevent partial state (e.g., stock decremented but order not created) |
| Stock restored on `payment.failed` webhook | Prevents permanent inventory loss when payment fails after stock deduction |
| Fallback delivery assignment (least-loaded) | Ensures order always gets a delivery boy even if GPS unavailable |
| BullMQ for background jobs | Reliable async processing with retries for emails, SMS, push notifications |
| Rate limiting (100 req/min) via ThrottlerGuard | Prevents abuse and brute-force attacks |
| `@Public()` decorator for webhook | Webhook signature verified in service; JWT guard correctly bypassed |
| Per-vendor commission rates | Flexible marketplace: different vendors can have different commission agreements |

---

## Support

For issues or feature requests:
- GitHub Issues: `https://github.com/1Mallesh/nestJs-product/issues`
- Swagger Docs: `http://localhost:3000/api/docs`
