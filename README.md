# SellerFlow AI

> The smartest way to manage your eBay business in the UK. Automate listings, orders, inventory, and profit tracking with AI-powered insights.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start (Docker Compose)](#quick-start-docker-compose)
- [Manual Setup](#manual-setup)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Deployment](#deployment)
- [Admin Login Credentials](#admin-login-credentials)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Module Documentation](#module-documentation)

---

## Project Overview

SellerFlow AI is a comprehensive eBay business management platform designed for UK sellers. It provides end-to-end automation for listing management, order processing, inventory control, profit analytics, and AI-powered listing optimisation.

### Key Features

| Feature | Description |
|---------|-------------|
| **Real-Time eBay Sync** | Automated synchronization every 15 minutes via eBay API |
| **AI Listing Optimiser** | GPT-4o powered title and description optimisation for better search rankings |
| **Profit Analytics** | True profit calculation after eBay fees, VAT, and shipping costs |
| **Bulk Operations** | Edit thousands of listings simultaneously |
| **Inventory Control** | Unified stock management with low-stock alerts |
| **Shipping Integration** | Royal Mail, DPD, and Evri integration |
| **Website Management** | Full CMS with SEO, blog, media library, and dynamic content |
| **Role-Based Access** | Dynamic roles and permissions system with audit logging |

---

## Architecture

SellerFlow AI follows a monorepo architecture with separate frontend and backend services, backed by PostgreSQL and Redis.

```
SellerFlow AI
├── frontend/                 # Next.js 14 (App Router) - Client Dashboard
├── backend/                  # Next.js 14 API Routes - Backend Services
├── docker-compose.yml        # Docker orchestration for all services
└── .env.example              # Environment variable template
```

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Port 3000)                  │
│  Next.js 14 | React 18 | TailwindCSS | Radix UI             │
│  TanStack Query | Zustand | Recharts | Framer Motion        │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / REST API
┌────────────────────────▼────────────────────────────────────┐
│                        Backend (Port 4000)                   │
│  Next.js API Routes | Prisma ORM | pg-boss Job Queue        │
│  OpenAI GPT-4o | Stripe | JWT Auth | Zod Validation         │
└───────┬──────────────────────┬──────────────────────────────┘
        │                      │
┌───────▼───────┐    ┌─────────▼──────────┐
│  PostgreSQL   │    │      Redis         │
│  (Port 5432)  │    │   (Port 6379)      │
│  Prisma ORM   │    │   Caching          │
└───────────────┘    └────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | Next.js 14 (App Router) |
| **Backend Framework** | Next.js 14 API Routes |
| **Language** | TypeScript 5.3 |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma 5 |
| **Cache** | Redis 7 |
| **Job Queue** | pg-boss |
| **Authentication** | NextAuth.js + JWT |
| **Styling** | TailwindCSS + Radix UI |
| **State Management** | Zustand + TanStack Query |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **AI** | OpenAI GPT-4o |
| **Payments** | Stripe |
| **Forms** | React Hook Form + Zod |

---

## Prerequisites

Ensure the following are installed on your system before proceeding:

| Software | Version | Required For |
|----------|---------|--------------|
| **Node.js** | 18.x or higher | Runtime for frontend and backend |
| **npm** | 9.x or higher | Package management |
| **Docker** | 24.x or higher | Containerised development (optional) |
| **Docker Compose** | 2.x or higher | Multi-container orchestration (optional) |
| **PostgreSQL** | 15+ | Database (manual setup only) |
| **Git** | 2.x+ | Version control |

### Verify Installation

```bash
node --version    # v18.x or higher
npm --version     # 9.x or higher
docker --version  # Docker version 24.x+
docker compose version
```

---

## Quick Start (Docker Compose)

The fastest way to get SellerFlow AI running locally is with Docker Compose. This spins up all four services (PostgreSQL, Redis, Backend, Frontend) in isolated containers.

### 1. Clone and Configure

```bash
cd sellerflow-ai
cp .env.example .env
```

### 2. Start All Services

```bash
docker compose up -d
```

This will:
- Build and start the PostgreSQL database on port `5432`
- Start Redis cache on port `6379`
- Build and start the backend API on port `4000`
- Build and start the frontend on port `3000`

### 3. Initialize Database

```bash
docker compose exec backend npx prisma migrate dev
docker compose exec backend npm run db:seed
```

### 4. Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Marketing site and dashboard |
| Backend API | http://localhost:4000/api | REST API endpoints |
| PostgreSQL | localhost:5432 | Database (external access) |
| Redis | localhost:6379 | Cache (external access) |

### Common Docker Commands

```bash
# View logs from all services
docker compose logs -f

# View logs from a specific service
docker compose logs -f backend
docker compose logs -f frontend

# Rebuild services after code changes
docker compose up -d --build

# Stop all services
docker compose down

# Stop and remove volumes (resets database)
docker compose down -v

# Run a command inside a container
docker compose exec backend npx prisma studio
```

---

## Manual Setup

If you prefer not to use Docker, follow these steps for a manual local setup.

### 1. Database Setup

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE sellerflow;"

# Or using createdb
createdb -U postgres sellerflow
```

### 2. Start Redis

```bash
# Using Homebrew (macOS)
brew services start redis

# Or run directly
redis-server
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with initial data
npm run db:seed

# Start development server
npm run dev
```

The backend will be available at `http://localhost:4000`.

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Ensure NEXT_PUBLIC_API_URL points to http://localhost:4000/api

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### 5. Verify Setup

Open your browser and navigate to:

- **Marketing Site**: http://localhost:3000
- **Dashboard Login**: http://localhost:3000/login
- **Admin Dashboard**: http://localhost:3000/dashboard/admin
- **Backend API**: http://localhost:4000/api

---

## Environment Variables

### Root `.env` (Docker Compose)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@postgres:5432/sellerflow` | PostgreSQL connection string |
| `POSTGRES_USER` | `postgres` | Database username |
| `POSTGRES_PASSWORD` | `postgres` | Database password |
| `POSTGRES_DB` | `sellerflow` | Database name |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | Public API base URL |
| `JWT_SECRET` | *(required)* | Secret key for JWT token signing |
| `NODE_ENV` | `development` | Node environment (`development` / `production`) |
| `UPLOAD_DIR` | `./uploads` | Directory for file uploads |

### Backend `.env`

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing secret (change in production) |
| `NEXT_PUBLIC_API_URL` | API base URL for client-side calls |
| `NODE_ENV` | Environment mode |
| `UPLOAD_DIR` | Upload directory path |
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments |
| `EBAY_APP_ID` | eBay API application ID |
| `EBAY_CERT_ID` | eBay API certificate ID |
| `EBAY_DEV_NAME` | eBay developer name |

### Frontend `.env.local`

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXTAUTH_URL` | NextAuth base URL |
| `NEXTAUTH_SECRET` | NextAuth secret key |

---

## Development Workflow

### Branch Strategy

```
main              # Production-ready code
├── develop       # Integration branch
├── feature/*     # New features
├── bugfix/*      # Bug fixes
└── release/*     # Release preparation
```

### Running Services

For development, run both services in separate terminals:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Database Development

```bash
# Create a new migration after schema changes
cd backend
npx prisma migrate dev --name describe_your_change

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (visual database browser)
npx prisma studio

# Seed database
npm run db:seed
```

### Code Style

The project uses ESLint and Prettier for consistent code formatting:

```bash
# Lint backend
cd backend && npm run lint

# Lint frontend
cd frontend && npm run lint
```

### Available Scripts

#### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 4000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:seed` | Run database seed script |
| `npm run worker` | Start pg-boss job worker |

#### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run dev:fast` | Start with Turbopack for faster builds |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run a specific test file
npm test -- src/modules/auth/__tests__/auth.test.ts

# Run tests with coverage
npm test -- --coverage
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### API Testing

Test API endpoints using curl or your preferred HTTP client:

```bash
# Test backend health
curl http://localhost:4000/api/health

# Test public settings endpoint
curl http://localhost:4000/api/public/settings

# Test with authentication
curl -H "Authorization: Bearer <your-jwt-token>" \
     http://localhost:4000/api/admin/stats
```

---

## Deployment

### Production Environment Variables

Ensure the following are set in production:

| Variable | Production Value |
|----------|------------------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Strong random string (min 32 chars) |
| `DATABASE_URL` | Production PostgreSQL connection string |
| `REDIS_URL` | Production Redis connection string |
| `NEXT_PUBLIC_API_URL` | Production API URL (https://...) |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `STRIPE_SECRET_KEY` | Production Stripe key |

### Deploying to Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod
```

### Deploying Backend

The backend can be deployed to any Node.js hosting platform:

```bash
cd backend

# Build for production
npm run build

# Start production server
npm run start
```

### Database Migration in Production

```bash
# Apply pending migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Docker Production Build

```bash
# Build production images
docker compose -f docker-compose.yml build --no-cache

# Start in production mode
NODE_ENV=production docker compose up -d
```

---

## Admin Login Credentials

### Super Admin Account

| Field | Value |
|-------|-------|
| **Email** | `contact@ebayflow.com` |
| **Password** | `EbayFlow@883` |
| **Role** | `SUPER_ADMIN` |
| **Dashboard** | http://localhost:3000/dashboard/admin |

> **WARNING**: Change these credentials immediately in production. The super admin has full access to all system features.

### Demo Account

| Field | Value |
|-------|-------|
| **Email** | `demo@sellerflow.ai` |
| **Password** | `Demo123!` |

### Role System

| Role | Permissions |
|------|-------------|
| **SUPER_ADMIN** | Full system access (wildcard `*` permission) |
| **EDITOR** | Content, blog, media, testimonials, FAQs, pricing management |
| **VIEWER** | Read-only access to all content |
| **Custom** | Defined by SUPER_ADMIN with specific permissions |

Permission format: `entity:action` (e.g., `content:read`, `blog:write`, `media:delete`)

---

## API Documentation

### Base URL

```
Development: http://localhost:4000/api
Production:  https://your-domain.com/api
```

### Admin Endpoints

All admin endpoints require authentication with a valid JWT token and appropriate role permissions.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/PUT` | `/api/admin/settings` | Site settings |
| `GET/POST` | `/api/admin/pages` | Page management |
| `GET/PUT/DELETE` | `/api/admin/pages/:id` | Single page CRUD |
| `GET/POST` | `/api/admin/pages/:pageId/sections` | Page sections |
| `GET/PUT/DELETE` | `/api/admin/sections/:id` | Section CRUD |
| `GET/PUT` | `/api/admin/seo/:pageId` | SEO management |
| `GET/POST` | `/api/admin/navigation` | Navigation builder |
| `GET/POST` | `/api/admin/media` | Media library |
| `POST` | `/api/admin/media/upload` | File upload (multipart) |
| `GET/POST` | `/api/admin/blog` | Blog posts |
| `GET/POST` | `/api/admin/testimonials` | Testimonials |
| `GET/POST` | `/api/admin/faqs` | FAQ categories and items |
| `GET/PUT` | `/api/admin/pricing/:id` | Pricing plans |
| `GET/POST` | `/api/admin/redirects` | URL redirects |
| `GET` | `/api/admin/audit` | Audit log |
| `GET/POST` | `/api/admin/roles` | Role management |
| `GET/POST` | `/api/admin/users` | User management |
| `GET` | `/api/admin/stats` | Dashboard statistics |

### Public Endpoints

Public endpoints require no authentication and return only active/published content.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/public/settings` | Site settings |
| `GET` | `/api/public/sections/:pageSlug` | Page sections |
| `GET` | `/api/public/navigation/:location` | Navigation menus |
| `GET` | `/api/public/blog` | Blog post listing |
| `GET` | `/api/public/blog/:slug` | Single blog post |
| `GET` | `/api/public/testimonials` | Testimonials |
| `GET` | `/api/public/faqs` | FAQ listing |
| `GET` | `/api/public/pricing` | Pricing plans |
| `GET` | `/api/public/seo/:pageSlug` | SEO metadata |

### Authentication

Include the JWT token in the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
```

---

## Troubleshooting

### Common Issues

#### Database Connection Errors

```
Error: P1000: Authentication failed against database server
```

**Solution:**
1. Verify `DATABASE_URL` in `.env` is correct
2. Ensure PostgreSQL is running: `pg_isready`
3. Check credentials match your PostgreSQL setup
4. For Docker: ensure the postgres service is healthy (`docker compose ps`)

#### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using the port
lsof -i :3000   # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>   # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### Prisma Client Not Generated

```
Error: @prisma/client did not initialize yet
```

**Solution:**
```bash
cd backend
npx prisma generate
```

#### Redis Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:**
```bash
# Start Redis
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:7-alpine
```

#### Docker Build Failures

```
Error: failed to solve: process "/bin/sh -c npm install" did not complete successfully
```

**Solution:**
```bash
# Clear Docker cache and rebuild
docker compose down
docker system prune -f
docker compose up -d --build

# Check logs for specific errors
docker compose logs backend
docker compose logs frontend
```

#### Migration Conflicts

```
Error: P3015: Could not find the migration file
```

**Solution:**
```bash
cd backend

# Reset migrations (WARNING: deletes all data)
npx prisma migrate reset

# Or resolve manually
npx prisma migrate resolve --rolled-back <migration-name>
```

### Health Checks

```bash
# Check all Docker services
docker compose ps

# Check database connectivity
docker compose exec backend npx prisma db pull

# Check Redis
docker compose exec redis redis-cli ping
# Should return: PONG

# Check backend API
curl http://localhost:4000/api/health

# Check frontend
curl -I http://localhost:3000
```

### Reset Everything

If you need a completely fresh start:

```bash
# Stop and remove all containers and volumes
docker compose down -v

# Remove node_modules
rm -rf backend/node_modules frontend/node_modules

# Reinstall and restart
docker compose up -d --build

# Initialize database
docker compose exec backend npx prisma migrate dev
docker compose exec backend npm run db:seed
```

---

## Module Documentation

For detailed documentation on specific modules, refer to the following:

| Module | Documentation |
|--------|---------------|
| **Website Management** | [WEBSITE_MANAGEMENT.md](./WEBSITE_MANAGEMENT.md) - CMS, SEO, navigation, media, blog, roles, and permissions |

### Website Management Module Overview

The Website Management module provides a complete admin dashboard for managing all website content from `/dashboard/admin`. Key features include:

- **Site Settings** - Global configuration, contact info, social links, analytics, custom CSS
- **Pages & Sections** - Dynamic page builder with JSON-based section content
- **SEO Manager** - Per-page meta tags, Open Graph, JSON-LD, canonical URLs
- **Navigation Builder** - Header and footer menu management with dropdowns
- **Media Library** - Image upload, search, and management
- **Blog Manager** - Post creation with TipTap rich text editor, scheduling
- **Testimonials** - Customer quotes with ratings and stats badges
- **FAQ Manager** - Categorized FAQ management
- **Pricing Plans** - Monthly/yearly plan management with feature lists
- **Redirects** - 301/302 URL redirect management
- **Audit Log** - Complete change history tracking
- **Users & Roles** - Dynamic role-based access control

See [WEBSITE_MANAGEMENT.md](./WEBSITE_MANAGEMENT.md) for complete API endpoints, database schema, and setup instructions.

---

## Project Structure

```
sellerflow-ai/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   ├── migrations/            # Database migrations
│   │   └── seed.ts                # Seed data script
│   ├── src/
│   │   ├── app/api/               # Next.js API routes
│   │   │   ├── admin/             # Admin endpoints (auth required)
│   │   │   ├── public/            # Public endpoints (no auth)
│   │   │   └── _auth.ts           # Auth middleware
│   │   ├── modules/               # Feature modules
│   │   │   ├── admin/             # Admin functionality
│   │   │   ├── ai/                # AI-powered features
│   │   │   ├── analytics/         # Analytics and reporting
│   │   │   ├── auth/              # Authentication
│   │   │   ├── billing/           # Stripe integration
│   │   │   ├── ebay/              # eBay API integration
│   │   │   ├── inventory/         # Stock management
│   │   │   ├── jobs/              # pg-boss job queue
│   │   │   ├── listings/          # Listing management
│   │   │   ├── notifications/     # Notification system
│   │   │   └── orders/            # Order processing
│   │   ├── common/                # Shared utilities
│   │   └── lib/                   # Library code
│   ├── public/uploads/            # Uploaded files
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js App Router pages
│   │   │   └── (dashboard)/admin/ # Admin dashboard pages
│   │   ├── components/            # React components
│   │   ├── lib/admin/             # Admin API client and hooks
│   │   └── styles/                # Global styles
│   ├── public/                    # Static assets
│   └── package.json
├── docker-compose.yml             # Docker orchestration
├── .env.example                   # Environment template
└── WEBSITE_MANAGEMENT.md          # Website module docs
```

---

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Run linting: `npm run lint` in both `backend/` and `frontend/`
4. Run tests: `npm test` in both directories
5. Submit a pull request to `develop`

---

## License

Private - All rights reserved.

---

*Built for UK eBay Sellers*
