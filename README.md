# WorkMatch Backend

Backend API for **WorkMatch**, a freelance marketplace connecting clients with freelancers.

The API handles authentication, job posting, proposals, counter-offers, contracts, payments, reviews, file uploads, administration and audit logging.

**Live API:** https://api.workmatch.dibbockb.com
**Repository:** https://github.com/dibbockb/workmatch-backend

## Tech Stack

- Node.js
- TypeScript
- Express 5
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Zod Validation
- Stripe
- Cloudinary
- Multer
- Helmet
- Express Rate Limit
- Node Cron

## Features

- JWT access/refresh authentication
- Role-based authorization: `ADMIN`, `CLIENT`, `FREELANCER`
- Client job management
- Freelancer proposals
- Counter-offers
- Contract lifecycle management
- Stripe payments and webhooks
- Freelancer/client reviews
- Cloudinary file uploads
- Admin user management
- Audit logs
- Pagination, filtering and sorting
- Automatic closing of expired jobs

## Project Structure

```text
src/
├── app/
│   ├── envConfig/
│   ├── lib/
│   ├── middleware/
│   ├── module/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── contract/
│   │   ├── job/
│   │   ├── payment/
│   │   ├── proposal/
│   │   ├── review/
│   │   └── upload/
│   └── utils/
├── app.ts
└── server.ts

prisma/
├── schema/
└── migrations/
```

## Requirements

- Node.js 20+
- PostgreSQL
- Stripe account
- Cloudinary account

## Setup

### 1. Clone

```bash
git clone https://github.com/dibbockb/workmatch-backend.git
cd workmatch-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file from the provided example:

```bash
cp .env.example .env
```

Required variables:

```env
NODE_ENV=development
PORT=5000

SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000

GLOBAL_MAX_TRY=100
AUTH_MAX_TRY=10
PAYMENT_MAX_TRY=20

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

BCRYPT_SALT_ROUNDS=10

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_KEY=your_stripe_webhook_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Never commit `.env` or real credentials.

### 4. Generate Prisma client

```bash
npx prisma generate
```

### 5. Run migrations

```bash
npx prisma migrate deploy
```

For local development, you can use:

```bash
npx prisma migrate dev
```

### 6. Start development server

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:5000
```

## Production

Build the project:

```bash
npm run build
```

Start the compiled application:

```bash
npm start
```

## Stripe Webhooks

For local Stripe webhook development:

```bash
npm run stripe:webhook
```

This forwards Stripe events to:

```text
/api/v1/payment/webhook/stripe
```

Make sure `STRIPE_WEBHOOK_SECRET` contains the signing secret provided by Stripe.

## Database

The project uses PostgreSQL with Prisma.

The schema is split into multiple Prisma files covering:

- Users
- Clients
- Freelancers
- Jobs
- Proposals
- Counter-offers
- Contracts
- Payments
- Reviews
- Audit logs

## API Modules

| Module    | Purpose                                               |
| --------- | ----------------------------------------------------- |
| Auth      | Registration, login, refresh tokens and user identity |
| Jobs      | Create, update, close and browse jobs                 |
| Proposals | Submit, withdraw and manage proposals                 |
| Contracts | Create and manage contracts                           |
| Payments  | Stripe checkout and payment verification              |
| Reviews   | Client/freelancer reviews                             |
| Upload    | Cloudinary file uploads                               |
| Admin     | User management, dashboard and audit logs             |

## Available Scripts

```bash
npm run dev              # Development server with watch mode
npm run build            # Compile TypeScript
npm start                # Start production build
npm run stripe:webhook   # Forward Stripe webhooks locally
```

## Architecture

The backend follows a modular architecture where each business domain contains its own:

- Routes
- Controllers
- Services
- Validation schemas
- Interfaces/types where required

Shared infrastructure such as authentication, error handling, Prisma, Stripe, Cloudinary and utility functions lives under `src/app`.

## Live API

The backend is deployed and publicly accessible at:
https://api.workmatch.dibbockb.com

---

Note: This README was generated with AI assistance, but overseen by a human (me :)).
