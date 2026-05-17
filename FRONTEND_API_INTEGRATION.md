# TOKOMORT — Frontend API Integration Guide

> **Base URL:** `http://localhost:3000/api/v1`  
> **Swagger Docs:** `http://localhost:3000/api/docs`  
> **WebSocket:** `ws://localhost:3000/tracking`

---

## Table of Contents

1. [Authentication Flow](#1-authentication-flow)
2. [User Profile & Addresses](#2-user-profile--addresses)
3. [Categories](#3-categories)
4. [Products (Public)](#4-products-public)
5. [Cart](#5-cart)
6. [Wishlist](#6-wishlist)
7. [Orders & Checkout Flow](#7-orders--checkout-flow)
8. [Payments (Razorpay)](#8-payments-razorpay)
9. [Reviews](#9-reviews)
10. [Notifications](#10-notifications)
11. [File Upload](#11-file-upload)
12. [Vendor Panel APIs](#12-vendor-panel-apis)
13. [Admin Panel APIs](#13-admin-panel-apis)
14. [Delivery Boy APIs](#14-delivery-boy-apis)
15. [WebSocket Real-Time Events](#15-websocket-real-time-events)
16. [Response Format](#16-response-format)
17. [Error Handling](#17-error-handling)
18. [Role-Based Access Summary](#18-role-based-access-summary)

---

## 1. Authentication Flow

### How it works
1. Register → Get OTP on email → Verify OTP → Login → Receive `accessToken` + `refreshToken`
2. Send `accessToken` in every protected request header: `Authorization: Bearer <token>`
3. When `accessToken` expires (15 min default), call `/auth/refresh` with `refreshToken`

---

### POST `/auth/register`
**Access:** Public

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "Password@123",
  "role": "CUSTOMER"
}
```
> `role` options: `CUSTOMER`, `VENDOR`, `DELIVERY_BOY`

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": { "userId": "uuid", "email": "john@example.com" }
}
```

---

### POST `/auth/verify-otp`
**Access:** Public

**Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

---

### POST `/auth/login`
**Access:** Public

**Body:**
```json
{
  "email": "john@example.com",
  "password": "Password@123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "CUSTOMER"
    }
  }
}
```
> **Store both tokens.** Save `accessToken` in memory, `refreshToken` in `localStorage` or HTTP-only cookie.

---

### POST `/auth/refresh`
**Access:** Bearer `refreshToken` (not accessToken)

**Response:** New `accessToken` + `refreshToken`

---

### POST `/auth/logout`
**Access:** Bearer `accessToken`

---

### POST `/auth/forgot-password`
**Body:** `{ "email": "john@example.com" }`

---

### POST `/auth/reset-password`
**Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "NewPassword@123"
}
```

---

## 2. User Profile & Addresses

All endpoints require `Authorization: Bearer <accessToken>`

### GET `/users/profile`
Returns full user profile.

### PUT `/users/profile`
**Body:**
```json
{
  "name": "Updated Name",
  "avatar": "https://cdn.example.com/avatar.jpg"
}
```

### GET `/users/addresses`
Returns array of saved addresses.

### POST `/users/addresses`
**Body:**
```json
{
  "label": "Home",
  "fullName": "John Doe",
  "phone": "9876543210",
  "addressLine1": "123 Main Street",
  "addressLine2": "Apt 4B",
  "city": "Bengaluru",
  "state": "Karnataka",
  "pincode": "560001",
  "country": "India",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "isDefault": true
}
```

### PUT `/users/addresses/:id`
Update address (partial body allowed).

### DELETE `/users/addresses/:id`

---

## 3. Categories

### GET `/categories`
**Access:** Public — Returns all active categories (with subcategories).

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Electronics",
      "slug": "electronics",
      "image": "https://...",
      "children": [
        { "id": "uuid", "name": "Mobile Phones", "slug": "mobile-phones" }
      ]
    }
  ]
}
```

### GET `/categories/:id`
**Access:** Public — Single category with products.

> **Admin only:** `POST /categories`, `PUT /categories/:id`, `DELETE /categories/:id`

---

## 4. Products (Public)

### GET `/products`
**Access:** Public — Returns only `APPROVED + isPublished` products.

**Query Params:**
| Param | Type | Example |
|-------|------|---------|
| `page` | number | `1` |
| `limit` | number | `20` |
| `categoryId` | UUID | `f6c7b1d4-...` |
| `search` | string | `iPhone` |
| `minPrice` | number | `500` |
| `maxPrice` | number | `50000` |

**Example:** `GET /products?search=iPhone&categoryId=abc&minPrice=10000&page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "iPhone 15",
        "price": 80000,
        "comparePrice": 85000,
        "images": ["https://..."],
        "averageRating": 4.5,
        "reviewCount": 12,
        "stock": 10,
        "vendor": { "shopName": "Apple Store" },
        "category": { "name": "Mobiles", "slug": "mobiles" }
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### GET `/products/:id`
**Access:** Public — Full product details with variants, reviews, vendor info.

---

## 5. Cart

All endpoints require login.

### GET `/cart`
Returns cart with all items, prices, subtotal.

### POST `/cart/add`
**Body:**
```json
{
  "productId": "uuid",
  "variantId": "uuid",
  "quantity": 2
}
```
> `variantId` is optional (only for products with variants like size/color).

### PUT `/cart/items/:itemId`
**Body:** `{ "quantity": 3 }`

### DELETE `/cart/items/:itemId`

### DELETE `/cart/clear`

---

## 6. Wishlist

All endpoints require login.

### GET `/wishlist`

### POST `/wishlist/:productId/toggle`
Adds product if not in wishlist, removes if already there. Returns `{ added: true/false }`.

### DELETE `/wishlist/:productId`

---

## 7. Orders & Checkout Flow

### Complete Checkout Flow

```
1. Customer adds products to cart
2. Customer selects/adds delivery address
3. GET /users/addresses → pick addressId
4. POST /orders → creates order (validates stock, applies coupon)
5. POST /payments/create-order → creates Razorpay order
6. Frontend opens Razorpay payment modal
7. After payment success → POST /payments/verify → confirms order
8. GET /orders/:id → show order confirmation
```

---

### POST `/orders`
**Access:** Customer (JWT required)

**Body:**
```json
{
  "addressId": "uuid",
  "paymentMethod": "RAZORPAY",
  "couponCode": "SAVE10",
  "notes": "Leave at door"
}
```
> `paymentMethod`: `RAZORPAY` or `COD`  
> `couponCode` is optional

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "orderNumber": "ORD-20260517-001",
    "totalAmount": 82000,
    "paymentMethod": "RAZORPAY",
    "deliveryType": "LOCAL"
  }
}
```

### GET `/orders`
Get all orders for logged-in user.
Query: `?page=1&limit=10`

### GET `/orders/:id`
Full order details with items, payment status, delivery info.

### POST `/orders/:id/cancel`
**Body:** `{ "reason": "Changed my mind" }`
> Only `PENDING` or `CONFIRMED` orders can be cancelled.

### GET `/orders/:id/tracking`
Returns delivery GPS tracking history.

---

## 8. Payments (Razorpay)

### Complete Razorpay Integration Flow

#### Step 1 — Create Razorpay Order
### POST `/payments/create-order`
**Body:**
```json
{
  "orderId": "uuid-from-POST-/orders"
}
```

**Response:**
```json
{
  "data": {
    "razorpayOrderId": "order_xyz123",
    "amount": 8200000,
    "currency": "INR",
    "key": "rzp_test_..."
  }
}
```

#### Step 2 — Open Razorpay Modal (Frontend JS)
```javascript
const options = {
  key: response.data.key,
  amount: response.data.amount,
  currency: "INR",
  order_id: response.data.razorpayOrderId,
  name: "TOKOMORT",
  description: "Order Payment",
  handler: async function (paymentResponse) {
    // Step 3: Verify payment
    await axios.post('/api/v1/payments/verify', {
      razorpayOrderId: paymentResponse.razorpay_order_id,
      razorpayPaymentId: paymentResponse.razorpay_payment_id,
      razorpaySignature: paymentResponse.razorpay_signature,
      orderId: "your-order-uuid"
    });
  }
};
const rzp = new Razorpay(options);
rzp.open();
```

#### Step 3 — Verify Payment
### POST `/payments/verify`
**Body:**
```json
{
  "orderId": "uuid",
  "razorpayOrderId": "order_xyz123",
  "razorpayPaymentId": "pay_abc456",
  "razorpaySignature": "hash_string"
}
```

### GET `/payments/:orderId/status`
Check payment status for an order.

---

## 9. Reviews

### POST `/reviews`
**Access:** Customer (JWT) — only verified buyers (delivered + paid orders)

**Body:**
```json
{
  "productId": "uuid",
  "rating": 5,
  "title": "Excellent product",
  "comment": "Battery life is amazing",
  "images": ["https://cdn.example.com/review1.jpg"]
}
```

### GET `/reviews/product/:productId`
**Access:** Public
Query: `?page=1&limit=10`

### DELETE `/reviews/:id`
**Access:** JWT (own review only)

---

## 10. Notifications

All require JWT.

### GET `/notifications`
Query: `?page=1&limit=20`

**Response:**
```json
{
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "title": "Order Confirmed",
        "message": "Your order ORD-001 has been confirmed.",
        "type": "ORDER_UPDATE",
        "isRead": false,
        "createdAt": "2026-05-17T10:00:00Z"
      }
    ],
    "total": 5,
    "unreadCount": 2
  }
}
```

### PATCH `/notifications/:id/read`
Mark single notification as read.

### PATCH `/notifications/read-all`
Mark all as read.

### DELETE `/notifications/:id`

---

## 11. File Upload

All require JWT.

### POST `/upload/single`
**Content-Type:** `multipart/form-data`  
**Field name:** `file`  
**Query:** `?folder=products` (optional, default: `uploads`)  
**Accepted:** JPEG, PNG, WebP, GIF — max 5MB

**Response:**
```json
{ "data": { "url": "https://s3.amazonaws.com/bucket/products/image.jpg" } }
```

### POST `/upload/multiple`
**Field name:** `files` — max 5 files

**Response:**
```json
{ "data": { "urls": ["https://...", "https://..."] } }
```

---

## 12. Vendor Panel APIs

All require JWT + role `VENDOR`.

### POST `/vendor/onboard`
**Also accessible by:** `CUSTOMER` (to become a vendor)

**Body:**
```json
{
  "shopName": "My Apple Store",
  "shopDescription": "Premium Apple products",
  "panNumber": "ABCDE1234F",
  "aadhaarNumber": "123456789012",
  "gstNumber": "27AAPFU0939F1ZV",
  "bankAccountNumber": "1234567890",
  "bankIfscCode": "HDFC0001234",
  "bankAccountName": "John Doe"
}
```

### GET `/vendor/profile`

### PUT `/vendor/profile`
**Body:** `{ "shopName": "...", "shopDescription": "...", "shopLogo": "url", "shopBanner": "url" }`

### GET `/vendor/dashboard`
Returns: total products, total orders, total revenue, total earnings.

### GET `/vendor/orders`
Query: `?page=1&limit=10`

### PUT `/vendor/orders/:itemId/status`
**Body:** `{ "status": "PACKED" }`
> Status options: `PENDING` → `CONFIRMED` → `PACKED` → `SHIPPED`

---

### Vendor Product Management

### POST `/products`
Create a new product (submitted for admin approval).

**Body:**
```json
{
  "name": "iPhone 15",
  "description": "Apple iPhone 15 128GB",
  "shortDescription": "Latest iPhone model",
  "categoryId": "uuid-of-category",
  "sku": "IPHONE15-128",
  "price": 80000,
  "comparePrice": 85000,
  "costPrice": 70000,
  "stock": 50,
  "weight": 172,
  "images": ["https://cdn.example.com/iphone15.jpg"],
  "tags": ["apple", "iphone", "smartphone"]
}
```
> After creation, status is `PENDING` — product is NOT visible publicly until admin approves it.

### GET `/products/vendor/my-products`
Query: `?page=1&limit=10`
Returns all own products (all statuses, including pending/rejected).

### PUT `/products/:id`
Update product.

### DELETE `/products/:id`
Deactivates (soft delete) the product.

### POST `/products/:id/variants`
**Body:**
```json
{
  "name": "Color",
  "value": "Midnight Black",
  "price": 82000,
  "stock": 20,
  "sku": "IPHONE15-BLACK"
}
```

---

## 13. Admin Panel APIs

All require JWT + role `ADMIN`.

### GET `/admin/dashboard`
Returns platform-wide analytics.

---

### Vendor Management

### GET `/admin/vendors`
Query: `?page=1&limit=10&status=PENDING`
> Status filter: `PENDING`, `APPROVED`, `REJECTED`

### PATCH `/admin/vendors/:id/approve`
**Body:**
```json
{
  "approved": true,
  "reason": "All documents verified"
}
```
> Set `approved: false` + `reason` to reject.

---

### Product Management

### GET `/admin/products`
Query: `?page=1&limit=10&status=PENDING`

### PATCH `/admin/products/:id/approve`
**Body:**
```json
{
  "approved": true
}
```
OR to reject:
```json
{
  "approved": false,
  "reason": "Images are blurry, please re-upload"
}
```
> When `approved: true` → product `isPublished = true`, appears publicly immediately.  
> Vendor gets notified via DB notification + Socket.IO event.

---

### User Management

### GET `/admin/users`
Query: `?page=1&limit=10&role=CUSTOMER`

### PATCH `/admin/users/:id/toggle-block`
Blocks or unblocks a user account.

---

### Order Management

### GET `/admin/orders`
Query: `?page=1&limit=10&status=PENDING`

### POST `/admin/orders/:orderId/assign-delivery`
**Body:** `{ "deliveryBoyId": "uuid" }`

---

### Delivery Boy Management

### GET `/admin/delivery-boys`
Query: `?page=1&limit=10&status=PENDING`

### PATCH `/admin/delivery-boys/:id/approve`
**Body:** `{ "approved": true }`

---

### Analytics

### GET `/admin/analytics/revenue`
Query: `?days=30`

---

## 14. Delivery Boy APIs

All require JWT + role `DELIVERY_BOY`.

### POST `/delivery/onboard`
**Also accessible by:** `CUSTOMER`

**Body:**
```json
{
  "aadhaarNumber": "123456789012",
  "panNumber": "ABCDE1234F",
  "drivingLicense": "DL123456",
  "vehicleType": "BIKE",
  "vehicleNumber": "KA01AB1234",
  "bankAccountNumber": "1234567890",
  "bankIfscCode": "HDFC0001234",
  "bankAccountName": "John Doe"
}
```

### GET `/delivery/profile`

### GET `/delivery/dashboard`
Returns: today's deliveries, pending count, total earnings.

### GET `/delivery/deliveries`
Query: `?status=ASSIGNED`

### POST `/delivery/location`
**Body:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "orderId": "uuid"
}
```
> Emits real-time location update via Socket.IO to customer tracking room.

### PUT `/delivery/deliveries/:id/status`
**Body:**
```json
{
  "status": "PICKED_UP",
  "notes": "Package collected from vendor"
}
```
> Status: `PICKED_UP` or `DELIVERED`

### POST `/delivery/toggle-availability`
Toggles online/offline status.

---

## 15. WebSocket Real-Time Events

**Endpoint:** `ws://localhost:3000/tracking`  
**Library:** Socket.IO client

### Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/tracking', {
  auth: { token: 'Bearer eyJ...' }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
  // Join your personal notification room
  socket.emit('join-user-room');
});
```

---

### Events You Emit (Client → Server)

| Event | Payload | Description |
|-------|---------|-------------|
| `join-user-room` | none | Join `user:<userId>` room for notifications |
| `join-order-room` | `{ orderId: "uuid" }` | Subscribe to order tracking updates |
| `leave-order-room` | `{ orderId: "uuid" }` | Unsubscribe from order |

---

### Events You Listen (Server → Client)

| Event | When Fired | Payload |
|-------|-----------|---------|
| `notification` | New notification for user | `{ title, message, type, data }` |
| `product.pending` | Vendor creates product | `{ productId, vendorId, name }` |
| `product.approved` | Admin approves product | `{ productId, vendorId, name, approvedBy }` |
| `product.rejected` | Admin rejects product | `{ productId, vendorId, name }` |
| `location-update` | Delivery boy moves | `{ latitude, longitude, deliveryBoyId, timestamp }` |
| `order-status-update` | Order status changes | `{ orderId, status, timestamp }` |

---

### Frontend Socket Setup Example

```javascript
// After login
const socket = io('http://localhost:3000/tracking', {
  auth: { token: localStorage.getItem('accessToken') }
});

// Join notification room
socket.emit('join-user-room');

// Listen for notifications
socket.on('notification', (data) => {
  showToast(data.title, data.message);
  refreshNotificationBadge();
});

// For order tracking page
socket.emit('join-order-room', { orderId: currentOrderId });

socket.on('location-update', (data) => {
  updateDeliveryMarkerOnMap(data.latitude, data.longitude);
});

socket.on('order-status-update', (data) => {
  updateOrderStatusUI(data.status);
});

// For vendor — listen for product approval
socket.on('product.approved', (data) => {
  showAlert(`Your product "${data.name}" is now live!`);
});

socket.on('product.rejected', (data) => {
  showAlert(`Your product "${data.name}" was rejected.`);
});
```

---

## 16. Response Format

All API responses follow this consistent structure:

### Success Response
```json
{
  "success": true,
  "message": "Human readable message",
  "data": { ... },
  "timestamp": "2026-05-17T10:00:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Products fetched",
  "data": {
    "products": [...],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

---

## 17. Error Handling

### Error Response Format
```json
{
  "statusCode": 400,
  "timestamp": "2026-05-17T10:00:00.000Z",
  "path": "/api/v1/products",
  "method": "POST",
  "message": "Category not found"
}
```

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| `200` | OK | GET/PUT/PATCH success |
| `201` | Created | POST success |
| `400` | Bad Request | Validation error, invalid data |
| `401` | Unauthorized | Missing/expired token |
| `403` | Forbidden | Wrong role / unapproved vendor |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate email, SKU, etc. |
| `429` | Too Many Requests | Rate limit hit (100 req/60s) |
| `500` | Internal Server Error | Unexpected server error |

### Common Error Messages

| Message | Fix |
|---------|-----|
| `Vendor account not yet approved` | Admin needs to approve vendor first |
| `Category not found` | Use a valid categoryId from `GET /categories` |
| `Unique constraint violation on field: sku` | SKU already exists, use different SKU |
| `Foreign key constraint failed` | Referenced ID (categoryId, etc.) doesn't exist |
| `Vendor profile not found` | Complete vendor onboarding first |

### Axios Interceptor Setup (Recommended)
```javascript
// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const { data } = await axios.post('/api/v1/auth/refresh', {}, {
        headers: { Authorization: `Bearer ${refreshToken}` }
      });
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 18. Role-Based Access Summary

| Role | Can Do |
|------|--------|
| **Public** (no token) | Browse products, view categories, view product details, read reviews |
| **CUSTOMER** | Everything public + cart, wishlist, orders, payments, reviews, notifications |
| **VENDOR** | Everything customer + create/manage products, view own orders, vendor dashboard |
| **ADMIN** | Everything + approve/reject vendors & products, manage users, assign delivery, analytics |
| **DELIVERY_BOY** | Onboard, view assigned deliveries, update GPS location, update delivery status |

---

## Product Lifecycle (Key Workflow)

```
Vendor creates product
        ↓
  status: PENDING
  isPublished: false
  (NOT visible publicly)
        ↓
Admin reviews product
        ↓
   ┌────┴────┐
APPROVE    REJECT
   ↓          ↓
isPublished  isPublished
  = true      = false
  status      status
= APPROVED  = REJECTED
   ↓          ↓
Visible     Vendor
publicly    notified
```

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@ecommerce.com` | `Admin@123456` |
| Vendor | `vendor@ecommerce.com` | `Vendor@123456` |
| Customer | `customer@ecommerce.com` | `Customer@123456` |
| Delivery | `delivery@ecommerce.com` | `Delivery@123456` |

> Run `npx ts-node prisma/seed.ts` to seed test data.
