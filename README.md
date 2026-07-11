# Venderra POS

**Uganda's most trusted Point of Sale software** — designed for retail businesses, supermarkets, pharmacies, wholesale shops, and more across Kampala, Entebbe, Jinja, nationwide and globally.

Built with **React**, **Node.js**, and **MySQL**.

## Features

### Core (All Plans)
- **Point of Sale** — Fast checkout with cash, mobile money, card, credit, and mixed payments
- **Stock Management** — Real-time tracking, low-stock alerts, movement history, barcode generation
- **Sales Management** — Live monitoring, daily/weekly/monthly reports, cashier performance
- **Customer & Credit Management** — Purchase history, credit limits, CRM
- **Purchases & Expenses** — Supplier management, purchase orders, expense tracking
- **Offline POS** — Full functionality without internet; auto-sync when reconnected
- **Multi-Branch** — Centralized dashboard, stock transfers, consolidated reports

### Premium Plan
- Quotations & Invoices
- Label / Barcode generation
- SMS Center
- Multi-currency support
- Accounting (P&L, Balance Sheet, Cash Flow)
- Staff performance reports

### Enterprise Plan
- **Manufacturing Module** — Raw materials, BOM, production orders, cost calculation
- **Field Sales Module** — Mobile app support, stock issuance, expense tracking, performance reports

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite, React Router, Recharts |
| Backend  | Node.js, Express.js                 |
| Database | MySQL 8                             |
| Auth     | JWT                                 |

## Prerequisites

- Node.js 18+
- MySQL 8+

## Quick Start

### 1. Clone and install

```bash
cd POS
npm run install:all
```

### 2. Configure database

Copy the environment file and set your MySQL credentials:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=venderra_pos
JWT_SECRET=your-secret-key
```

### 3. Setup database

```bash
npm run db:setup
npm run db:seed
```

### 4. Start development servers

```bash
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

### Demo Login

| Email              | Password  | Role    |
|--------------------|-----------|---------|
| admin@venderra.ug  | admin123  | Owner   |
| manager@venderra.ug| admin123  | Manager |
| cashier@venderra.ug| admin123  | Cashier |

## Project Structure

```
POS/
├── backend/
│   ├── src/
│   │   ├── config/         # Database config
│   │   ├── database/       # Schema, setup, seed
│   │   ├── middleware/     # Auth & authorization
│   │   ├── routes/         # API endpoints
│   │   └── server.js       # Express app entry
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Layout, shared UI
│   │   ├── context/        # Auth context
│   │   ├── pages/          # Dashboard, POS, etc.
│   │   └── services/       # API client
│   └── package.json
└── package.json            # Root scripts
```

## API Endpoints

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/auth/login`           | User login               |
| GET    | `/api/dashboard`            | Dashboard stats          |
| GET    | `/api/products`             | List products            |
| POST   | `/api/products`             | Create product           |
| POST   | `/api/sales`                | Create sale (POS)        |
| GET    | `/api/sales/reports/summary`| Sales reports            |
| GET    | `/api/stock`                | Stock levels             |
| GET    | `/api/stock/alerts`         | Low stock alerts         |
| POST   | `/api/stock/transfer`         | Inter-branch transfer    |
| GET    | `/api/customers`            | Customer list            |
| GET    | `/api/reports/profit-loss`  | P&L statement            |
| GET    | `/api/manufacturing/*`      | Production module        |
| GET    | `/api/field-sales/*`        | Field sales module       |
| POST   | `/api/sync/push`            | Offline sync queue       |

## Subscription Plans

| Plan       | Price (UGX/year) | Highlights                              |
|------------|------------------|-----------------------------------------|
| Starter    | 1,200,000        | 1 location, 3 users, 500 products       |
| Premium    | 1,800,000        | Unlimited users/products, accounting    |
| Enterprise | 2,500,000        | Manufacturing, field sales, multi-branch|

## Offline Mode

Venderra is built for Uganda's connectivity challenges:

1. POS works fully offline — sales are saved to local storage
2. When connection returns, sales sync automatically via `/api/sync`
3. Stock adjustments queue and sync when online
4. Receipt printing works offline

## License

Proprietary — Venderra POS Software
