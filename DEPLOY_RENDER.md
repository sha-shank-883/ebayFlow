# Deploying eBay Flow AI Backend to Render

This guide walks you through deploying the eBay Flow AI backend (Next.js API server) to Render.

## Prerequisites

- A [Render](https://render.com) account (free tier available)
- A GitHub/GitLab/Bitbucket account with your code pushed to a repository
- A PostgreSQL database (see [DEPLOY_DATABASE.md](./DEPLOY_DATABASE.md))

---

## Step 1: Push Your Code to a Git Repository

If your code is not already on GitHub:

```bash
cd C:\Users\User\Desktop\seller\sellerflow-ai
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/sellerflow-ai.git
git push -u origin main
```

---

## Step 2: Create a PostgreSQL Database on Render

Before deploying the backend, you need a database. Follow [DEPLOY_DATABASE.md](./DEPLOY_DATABASE.md) to create a PostgreSQL database on Render and obtain your `DATABASE_URL` connection string.

---

## Step 3: Create a New Web Service on Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** in the top-right corner
3. Select **Web Service**
4. Connect your Git repository (GitHub, GitLab, or Bitbucket)
5. Select the `sellerflow-ai` repository

---

## Step 4: Configure the Web Service

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `ebayflow-backend` (or your preferred name) |
| **Region** | Choose the region closest to your users (e.g., `London` for UK) |
| **Branch** | `main` (or your deployment branch) |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npx prisma migrate deploy && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (for testing) or `Starter` ($7/mo) for production |

### Important: Root Directory

Setting the **Root Directory** to `backend` tells Render to run all commands from within the `backend/` folder. This is critical because:

- `package.json` is located in `backend/`
- `prisma/` schema is in `backend/prisma/`
- All Next.js pages and API routes are in `backend/`

---

## Step 5: Add Environment Variables

In the **Environment** section of the web service configuration, add the following variables:

### Required Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `DATABASE_URL` | PostgreSQL connection string from Render database | `postgresql://user:pass@hostname:5432/dbname` |
| `NODE_ENV` | Node environment | `production` |
| `JWT_SECRET` | Secret for signing JWT tokens (min 32 chars) | `your-super-secret-jwt-key-change-in-production` |
| `JWT_EXPIRES_IN` | JWT token expiration | `15m` |
| `REFRESH_TOKEN_SECRET` | Secret for refresh tokens (min 32 chars) | `your-refresh-token-secret-change-in-prod` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiration | `30d` |
| `ENCRYPTION_KEY` | AES-256 encryption key for sensitive data | `your-32-char-encryption-key!` |
| `FRONTEND_URL` | URL of your deployed frontend | `https://ebayflow-frontend.vercel.app` |
| `PORT` | Port for the backend (Render sets this automatically) | `10000` (or leave unset) |

### OAuth & Third-Party Services

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `your-google-client-id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-your-google-secret` |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL | `https://ebayflow-backend.onrender.com/api/auth/google/callback` |
| `EBAY_CLIENT_ID` | eBay OAuth App ID (sandbox or production) | `YourAppId-xxxx-xxxx-xxxx` |
| `EBAY_CLIENT_SECRET` | eBay OAuth Cert ID | `YourCertId-xxxx-xxxx-xxxx` |
| `EBAY_REDIRECT_URI` | eBay OAuth redirect URL | `https://ebayflow-backend.onrender.com/api/ebay/callback` |
| `EBAY_ENVIRONMENT` | eBay environment | `production` (or `sandbox` for testing) |
| `EBAY_BASE_URL` | eBay API base URL | `https://api.ebay.com` (production) or `https://api.sandbox.ebay.com` (sandbox) |
| `EBAY_SIGNIN_URL` | eBay sign-in URL | `https://signin.ebay.com` (production) or `https://signin.sandbox.ebay.com` (sandbox) |
| `OPENAI_API_KEY` | OpenAI API key for AI features | `sk-proj-your-openai-key` |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4o` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_xxxx` (production) or `sk_test_xxxx` (test) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_xxxx` |
| `STRIPE_STARTER_PRICE_ID` | Stripe Starter plan price ID | `price_xxxx` |
| `STRIPE_GROWTH_PRICE_ID` | Stripe Growth plan price ID | `price_xxxx` |
| `STRIPE_PRO_PRICE_ID` | Stripe Professional plan price ID | `price_xxxx` |

### How to Add Environment Variables in Render

1. In your web service dashboard, go to the **Environment** tab
2. Click **Add Environment Variable** for each variable
3. Enter the **Key** and **Value**
4. Click **Save Changes**
5. Render will automatically redeploy with the new variables

---

## Step 6: Configure Auto-Deploy

Under the **Auto-Deploy** setting:

- **Yes** (recommended): Automatically deploys on every push to the configured branch
- **No**: Manual deploys only (click **Manual Deploy** in the dashboard)

For production, consider setting auto-deploy to **No** and deploying manually after testing.

---

## Step 7: Deploy

Click **Create Web Service**. Render will:

1. Clone your repository
2. Run the build command
3. Start the service

The initial deployment may take 3-5 minutes. You can monitor progress in the **Events** tab.

---

## Step 8: Handle File Uploads (Persistent Disk)

If your backend handles file uploads (images, documents, etc.), you need a persistent disk because Render's filesystem is ephemeral.

### Option A: Render Persistent Disk (Recommended for small files)

1. In your web service dashboard, go to the **Disks** tab
2. Click **Add Disk**
3. Configure:
   - **Mount Path**: `/opt/render/project/src/uploads`
   - **Size**: `1GB` (minimum, increase as needed)
4. Click **Save**
5. Add this environment variable:
   ```
   UPLOAD_DIR=/opt/render/project/src/uploads
   ```

### Option B: Cloud Storage (Recommended for production)

For production, use a cloud storage service instead of a persistent disk:

- **AWS S3**: Store images and files in S3 buckets
- **Cloudinary**: Image optimization and CDN
- **UploadThing**: Simple file uploads for Next.js

Update your backend code to use the cloud storage provider instead of local file storage.

---

## Step 9: Run Database Seed After Deployment

After your first successful deployment, seed the database with initial data:

### Method 1: Via Render Shell

1. Go to your web service dashboard
2. Click the **Shell** tab
3. Wait for the shell to connect
4. Run:
   ```bash
   cd backend
   npx ts-node prisma/seed.ts
   ```

### Method 2: Via Render API (Automated)

Create a deploy hook or use the Render API to run the seed script after deployment:

```bash
curl -X POST "https://api.render.com/v1/services/{serviceId}/deploys" \
  -H "Authorization: Bearer YOUR_RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"clearCache": "true"}'
```

Then connect via shell and run the seed.

### Method 3: Local Machine (with remote DATABASE_URL)

From your local machine, point to the production database:

```bash
cd backend
DATABASE_URL="postgresql://user:pass@hostname:5432/dbname" npx ts-node prisma/seed.ts
```

> **Warning**: The seed script deletes existing data before re-seeding. Only run this on fresh databases or when you intentionally want to reset data.

---

## Step 10: Verify Deployment

1. Open your Render service URL: `https://ebayflow-backend.onrender.com`
2. Test the API health endpoint (if available): `https://ebayflow-backend.onrender.com/api/health`
3. Check the **Logs** tab for any errors
4. Verify database connectivity by checking if seed data appears

---

## Troubleshooting

### Build Fails with "Prisma Client Not Generated"

**Problem**: `@prisma/client` is not found during build.

**Solution**: Ensure your build command includes `npx prisma generate`:

```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

### Build Fails with "Module Not Found"

**Problem**: Next.js cannot find modules or pages.

**Solution**:
- Verify **Root Directory** is set to `backend`
- Check that all dependencies are in `backend/package.json`
- Ensure `tsconfig.json` paths are correct

### Database Connection Fails

**Problem**: `P1001: Can't reach database server`

**Solution**:
- Verify `DATABASE_URL` is correct in environment variables
- Ensure the PostgreSQL database is in the same Render region
- Check that the database is running (not paused on free tier)

### Service Crashes on Start

**Problem**: Service starts then immediately stops.

**Solution**:
1. Check the **Logs** tab for error messages
2. Verify all required environment variables are set
3. Ensure the `PORT` environment variable matches what Next.js expects (Render sets this automatically)
4. Check that `npm start` runs `next start -p 4000` and Render routes to the correct port

### Free Tier Sleep Issues

**Problem**: Free tier services spin down after 15 minutes of inactivity.

**Solution**:
- Upgrade to a paid plan ($7/mo Starter) for always-on service
- Use a monitoring service like [UptimeRobot](https://uptimerobot.com/) to ping your service every 10 minutes (keeps it awake on free tier)

### CORS Errors from Frontend

**Problem**: Frontend cannot reach the backend due to CORS.

**Solution**:
- Ensure `FRONTEND_URL` environment variable is set to your frontend URL
- Verify your backend CORS configuration allows requests from the frontend origin
- Check that the frontend `NEXT_PUBLIC_API_URL` points to the correct backend URL

### Prisma Migration Fails

**Problem**: `npx prisma migrate deploy` fails during build.

**Solution**:
1. Run migrations locally first to ensure they work:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
2. Check the migration files in `backend/prisma/migrations/`
3. If a migration is broken, create a new migration:
   ```bash
   npx prisma migrate dev --name fix_migration
   ```

### TypeScript Compilation Errors

**Problem**: Build fails with TypeScript errors.

**Solution**:
- Run `npm run build` locally to catch errors before deploying
- Check `tsconfig.json` settings match your project structure
- Ensure all type definitions are installed

---

## Post-Deployment Checklist

- [ ] Backend service is running and accessible
- [ ] Database migrations have been applied
- [ ] Seed data has been loaded (if needed)
- [ ] All environment variables are configured
- [ ] CORS is configured for the frontend URL
- [ ] eBay OAuth callback URL is registered with eBay Developer Portal
- [ ] Google OAuth callback URL is registered in Google Cloud Console
- [ ] Stripe webhook endpoint is configured in Stripe Dashboard
- [ ] File upload storage is configured (persistent disk or cloud storage)
- [ ] Logs are being monitored for errors
- [ ] Auto-deploy is configured (or manual deploy process is documented)

---

## Monitoring

- **Render Dashboard**: View logs, metrics, and deployment history
- **Render Alerts**: Set up email notifications for deploy failures
- **External Monitoring**: Use services like UptimeRobot, Pingdom, or Better Stack for uptime monitoring

---

## Scaling

When your traffic grows:

1. **Upgrade Instance Type**: Move from Free to Starter ($7/mo) or higher
2. **Add Persistent Disk**: Increase disk size as file storage needs grow
3. **Database Scaling**: Upgrade PostgreSQL plan for more connections and storage
4. **Connection Pooling**: Enable PgBouncer for high-traffic scenarios (see DEPLOY_DATABASE.md)
5. **CDN**: Use Cloudflare for caching and DDoS protection
