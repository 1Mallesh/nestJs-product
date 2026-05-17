# Multi-Vendor E-Commerce — Complete Project Documentation

> **Stack:** NestJS + PostgreSQL + Prisma + Redis + Razorpay + AWS S3 + Socket.io  
> **Base URL:** `http://localhost:3000/api/v1`  
> **Swagger UI:** `http://localhost:3000/api/docs`

---

## Table of Contents

1. [Authentication Flow](#1-authentication-flow)
2. [All API Endpoints](#2-all-api-endpoints)
   - [Auth APIs](#21-auth-apis)
   - [User / Customer APIs](#22-user--customer-apis)
   - [Product APIs](#23-product-apis)
   - [Category APIs](#24-category-apis)
   - [Cart APIs](#25-cart-apis)
   - [Wishlist APIs](#26-wishlist-apis)
   - [Order APIs](#27-order-apis)
   - [Payment APIs](#28-payment-apis)
   - [Review APIs](#29-review-apis)
   - [Notification APIs](#210-notification-apis)
   - [Upload APIs](#211-upload-apis)
   - [Vendor APIs](#212-vendor-admin-apis)
   - [Delivery Boy APIs](#213-delivery-boy-apis)
   - [Admin APIs](#214-super-admin-apis)
3. [All DTOs (Request Bodies)](#3-all-dtos-request-bodies)
4. [Role-Based Access Summary](#4-role-based-access-summary)
5. [Next.js Frontend Integration Guide](#5-nextjs-frontend-integration-guide)
   - [Project Setup](#51-project-setup)
   - [API Client Setup](#52-api-client-setup)
   - [Auth Context & Hooks](#53-auth-context--hooks)
   - [Admin Panel Pages](#54-admin-panel-pages)
   - [Vendor Panel Pages](#55-vendor-panel-pages)
   - [Delivery Boy Panel Pages](#56-delivery-boy-panel-pages)
   - [Customer Storefront Pages](#57-customer-storefront-pages)
   - [Route Protection Middleware](#58-route-protection-middleware)
   - [Real-Time (WebSocket)](#59-real-time-websocket)
6. [Environment Variables](#6-environment-variables)

---

## 1. Authentication Flow

```
Register → Verify OTP → Login → Access Token + Refresh Token
                                      ↓
                             Use Access Token in header:
                             Authorization: Bearer <token>
                                      ↓
                             Token expires → POST /auth/refresh
                                      ↓
                             Logout → POST /auth/logout
```

**Roles:** `ADMIN` | `VENDOR` | `CUSTOMER` | `DELIVERY_BOY`

---

## 2. All API Endpoints

### 2.1 Auth APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/verify-otp` | Public | Verify email OTP |
| POST | `/auth/login` | Public | Login → returns tokens |
| POST | `/auth/refresh` | Refresh Token | Get new access token |
| POST | `/auth/logout` | JWT | Logout (invalidate token) |
| POST | `/auth/forgot-password` | Public | Send reset OTP to email |
| POST | `/auth/reset-password` | Public | Reset password with OTP |

---

### 2.2 User / Customer APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/profile` | JWT | Get my profile |
| PUT | `/users/profile` | JWT | Update profile |
| GET | `/users/addresses` | JWT | List my addresses |
| POST | `/users/addresses` | JWT | Add new address |
| PUT | `/users/addresses/:id` | JWT | Update address |
| DELETE | `/users/addresses/:id` | JWT | Delete address |

---

### 2.3 Product APIs

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/products` | Public | — | List all approved products |
| GET | `/products/:id` | Public | — | Get product detail |
| POST | `/products` | JWT | VENDOR | Create product |
| PUT | `/products/:id` | JWT | VENDOR | Update product |
| DELETE | `/products/:id` | JWT | VENDOR | Delete product |
| GET | `/products/vendor/my-products` | JWT | VENDOR | My products list |
| POST | `/products/:id/variants` | JWT | VENDOR | Add variant |

**Query params for `GET /products`:** `page`, `limit`, `categoryId`, `search`, `minPrice`, `maxPrice`

---

### 2.4 Category APIs

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/categories` | Public | — | List all categories |
| GET | `/categories/:id` | Public | — | Get category |
| POST | `/categories` | JWT | ADMIN | Create category |
| PUT | `/categories/:id` | JWT | ADMIN | Update category |
| DELETE | `/categories/:id` | JWT | ADMIN | Delete category |

---

### 2.5 Cart APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/cart` | JWT | Get my cart |
| POST | `/cart/add` | JWT | Add item to cart |
| PUT | `/cart/items/:itemId` | JWT | Update item quantity |
| DELETE | `/cart/items/:itemId` | JWT | Remove item |
| DELETE | `/cart/clear` | JWT | Clear entire cart |

---

### 2.6 Wishlist APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/wishlist` | JWT | Get my wishlist |
| POST | `/wishlist/:productId/toggle` | JWT | Toggle product in wishlist |
| DELETE | `/wishlist/:productId` | JWT | Remove from wishlist |

---

### 2.7 Order APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/orders` | JWT | Place order from cart |
| GET | `/orders` | JWT | My orders (paginated) |
| GET | `/orders/:id` | JWT | Order detail |
| POST | `/orders/:id/cancel` | JWT | Cancel order |
| GET | `/orders/:id/tracking` | JWT | Live tracking history |

**Query params:** `page`, `limit`

---

### 2.8 Payment APIs

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/payments/create-order` | JWT | — | Create Razorpay order |
| POST | `/payments/verify` | JWT | — | Verify payment signature |
| GET | `/payments/:orderId/status` | JWT | — | Payment status |
| POST | `/payments/refund` | JWT | ADMIN | Process refund |

---

### 2.9 Review APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/reviews` | JWT | Submit review (verified buyers only) |
| GET | `/reviews/product/:productId` | Public | Product reviews (paginated) |
| DELETE | `/reviews/:id` | JWT | Delete my review |

**Query params:** `page`, `limit`

---

### 2.10 Notification APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | JWT | My notifications (paginated) |
| PATCH | `/notifications/:id/read` | JWT | Mark as read |
| PATCH | `/notifications/read-all` | JWT | Mark all as read |
| DELETE | `/notifications/:id` | JWT | Delete notification |

**Query params:** `page`, `limit`

---

### 2.11 Upload APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/upload/single` | JWT | Upload 1 image (S3) |
| POST | `/upload/multiple` | JWT | Upload up to 5 images (S3) |

**Query params:** `folder` (default: `uploads`)  
**Content-Type:** `multipart/form-data`, field name: `file` / `files`

---

### 2.12 Vendor Admin APIs

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/vendor/onboard` | JWT | VENDOR, CUSTOMER | Submit KYC & onboard |
| GET | `/vendor/profile` | JWT | VENDOR | My vendor profile |
| PUT | `/vendor/profile` | JWT | VENDOR | Update shop profile |
| GET | `/vendor/dashboard` | JWT | VENDOR | Sales analytics dashboard |
| GET | `/vendor/orders` | JWT | VENDOR | Orders for my products |
| PUT | `/vendor/orders/:itemId/status` | JWT | VENDOR | Update order item status |

**Query params:** `page`, `limit`

---

### 2.13 Delivery Boy APIs

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/delivery/onboard` | JWT | DELIVERY_BOY, CUSTOMER | Submit KYC & onboard |
| GET | `/delivery/profile` | JWT | DELIVERY_BOY | My delivery profile |
| GET | `/delivery/dashboard` | JWT | DELIVERY_BOY | My delivery dashboard |
| GET | `/delivery/deliveries` | JWT | DELIVERY_BOY | My assigned deliveries |
| POST | `/delivery/location` | JWT | DELIVERY_BOY | Update GPS location |
| PUT | `/delivery/deliveries/:id/status` | JWT | DELIVERY_BOY | Update delivery status |
| POST | `/delivery/toggle-availability` | JWT | DELIVERY_BOY | Toggle online/offline |

**Query params:** `status`

---

### 2.14 Super Admin APIs

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/admin/dashboard` | JWT | ADMIN | Platform analytics |
| GET | `/admin/vendors` | JWT | ADMIN | All vendors |
| PATCH | `/admin/vendors/:id/approve` | JWT | ADMIN | Approve/reject vendor |
| GET | `/admin/products` | JWT | ADMIN | All products |
| PATCH | `/admin/products/:id/approve` | JWT | ADMIN | Approve/reject product |
| GET | `/admin/users` | JWT | ADMIN | All users |
| PATCH | `/admin/users/:id/toggle-block` | JWT | ADMIN | Block/unblock user |
| GET | `/admin/orders` | JWT | ADMIN | All orders |
| POST | `/admin/orders/:orderId/assign-delivery` | JWT | ADMIN | Assign delivery boy |
| GET | `/admin/delivery-boys` | JWT | ADMIN | All delivery boys |
| PATCH | `/admin/delivery-boys/:id/approve` | JWT | ADMIN | Approve/reject delivery boy |
| GET | `/admin/analytics/revenue` | JWT | ADMIN | Revenue analytics |

**Query params:** `page`, `limit`, `status`, `role`, `days`

---

## 3. All DTOs (Request Bodies)

### Auth DTOs

**POST /auth/register**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "Pass@1234",
  "role": "CUSTOMER"
}
```

**POST /auth/verify-otp**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**POST /auth/login**
```json
{
  "email": "john@example.com",
  "password": "Pass@1234"
}
```

**POST /auth/refresh**
```json
{
  "refreshToken": "<refresh_token>"
}
```

**POST /auth/forgot-password**
```json
{
  "email": "john@example.com"
}
```

**POST /auth/reset-password**
```json
{
  "token": "<otp_token>",
  "newPassword": "NewPass@1234"
}
```

---

### User DTOs

**PUT /users/profile**
```json
{
  "name": "John Updated",
  "phone": "9876543210",
  "avatar": "https://s3.amazonaws.com/bucket/avatar.jpg"
}
```

**POST /users/addresses**
```json
{
  "label": "Home",
  "fullName": "John Doe",
  "phone": "9876543210",
  "addressLine1": "123 Main Street",
  "addressLine2": "Apt 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "isDefault": true
}
```

---

### Product DTOs

**POST /products**
```json
{
  "name": "Premium Cotton T-Shirt",
  "description": "High quality 100% cotton t-shirt",
  "shortDescription": "Premium cotton tee",
  "categoryId": "uuid-here",
  "sku": "TSH-001",
  "price": 599,
  "comparePrice": 999,
  "costPrice": 300,
  "stock": 100,
  "weight": 200,
  "images": ["https://s3.../img1.jpg"],
  "tags": ["cotton", "tshirt", "casual"]
}
```

**POST /products/:id/variants**
```json
{
  "name": "Size",
  "value": "XL",
  "price": 649,
  "stock": 25
}
```

---

### Category DTOs

**POST /categories**
```json
{
  "name": "Electronics",
  "description": "Electronic gadgets and devices",
  "image": "https://s3.../electronics.jpg",
  "parentId": null
}
```

---

### Cart DTOs

**POST /cart/add**
```json
{
  "productId": "uuid-here",
  "variantId": "uuid-here",
  "quantity": 2
}
```

**PUT /cart/items/:itemId**
```json
{
  "quantity": 3
}
```

---

### Order DTOs

**POST /orders**
```json
{
  "addressId": "uuid-here",
  "paymentMethod": "RAZORPAY",
  "notes": "Please deliver after 6 PM",
  "couponCode": "SAVE10"
}
```

**POST /orders/:id/cancel**
```json
{
  "reason": "Changed my mind"
}
```

---

### Payment DTOs

**POST /payments/create-order**
```json
{
  "orderId": "uuid-here"
}
```

**POST /payments/verify**
```json
{
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "signature_xxx",
  "orderId": "uuid-here"
}
```

**POST /payments/refund**
```json
{
  "orderId": "uuid-here",
  "amount": 599
}
```

---

### Vendor DTOs

**POST /vendor/onboard**
```json
{
  "shopName": "John's Fashion Store",
  "shopDescription": "Best fashion store in town",
  "gstNumber": "22AAAAA0000A1Z5",
  "panNumber": "AAAAA0000A",
  "aadhaarNumber": "123456789012",
  "bankAccountNumber": "12345678901234",
  "bankIfscCode": "SBIN0001234",
  "bankAccountName": "John Doe"
}
```

**PUT /vendor/profile**
```json
{
  "shopName": "John's Fashion House",
  "shopDescription": "Updated description",
  "shopLogo": "https://s3.../logo.jpg",
  "shopBanner": "https://s3.../banner.jpg"
}
```

**PUT /vendor/orders/:itemId/status**
```json
{
  "status": "PACKED"
}
```

---

### Delivery Boy DTOs

**POST /delivery/onboard**
```json
{
  "aadhaarNumber": "123456789012",
  "panNumber": "AAAAA0000A",
  "drivingLicense": "DL-1234567890",
  "vehicleType": "BIKE",
  "vehicleNumber": "MH01AB1234",
  "bankAccountNumber": "12345678901234",
  "bankIfscCode": "SBIN0001234",
  "bankAccountName": "John Doe"
}
```

**POST /delivery/location**
```json
{
  "latitude": 19.0760,
  "longitude": 72.8777,
  "orderId": "uuid-here"
}
```

**PUT /delivery/deliveries/:id/status**
```json
{
  "action": "PICKED_UP",
  "notes": "Picked up from vendor warehouse"
}
```

---

### Admin DTOs

**PATCH /admin/vendors/:id/approve**
```json
{
  "status": "APPROVED",
  "reason": ""
}
```

**PATCH /admin/products/:id/approve**
```json
{
  "status": "REJECTED",
  "reason": "Images are not clear"
}
```

**POST /admin/orders/:orderId/assign-delivery**
```json
{
  "deliveryBoyId": "uuid-here"
}
```

---

### Review DTOs

**POST /reviews**
```json
{
  "productId": "uuid-here",
  "rating": 5,
  "title": "Excellent product!",
  "comment": "Very happy with the quality.",
  "images": ["https://s3.../review1.jpg"]
}
```

---

## 4. Role-Based Access Summary

| Feature | ADMIN | VENDOR | CUSTOMER | DELIVERY_BOY |
|---------|-------|--------|----------|--------------|
| Manage Categories | ✅ | ❌ | ❌ | ❌ |
| Approve Vendors | ✅ | ❌ | ❌ | ❌ |
| Approve Products | ✅ | ❌ | ❌ | ❌ |
| View All Orders | ✅ | ❌ | ❌ | ❌ |
| Assign Delivery | ✅ | ❌ | ❌ | ❌ |
| Revenue Analytics | ✅ | ❌ | ❌ | ❌ |
| Create Products | ❌ | ✅ | ❌ | ❌ |
| Vendor Dashboard | ❌ | ✅ | ❌ | ❌ |
| Update Order Item | ❌ | ✅ | ❌ | ❌ |
| Browse Products | ✅ | ✅ | ✅ | ✅ |
| Place Orders | ❌ | ❌ | ✅ | ❌ |
| Cart / Wishlist | ❌ | ❌ | ✅ | ❌ |
| Write Reviews | ❌ | ❌ | ✅ | ❌ |
| View Deliveries | ❌ | ❌ | ❌ | ✅ |
| Update Location | ❌ | ❌ | ❌ | ✅ |
| Update Delivery Status | ❌ | ❌ | ❌ | ✅ |

---

## 5. Next.js Frontend Integration Guide

### 5.1 Project Setup

```bash
npx create-next-app@latest ecommerce-frontend --typescript --tailwind --app
cd ecommerce-frontend

# Install dependencies
npm install axios @tanstack/react-query zustand js-cookie
npm install razorpay @types/razorpay
npm install socket.io-client
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react
```

**Folder Structure:**
```
ecommerce-frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (customer)/
│   │   ├── page.tsx              # Home / storefront
│   │   ├── products/page.tsx
│   │   ├── products/[id]/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── wishlist/page.tsx
│   │   ├── orders/page.tsx
│   │   └── checkout/page.tsx
│   ├── admin/
│   │   ├── dashboard/page.tsx
│   │   ├── vendors/page.tsx
│   │   ├── products/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── users/page.tsx
│   │   └── delivery-boys/page.tsx
│   ├── vendor/
│   │   ├── dashboard/page.tsx
│   │   ├── products/page.tsx
│   │   └── orders/page.tsx
│   └── delivery/
│       ├── dashboard/page.tsx
│       └── deliveries/page.tsx
├── lib/
│   ├── api.ts                    # Axios instance
│   ├── auth.ts                   # Auth helpers
│   └── socket.ts                 # Socket.io client
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   └── useNotifications.ts
├── store/
│   └── authStore.ts              # Zustand store
├── middleware.ts                 # Route protection
└── types/
    └── index.ts                  # TypeScript types
```

---

### 5.2 API Client Setup

**`lib/api.ts`**
```typescript
import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = Cookies.get('refreshToken');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        Cookies.set('accessToken', data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### 5.3 Auth Context & Hooks

**`store/authStore.ts`**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'VENDOR' | 'CUSTOMER' | 'DELIVERY_BOY';
}

interface AuthStore {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      isAuthenticated: () => !!get().user,
    }),
    { name: 'auth-store' }
  )
);
```

**`hooks/useAuth.ts`**
```typescript
import { useMutation } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post('/auth/login', data).then((r) => r.data.data),
    onSuccess: (data) => {
      Cookies.set('accessToken', data.accessToken, { expires: 1 });
      Cookies.set('refreshToken', data.refreshToken, { expires: 30 });
      setUser(data.user);
      // Redirect based on role
      const roleRoutes: Record<string, string> = {
        ADMIN: '/admin/dashboard',
        VENDOR: '/vendor/dashboard',
        DELIVERY_BOY: '/delivery/dashboard',
        CUSTOMER: '/',
      };
      router.push(roleRoutes[data.user.role] ?? '/');
    },
  });
}

export function useLogout() {
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  return async () => {
    await api.post('/auth/logout').catch(() => {});
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    setUser(null);
    router.push('/login');
  };
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      phone: string;
      password: string;
      role?: string;
    }) => api.post('/auth/register', data).then((r) => r.data),
  });
}
```

---

### 5.4 Admin Panel Pages

#### Dashboard — `app/admin/dashboard/page.tsx`
```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data.data),
  });

  return (
    <div className="grid grid-cols-4 gap-4 p-6">
      <StatCard title="Total Revenue" value={data?.revenue} />
      <StatCard title="Total Orders" value={data?.totalOrders} />
      <StatCard title="Total Vendors" value={data?.totalVendors} />
      <StatCard title="Total Users" value={data?.totalUsers} />
    </div>
  );
}
```

#### Vendor Management — `app/admin/vendors/page.tsx`
```typescript
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminVendors() {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: () => api.get('/admin/vendors').then((r) => r.data.data),
  });

  const approve = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      api.patch(`/admin/vendors/${id}/approve`, { status, reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-vendors'] }),
  });

  return (
    <table>
      <thead><tr><th>Shop</th><th>GST</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        {data?.vendors?.map((v: any) => (
          <tr key={v.id}>
            <td>{v.shopName}</td>
            <td>{v.gstNumber}</td>
            <td>{v.approvalStatus}</td>
            <td>
              <button onClick={() => approve.mutate({ id: v.id, status: 'APPROVED' })}>
                Approve
              </button>
              <button onClick={() => approve.mutate({ id: v.id, status: 'REJECTED', reason: 'Invalid docs' })}>
                Reject
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

#### Order Management — `app/admin/orders/page.tsx`
```typescript
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminOrders() {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => api.get('/admin/orders').then((r) => r.data.data),
  });

  const assignDelivery = useMutation({
    mutationFn: ({ orderId, deliveryBoyId }: { orderId: string; deliveryBoyId: string }) =>
      api.post(`/admin/orders/${orderId}/assign-delivery`, { deliveryBoyId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  return (
    <div>
      {data?.orders?.map((order: any) => (
        <div key={order.id}>
          <p>#{order.orderNumber} — {order.status}</p>
          <button onClick={() => assignDelivery.mutate({
            orderId: order.id,
            deliveryBoyId: 'delivery-boy-uuid'
          })}>
            Assign Delivery
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

### 5.5 Vendor Panel Pages

#### Vendor Dashboard — `app/vendor/dashboard/page.tsx`
```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function VendorDashboard() {
  const { data } = useQuery({
    queryKey: ['vendor-dashboard'],
    queryFn: () => api.get('/vendor/dashboard').then((r) => r.data.data),
  });

  return (
    <div className="grid grid-cols-3 gap-4 p-6">
      <StatCard title="Total Sales" value={data?.totalSales} />
      <StatCard title="Orders" value={data?.totalOrders} />
      <StatCard title="Products" value={data?.totalProducts} />
    </div>
  );
}
```

#### Create Product — `app/vendor/products/create/page.tsx`
```typescript
'use client';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

export default function CreateProduct() {
  const { register, handleSubmit } = useForm();

  const create = useMutation({
    mutationFn: (data: any) => api.post('/products', data).then((r) => r.data),
    onSuccess: () => alert('Product created! Awaiting admin approval.'),
  });

  return (
    <form onSubmit={handleSubmit((d) => create.mutate(d))}>
      <input {...register('name')} placeholder="Product name" />
      <input {...register('price')} type="number" placeholder="Price" />
      <input {...register('stock')} type="number" placeholder="Stock" />
      <input {...register('sku')} placeholder="SKU" />
      <textarea {...register('description')} placeholder="Description" />
      <input {...register('categoryId')} placeholder="Category ID" />
      <button type="submit">Create Product</button>
    </form>
  );
}
```

#### Vendor Orders — `app/vendor/orders/page.tsx`
```typescript
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export default function VendorOrders() {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['vendor-orders'],
    queryFn: () => api.get('/vendor/orders').then((r) => r.data.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: string }) =>
      api.put(`/vendor/orders/${itemId}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-orders'] }),
  });

  return (
    <div>
      {data?.orders?.map((item: any) => (
        <div key={item.id}>
          <p>{item.name} — {item.status}</p>
          <select onChange={(e) => updateStatus.mutate({ itemId: item.id, status: e.target.value })}>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
          </select>
        </div>
      ))}
    </div>
  );
}
```

---

### 5.6 Delivery Boy Panel Pages

#### Delivery Dashboard — `app/delivery/dashboard/page.tsx`
```typescript
'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

export default function DeliveryDashboard() {
  const { data: dashboard } = useQuery({
    queryKey: ['delivery-dashboard'],
    queryFn: () => api.get('/delivery/dashboard').then((r) => r.data.data),
  });

  const toggleAvailability = useMutation({
    mutationFn: () => api.post('/delivery/toggle-availability'),
  });

  return (
    <div>
      <p>Total Deliveries: {dashboard?.totalDeliveries}</p>
      <p>Today's Deliveries: {dashboard?.todayDeliveries}</p>
      <p>Earnings: ₹{dashboard?.totalEarnings}</p>
      <button onClick={() => toggleAvailability.mutate()}>Toggle Availability</button>
    </div>
  );
}
```

#### Live Location Update — `app/delivery/deliveries/[id]/page.tsx`
```typescript
'use client';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '@/lib/api';

export default function DeliveryDetail({ params }: { params: { id: string } }) {
  const updateLocation = useMutation({
    mutationFn: (coords: { latitude: number; longitude: number }) =>
      api.post('/delivery/location', { ...coords, orderId: params.id }),
  });

  const updateStatus = useMutation({
    mutationFn: (action: 'PICKED_UP' | 'DELIVERED') =>
      api.put(`/delivery/deliveries/${params.id}/status`, { action }),
  });

  // Send GPS location every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        updateLocation.mutate({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <button onClick={() => updateStatus.mutate('PICKED_UP')}>Mark Picked Up</button>
      <button onClick={() => updateStatus.mutate('DELIVERED')}>Mark Delivered</button>
    </div>
  );
}
```

---

### 5.7 Customer Storefront Pages

#### Product Listing — `app/(customer)/products/page.tsx`
```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ['products', search, page],
    queryFn: () =>
      api.get('/products', { params: { search, page, limit: 20 } }).then((r) => r.data.data),
  });

  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
      <div className="grid grid-cols-4 gap-4">
        {data?.products?.map((p: any) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
```

#### Cart — `app/(customer)/cart/page.tsx`
```typescript
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export default function CartPage() {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.get('/cart').then((r) => r.data.data),
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => api.delete(`/cart/items/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  return (
    <div>
      {data?.items?.map((item: any) => (
        <div key={item.id}>
          <p>{item.product.name} × {item.quantity}</p>
          <p>₹{item.price * item.quantity}</p>
          <button onClick={() => removeItem.mutate(item.id)}>Remove</button>
        </div>
      ))}
      <p>Total: ₹{data?.total}</p>
    </div>
  );
}
```

#### Checkout with Razorpay — `app/(customer)/checkout/page.tsx`
```typescript
'use client';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

declare global {
  interface Window { Razorpay: any; }
}

export default function CheckoutPage() {
  const placeOrder = useMutation({
    mutationFn: (data: { addressId: string; paymentMethod: string }) =>
      api.post('/orders', data).then((r) => r.data.data),
  });

  const createPayment = useMutation({
    mutationFn: (orderId: string) =>
      api.post('/payments/create-order', { orderId }).then((r) => r.data.data),
  });

  const verifyPayment = useMutation({
    mutationFn: (data: any) => api.post('/payments/verify', data),
  });

  const handleCheckout = async (addressId: string) => {
    // Step 1: Create order
    const order = await placeOrder.mutateAsync({ addressId, paymentMethod: 'RAZORPAY' });

    // Step 2: Create Razorpay order
    const payment = await createPayment.mutateAsync(order.id);

    // Step 3: Open Razorpay modal
    const razorpay = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: payment.amount,
      currency: 'INR',
      order_id: payment.razorpayOrderId,
      handler: async (response: any) => {
        // Step 4: Verify payment
        await verifyPayment.mutateAsync({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          orderId: order.id,
        });
        alert('Payment successful!');
      },
    });
    razorpay.open();
  };

  return (
    <button onClick={() => handleCheckout('address-uuid-here')}>
      Pay Now
    </button>
  );
}
```

#### Order Tracking — `app/(customer)/orders/[id]/page.tsx`
```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function OrderTracking({ params }: { params: { id: string } }) {
  const { data: order } = useQuery({
    queryKey: ['order', params.id],
    queryFn: () => api.get(`/orders/${params.id}`).then((r) => r.data.data),
  });

  const { data: tracking } = useQuery({
    queryKey: ['tracking', params.id],
    queryFn: () => api.get(`/orders/${params.id}/tracking`).then((r) => r.data.data),
    refetchInterval: 30000, // poll every 30s
  });

  return (
    <div>
      <h2>Order #{order?.orderNumber}</h2>
      <p>Status: {order?.status}</p>
      <div>
        {tracking?.map((t: any) => (
          <div key={t.id}>
            <p>{t.status} — {new Date(t.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 5.8 Route Protection Middleware

**`middleware.ts`** (Next.js App Router)
```typescript
import { NextRequest, NextResponse } from 'next/server';

const ROLE_ROUTES: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/vendor': ['VENDOR'],
  '/delivery': ['DELIVERY_BOY'],
};

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const path = request.nextUrl.pathname;

  // Public routes
  if (['/login', '/register'].includes(path)) {
    if (token) return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }

  // Protected routes — no token
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based route checking
  for (const [prefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (path.startsWith(prefix)) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!allowedRoles.includes(payload.role)) {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      } catch {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/vendor/:path*', '/delivery/:path*', '/orders/:path*', '/cart/:path*'],
};
```

---

### 5.9 Real-Time (WebSocket)

**`lib/socket.ts`**
```typescript
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000', {
      auth: { token: Cookies.get('accessToken') },
      transports: ['websocket'],
    });
  }
  return socket;
}
```

**Usage in component:**
```typescript
'use client';
import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';

export function useOrderTracking(orderId: string) {
  useEffect(() => {
    const socket = getSocket();
    socket.emit('join-order-room', orderId);
    socket.on('location-update', (data) => {
      console.log('Delivery boy location:', data.latitude, data.longitude);
    });
    socket.on('order-status-update', (data) => {
      console.log('New status:', data.status);
    });
    return () => {
      socket.emit('leave-order-room', orderId);
      socket.off('location-update');
      socket.off('order-status-update');
    };
  }, [orderId]);
}
```

---

## 6. Environment Variables

### Backend `.env`
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password

# AWS S3
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_secret

# Shiprocket
SHIPROCKET_EMAIL=your@email.com
SHIPROCKET_PASSWORD=your_password

# CORS
FRONTEND_URL=http://localhost:3001
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

---

## Quick Start

### Backend
```bash
cd nestJs-product
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
# API docs: http://localhost:3000/api/docs
```

### Frontend
```bash
cd ecommerce-frontend
npm install
npm run dev
# App: http://localhost:3001
```

### Default Admin Credentials (after seed)
```
Email: admin@example.com
Password: Admin@1234
```

---

*Generated for NestJS Multi-Vendor E-Commerce Platform*
