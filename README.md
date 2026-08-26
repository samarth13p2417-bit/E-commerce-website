# 🌐 OmniStore — Multi-Tenant E-Commerce SaaS Platform

An enterprise-grade, full-stack **Multi-Tenant E-Commerce SaaS** platform built with **React (Vite)**, **Node.js (Express)**, and **MongoDB (with high-performance In-Memory fallback)**. Features dynamic store tenant isolation, multi-source product image management, robust dual-layer validation, and a cryptographically verified **Razorpay Payment Gateway**.

---

## 🚀 Key Features

### 🏬 1. Dynamic Multi-Tenant Architecture
* **Tenant Isolation**: Every store has its own independent catalog, branding, color palette, orders, and customer accounts.
* **Instant Tenant Switcher**: Dropdown in header to switch between 5 curated stores in real-time.
* **Seeded Stores**:
  1. **🏋️ Titan Gym & Fitness Store** (`gym-store`) — Fiery Orange (`#f97316`)
  2. **⚽ Velocity Pro Sports Arena** (`sports-shop`) — Cyan Electric (`#06b6d4`)
  3. **🍎 Fresh Orchard Organic Fruit Shop** (`fruit-shop`) — Emerald Green (`#10b981`)
  4. **👔 Poonam Dresses (Men's Fashion & Ethnic Wear)** (`poonam-dresses`) — Royal Violet (`#8b5cf6`)
  5. **⚡ Quantum Electronics & Gadgets** (`electronic-shop`) — Electric Indigo (`#6366f1`)

### 💳 2. Razorpay Payment Gateway Integration
* **Server-Side Calculation**: Cart prices and coupon discounts are recalculated on the server (`POST /api/payments/create-order`) to prevent price tampering.
* **Cryptographic Verification**: Signatures are verified using **HMAC SHA-256** (`POST /api/payments/verify`) before marking orders as `PAID`.
* **Multi-Mode Support**: UPI / QR Code, Credit & Debit Cards, NetBanking (all Indian banks), Wallets, and Cash on Delivery (COD).
* **Live Receipt Verification**: Shows step-by-step receipt checking followed by the celebratory **"Payment Done! 🎉"** state.
* **Automated Confirmation Receipts**: Dispatches transaction confirmation receipts and tax invoices upon payment success.

### 🖼️ 3. Multi-Source Product Image Manager
* **🌐 Web & Google Image Search**: 1-click photo picker with keyword matching (e.g. apple, shoes, shirt, watch, laptop).
* **📁 Browse Image from PC**: Local file selector converting images to Data URLs via `FileReader`.
* **🔗 Direct Image URL**: Custom URL input with instant preview.

### 🔒 4. Enterprise Dual-Layer Input Validation
* **Backend (`backend/utils/validators.js`)**: Regex-based email format, password strength (8+ chars, upper, lower, number, special char), name length, store name length, and hex color validation.
* **Frontend (`frontend/src/components/AuthModal.jsx`)**: Real-time password strength meter, dynamic checklist, show/hide password toggles, and inline validation outlines.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Lucide Icons, Vanilla CSS Design System |
| **Backend** | Node.js, Express.js, JWT Authentication, Nodemailer |
| **Database** | MongoDB Atlas with High-Performance In-Memory dual fallback |
| **Payments** | Razorpay Node.js SDK, Stripe Intent Integration |
| **Security** | Crypto HMAC SHA-256, Bcrypt.js, Helmet & Tenant-Isolation Middleware |

---

## 📋 Quick Start Guide

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **npm** (v9 or higher)

### 2. Installation
Install dependencies for both backend and frontend:
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Variables
Check that `backend/.env` is configured:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=ecommerce_saas_super_secret_jwt_key_2026
MONGODB_URI=mongodb+srv://samarth13p2417_db_user:EtlFiP3nGs7CvmuC@cluster0.w7omykh.mongodb.net/ecommerce_saas?retryWrites=true&w=majority&appName=Cluster0

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_eCommerceSaaS2026
RAZORPAY_KEY_SECRET=rzp_secret_eCommerceSaaS2026_SecureKey
```

### 4. Running the Full Stack Application
From the project root directory, run:
```bash
node run-all.js
```
* **Frontend**: `http://localhost:3000`
* **Backend API**: `http://localhost:5000`
* **Health Check**: `http://localhost:5000/api/health`

---

## 🔑 Demo Login Accounts

All accounts use the default password: **`Password123!`**

| Store | Role | Email |
| :--- | :--- | :--- |
| **🏋️ Titan Gym Store** | Vendor / Owner | `owner@gymstore.com` |
| **🏋️ Titan Gym Store** | Customer | `customer@gymstore.com` |
| **⚽ Sports Shop** | Vendor / Owner | `owner@sportsshop.com` |
| **⚽ Sports Shop** | Customer | `customer@sportsshop.com` |
| **🍎 Fruit Shop** | Vendor / Owner | `owner@fruitshop.com` |
| **🍎 Fruit Shop** | Customer | `customer@fruitshop.com` |
| **👔 Poonam Dresses (Men)** | Vendor / Owner | `owner@poonamdresses.com` |
| **👔 Poonam Dresses (Men)** | Customer | `customer@poonamdresses.com` |
| **⚡ Electronic Shop** | Vendor / Owner | `owner@electronicshop.com` |
| **⚡ Electronic Shop** | Customer | `customer@electronicshop.com` |

*(You can also use the 1-click demo buttons in the login modal)*

---

## 🧪 Automated Test Suites

The project includes 4 comprehensive automated test suites:

```bash
# 1. Razorpay Payment Gateway & Cryptographic Verification Suite (8 tests)
node backend/test-razorpay-integration.js

# 2. Registration Input & Password Strength Validation Suite (11 tests)
node backend/test-registration-validation.js

# 3. Customer & Vendor Authentication Workflows Suite (9 tests)
node backend/test-auth-workflows.js

# 4. Cart, Checkout & Stripe Payment Intents Suite (6 tests)
node backend/test-week3.js
```

---

## 📡 API Reference Summary

### Payments & Razorpay
* `POST /api/payments/create-order` — Creates Razorpay Order with server-side amount calculation.
* `POST /api/payments/verify` — Verifies HMAC SHA-256 payment signature and marks order as `PAID`.
* `POST /api/payments/create-intent` — Creates Stripe PaymentIntent.
* `POST /api/payments/confirm` — Confirms digital transactions and sends email receipts.

### Tenants & Stores
* `GET /api/tenants` — Lists all active stores.
* `GET /api/tenants/:slug` — Retrieves store details and branding colors.
* `PUT /api/tenants/:id/branding` — Updates store brand color, logo, and banner.

### Products & Orders
* `GET /api/products?tenant=<id>` — Returns tenant-scoped product catalog.
* `POST /api/products` — Adds a new product (Owner only).
* `POST /api/orders` — Places a new customer order.
* `GET /api/orders/my-orders` — Returns order history for authenticated customer.

---

## 🏆 Project Submission Checklist
- [x] Multi-Tenant Architecture with 5 Curated Stores
- [x] Razorpay Payment Gateway Integration
- [x] Server-side Cart & Order Amount Calculations
- [x] HMAC SHA-256 Cryptographic Signature Verification
- [x] Live "Checking Payment Receipt" & "Payment Done! 🎉" User Experience
- [x] Dual-Layer Email & Password Strength Validation
- [x] Multi-Source Image Manager (Web / Local / URL)
- [x] 100% Passing Automated Test Suites
- [x] Clean Production Build with Zero Errors
