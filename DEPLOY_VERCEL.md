# Deploying eBay Flow AI Frontend to Vercel

This guide walks you through deploying the eBay Flow AI frontend (Next.js application) to Vercel.

## Prerequisites

- A [Vercel](https://vercel.com) account (free tier available)
- A GitHub/GitLab/Bitbucket account with your code pushed to a repository
- A deployed backend on Render (see [DEPLOY_RENDER.md](./DEPLOY_RENDER.md))

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

## Step 2: Connect Vercel to Your Git Repository

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** > **Project**
3. Under **Import Git Repository**, find and select `sellerflow-ai`
4. If you don't see it, click **Adjust GitHub App Permissions** to grant Vercel access

---

## Step 3: Configure the Project for Monorepo

Vercel needs to know that the frontend is in the `frontend/` subdirectory.

### Import Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Next.js` |
| **Root Directory** | `frontend` |
| **Build Command** | `next build` (auto-detected) |
| **Output Directory** | `.next` (auto-detected) |
| **Install Command** | `npm install` (auto-detected) |

### How to Set Root Directory in Vercel

1. On the **Configure Project** screen, click **Edit** next to **Root Directory**
2. Select **frontend** from the dropdown, or type `frontend`
3. Vercel will automatically adjust build and output paths

---

## Step 4: Configure Build Settings

### Build Command

The default `next build` works for the frontend. No changes needed.

### Development Command

For local development preview in Vercel:

```bash
next dev
```

### Ignored Build Step (Optional)

If you only want to deploy when frontend files change:

```bash
git diff --quiet HEAD^ HEAD -- frontend/
```

This prevents unnecessary deployments when only backend files change.

---

## Step 5: Add Environment Variables

In the **Environment Variables** section, add the following:

### Required Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `NEXT_PUBLIC_API_URL` | URL of your Render backend API | `https://ebayflow-backend.onrender.com/api` |
| `NEXT_PUBLIC_APP_URL` | URL of your Vercel frontend | `https://ebayflow-frontend.vercel.app` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_xxxx` or `pk_test_xxxx` |
| `NEXTAUTH_URL` | NextAuth URL (same as app URL) | `https://ebayflow-frontend.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) | `your-generated-secret` |

### How to Generate NEXTAUTH_SECRET

Run this command in your terminal:

```bash
openssl rand -base64 32
```

Copy the output and paste it as the value for `NEXTAUTH_SECRET`.

### How to Add Environment Variables in Vercel

1. On the **Configure Project** screen, expand **Environment Variables**
2. Click **Add** for each variable
3. Enter the **Name** and **Value**
4. Select the environments to apply to: **Production**, **Preview**, and **Development**
5. Click **Save**

---

## Step 6: Configure NEXT_PUBLIC_API_URL

This is the most critical variable for connecting frontend to backend.

### Format

```
NEXT_PUBLIC_API_URL=https://your-render-backend-url.onrender.com/api
```

### Example

If your Render backend URL is `https://ebayflow-backend.onrender.com`, set:

```
NEXT_PUBLIC_API_URL=https://ebayflow-backend.onrender.com/api
```

### Important Notes

- The URL must include the `/api` suffix (matching your backend's API route prefix)
- Use `https://` (not `http://`)
- Do not include a trailing slash
- This variable is prefixed with `NEXT_PUBLIC_` so it's exposed to the browser

### Updating After Backend URL Changes

If your backend URL changes (e.g., new Render service), you must:

1. Update `NEXT_PUBLIC_API_URL` in Vercel dashboard
2. Trigger a new deployment for the change to take effect

---

## Step 7: Configure Rewrites (Optional)

If you want the frontend to proxy API requests (avoiding CORS issues), add rewrites to `next.config.js`.

### Option A: Add Rewrites to next.config.js

Edit `frontend/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

With this configuration:
- Frontend requests to `/api/listings` are proxied to `https://your-backend.onrender.com/api/listings`
- CORS issues are eliminated because requests appear to come from the same origin
- The browser never sees the backend URL

### Option B: Use Direct API Calls (No Rewrites)

If your backend has proper CORS headers configured, you can skip rewrites and let the frontend call the backend directly using `NEXT_PUBLIC_API_URL`.

### When to Use Each Approach

| Approach | Use When |
|----------|----------|
| **Rewrites** | You want to hide the backend URL, avoid CORS, or have server-side API calls |
| **Direct Calls** | Your backend has CORS configured and you want simpler architecture |

---

## Step 8: Deploy

Click **Deploy**. Vercel will:

1. Clone your repository
2. Install dependencies in the `frontend/` directory
3. Run `next build`
4. Deploy to a production URL

The initial deployment typically takes 1-3 minutes.

---

## Step 9: Custom Domain Setup

### Adding a Custom Domain

1. Go to your project dashboard in Vercel
2. Click the **Settings** tab
3. Select **Domains** from the left sidebar
4. Enter your domain (e.g., `ebayflow.ai` or `app.ebayflow.ai`)
5. Click **Add**

### DNS Configuration

Vercel will provide DNS records to configure. Choose one method:

#### Method A: Vercel Nameservers (Recommended)

1. Vercel provides 4 nameservers (e.g., `ns1.vercel-dns.com`)
2. Go to your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.)
3. Replace existing nameservers with Vercel's nameservers
4. Wait for propagation (up to 48 hours, usually faster)

#### Method B: A Record + CNAME

If you want to keep your existing DNS provider:

1. Add an **A record** pointing to Vercel's IP:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

2. Add a **CNAME record** for `www`:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. Wait for DNS propagation

### Automatic HTTPS

Vercel automatically provisions and renews SSL certificates for custom domains. No additional configuration needed.

### Domain Redirects

To redirect `www.ebayflow.ai` to `ebayflow.ai` (or vice versa):

1. Add both domains in Vercel
2. Set one as the **Primary Domain**
3. Vercel automatically redirects the other

---

## Step 10: Verify Deployment

1. Open your Vercel deployment URL: `https://ebayflow-frontend.vercel.app`
2. Verify the frontend loads correctly
3. Test API connectivity by logging in or loading data
4. Check that images and assets load properly
5. Verify environment variables are working by checking network requests

---

## Troubleshooting

### Build Fails: "Module Not Found"

**Problem**: Vercel cannot find modules during build.

**Solution**:
- Verify **Root Directory** is set to `frontend`
- Check that all dependencies are in `frontend/package.json`
- Ensure no imports reference files outside the `frontend/` directory

### Build Fails: "Environment Variable Not Defined"

**Problem**: Build fails because an environment variable is missing.

**Solution**:
- Check that all required environment variables are set in Vercel
- Remember that `NEXT_PUBLIC_` variables are available at build time
- Non-`NEXT_PUBLIC_` variables are only available server-side

### Frontend Cannot Connect to Backend

**Problem**: API calls fail with network errors or CORS issues.

**Solution**:
1. Verify `NEXT_PUBLIC_API_URL` is set correctly
2. Check that the backend URL is accessible (open it in a browser)
3. If using direct calls, ensure backend CORS allows the frontend origin
4. If using rewrites, verify the rewrite configuration in `next.config.js`
5. Check browser DevTools Network tab for the actual request URL

### CORS Errors

**Problem**: `Access-Control-Allow-Origin` errors in browser console.

**Solution - Option 1**: Configure CORS on the backend:

Ensure your backend allows requests from your Vercel URL:
```
Access-Control-Allow-Origin: https://ebayflow-frontend.vercel.app
```

**Solution - Option 2**: Use rewrites (see Step 7 above).

### Image Optimization Fails

**Problem**: Next.js Image component fails to load external images.

**Solution**: Add allowed domains to `next.config.js`:

```javascript
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ebay.com',
      },
      {
        protocol: 'https',
        hostname: 'your-render-backend.onrender.com',
      },
    ],
  },
};
```

### 404 Errors on Refresh

**Problem**: Navigating to a route directly (e.g., `/dashboard`) returns 404.

**Solution**: This is typically not an issue with Vercel + Next.js, as Vercel handles client-side routing automatically. If it occurs:
- Ensure you're using Next.js routing (`next/link`) instead of `<a>` tags
- Check that the page file exists in `frontend/src/app/` or `frontend/pages/`

### Slow Initial Load on Free Tier

**Problem**: First request after inactivity is slow.

**Solution**:
- Vercel's free tier uses serverless functions that cold-start
- This is normal and improves after the first request
- For consistently fast performance, consider the Pro plan ($20/mo)

### Environment Variables Not Updating

**Problem**: Changed environment variables but the app still uses old values.

**Solution**:
- Environment variable changes require a new deployment
- Go to **Deployments** > click the latest deployment > **Redeploy**
- Or push a new commit to trigger auto-deploy

### Build Cache Issues

**Problem**: Build uses stale cache and produces incorrect results.

**Solution**:
1. Go to your project **Settings** > **Build & Development Settings**
2. Under **Build Cache**, click **Clear Build Cache**
3. Trigger a new deployment

---

## Post-Deployment Checklist

- [ ] Frontend is accessible at the Vercel URL
- [ ] `NEXT_PUBLIC_API_URL` points to the correct backend
- [ ] All environment variables are configured
- [ ] API calls succeed (check Network tab in DevTools)
- [ ] Authentication works (login, logout, session persistence)
- [ ] Images and assets load correctly
- [ ] Custom domain is configured (if applicable)
- [ ] SSL certificate is active for custom domain
- [ ] Environment variables are set for all environments (Production, Preview, Development)
- [ ] Auto-deploy is configured for the correct branch

---

## Vercel Environments

Vercel provides three deployment environments:

| Environment | Trigger | URL Pattern | Use Case |
|-------------|---------|-------------|----------|
| **Production** | Push to `main` branch | Your custom domain or `.vercel.app` | Live application |
| **Preview** | Push to any other branch | Auto-generated `.vercel.app` URL | Testing feature branches |
| **Development** | `vercel dev` locally | `localhost:3000` | Local development |

### Environment Variables per Environment

You can set different environment variables for each environment:

- **Production**: Points to production backend (`https://ebayflow-backend.onrender.com/api`)
- **Preview**: Can point to staging backend or production
- **Development**: Points to local backend (`http://localhost:4000/api`)

---

## Monitoring

- **Vercel Dashboard**: View deployments, logs, and analytics
- **Vercel Analytics**: Enable for page views and web vitals
- **Vercel Speed Insights**: Monitor Core Web Vitals
- **Vercel Logs**: Real-time function logs and build logs

---

## Scaling

When your traffic grows:

1. **Upgrade Vercel Plan**: Move from Hobby (free) to Pro ($20/mo) for:
   - More serverless function execution time
   - Higher bandwidth limits
   - Advanced analytics
   - Password protection for preview deployments

2. **Edge Functions**: Move API calls to Vercel Edge Functions for lower latency

3. **ISR/SSG**: Use Incremental Static Regeneration for pages that don't need real-time data

4. **CDN**: Vercel's global CDN is automatic. Add Cloudflare for additional caching and DDoS protection

---

## Local Development with Production Environment

To test locally with production environment variables:

```bash
cd frontend
vercel env pull .env.production.local
npm run dev
```

This pulls your Vercel environment variables into a local `.env.production.local` file.
