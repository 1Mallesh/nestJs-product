# TOKOMORT — Multi-Vendor E-Commerce Platform

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)

> Production-level multi-vendor e-commerce platform with real-time order tracking, Razorpay live payments, GST calculation, vendor commission settlement, and delivery boy management.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Running Locally](#running-locally)
- [API Overview](#api-overview)
- [Test Credentials](#test-credentials)
- [Deployment](#deployment)

---

## Overview

TOKOMORT is a production-grade multi-vendor marketplace where:

- **Vendors** list products, manage inventory, and receive real-time order notifications
- **Customers** browse products, checkout with Razorpay or COD, and track orders live
- **Admins** approve vendors/products, manage platform operations, and view financial reports
- **Delivery Boys** receive order assignments and update delivery status with GPS tracking

The platform handles GST-inclusive pricing (18% GST reverse-calculated), per-vendor commission rates, financial ledger entries per payment, and idempotent Razorpay webhook processing.

---

## Features

### Authentication
- JWT access tokens (15 min) + refresh tokens (7 days)
- Role-based access control: `ADMIN`, `VENDOR`, `CUSTOMER`, `DELIVERY_BOY`
- OTP verification (phone + email)
- Secure cookie + localStorage token sync

### Product Lifecycle
- Vendor creates product → status `PENDING`
- Admin reviews and approves/rejects → status `APPROVED` + `isPublished = true`
- Product appears in public catalog only when approved and published
- Real-time Socket.IO notification on approval/rejection

### Order & Payment Flow
- Local-first cart (Redux/localStorage) with DB cart fallback
- COD: order confirmed immediately on creation
- Razorpay: order created → frontend modal → HMAC signature verify → order confirmed
- Razorpay webhook (`payment.captured`) as authoritative confirmation
- Idempotent webhook processing via `webhookEventId`

### Financial Settlement
- Per-order `PaymentLedger` entry: subtotal, GST (18% inclusive), platform commission, GST on commission, delivery payout, net platform earning
- Per-vendor `totalEarnings` incremented atomically on payment confirmation
- Stock deducted on order creation; restored on payment failure

### Real-Time Events (Socket.IO `/tracking`)
| Event | Trigger |
|---|---|
| `order-status-update` | Order status change |
| `notification` | Any user notification |
| `location-update` | Delivery boy GPS update |

### Delivery
- Auto-assignment: nearest GPS-based delivery boy, or least-loaded fallback
- Delivery OTP for secure handoff
- Live GPS tracking architecture

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 App Router, React, TypeScript, Tailwind CSS |
| State Management | Redux Toolkit, React Query |
| Backend | NestJS, TypeScript |
| ORM | Prisma 5 |
| Database | PostgreSQL (Supabase) |
| Cache / Queue | Redis, BullMQ |
| Real-Time | Socket.IO |
| Payments | Razorpay (Live) |
| Auth | JWT (access + refresh), bcrypt |
| File Storage | AWS S3 |
| Shipping | Shiprocket API |
| SMS | Twilio |

---

## Project Structure

```
TOKOMORT/
├── nestJs-product/                  # NestJS Backend
│   ├── src/
│   │   ├── admin/                   # Admin product/vendor approval
│   │   ├── auth/                    # JWT, guards, strategies
│   │   ├── cart/                    # Shopping cart
│   │   ├── categories/              # Product categories
│   │   ├── common/                  # Guards, decorators, filters, interceptors
│   │   ├── delivery/                # Delivery boy management
│   │   ├── notifications/           # DB notifications
│   │   ├── orders/                  # Order creation & management
│   │   ├── payments/                # Razorpay + webhook pipeline
│   │   ├── products/                # Product CRUD
│   │   ├── queue/                   # BullMQ processors
│   │   ├── reviews/                 # Product reviews
│   │   ├── shipping/                # Shiprocket integration
│   │   ├── tracking/                # Socket.IO gateway
│   │   ├── upload/                  # S3 file upload
│   │   ├── users/                   # User profiles & addresses
│   │   ├── vendor/                  # Vendor onboarding
│   │   └── wishlist/
│   ├── prisma/
│   │   └── schema.prisma            # Full database schema
│   └── .env
│
└── nextjs-product-ecommerce/        # Next.js 15 Frontend
    ├── app/
    │   ├── (auth)/                  # Login, Register, Forgot Password
    │   ├── (store)/                 # Public storefront
    │   │   ├── products/[slug]      # Product detail
    │   │   ├── cart/                # Cart page
    │   │   ├── checkout/            # Checkout + Razorpay
    │   │   └── orders/[id]          # Order tracking
    │   └── dashboard/
    │       ├── admin/               # Admin panel
    │       ├── vendor/              # Vendor dashboard
    │       ├── customer/            # Customer portal
    │       └── delivery/            # Delivery boy app
    ├── lib/
    │   ├── adapters.ts              # Backend→Frontend type adapters
    │   ├── api.ts                   # Axios instance + interceptors
    │   └── store/                   # Redux store
    └── .env.local
```

---

## Environment Setup

### Backend (`nestJs-product/.env`)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/dbname

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

REDIS_HOST=localhost
REDIS_PORT=6379

RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_SECRET=xxxx
RAZORPAY_WEBHOOK_SECRET=xxxx    # From Razorpay Dashboard → Webhooks

AWS_ACCESS_KEY_ID=xxxx
AWS_SECRET_ACCESS_KEY=xxxx
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=app-password
```

### Frontend (`nextjs-product-ecommerce/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxx
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=TOKOMORT
```

---

## Running Locally

### Prerequisites
- Node.js 20+
- PostgreSQL or Supabase project
- Redis (local or cloud)

### Backend

```bash
cd nestJs-product
npm install
npx prisma db push          # Sync schema to DB
npx ts-node prisma/seed.ts  # Seed test data
npm run start:dev
# API: http://localhost:3000/api/v1
# Docs: http://localhost:3000/api/docs
```

### Frontend

```bash
cd nextjs-product-ecommerce
npm install
npm run dev
# App: http://localhost:3001
```

### Razorpay Webhook (local testing)

```bash
# Install Razorpay CLI or use ngrok
ngrok http 3000
# Set webhook URL in Razorpay Dashboard:
# https://<ngrok-id>.ngrok.io/api/v1/payments/webhook/razorpay
```

---

## API Overview

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` |
| Users | `GET /users/profile`, `PATCH /users/profile`, `/users/addresses` |
| Vendor | `POST /vendor/onboard`, `GET /vendor/dashboard` |
| Products | `GET /products`, `POST /products`, `GET /products/:slug` |
| Admin | `PATCH /admin/products/:id/approve`, `PATCH /admin/vendors/:id/approve` |
| Cart | `POST /cart/items`, `GET /cart`, `DELETE /cart/items/:id` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/:id` |
| Payments | `POST /payments/create-order`, `POST /payments/verify`, `POST /payments/webhook/razorpay` |
| Delivery | `GET /delivery/assigned`, `PATCH /delivery/orders/:id/status` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read` |

Full Swagger docs at `http://localhost:3000/api/docs`

---

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@ecommerce.com | Admin@123456 |
| Vendor | vendor@ecommerce.com | Vendor@123456 |
| Customer | customer@ecommerce.com | Customer@123456 |
| Delivery | delivery@ecommerce.com | Delivery@123456 |

---

## Deployment

### Backend (VPS / Railway / Render)

```bash
npm run build
npm run start:prod
```

Set `NODE_ENV=production` and configure a process manager (PM2):

```bash
pm2 start dist/main.js --name tokomort-api
```

### Frontend (Vercel)

```bash
vercel --prod
```

Update `NEXT_PUBLIC_API_URL` to your production backend URL.

### Database

Supabase (managed PostgreSQL) is used. Run migrations in production:

```bash
npx prisma migrate deploy
```
![alt text](image.png)