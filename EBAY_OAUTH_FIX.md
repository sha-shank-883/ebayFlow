# eBay OAuth Connection - Complete Fix Guide

## Problem Summary
The `invalid_request` and `unauthorized_client` errors were caused by:
1. Using Sandbox credentials for Production eBay accounts
2. Frontend calling wrong API routes (`?action=auth-url` instead of `/auth-url`)
3. Callback URL pointing to frontend instead of backend

---

## Step 1: Update Vercel Environment Variables (Frontend)

Go to your Vercel dashboard → Project → Settings → Environment Variables

Add or update these keys:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://ebayflow.onrender.com/api` |

Delete any duplicate entries.

---

## Step 2: Update Render Environment Variables (Backend)

Go to your Render dashboard → Select your backend service → Environment

Add or update these keys:

| Key | Value |
|---|---|
| `EBAY_ENVIRONMENT` | `production` |
| `EBAY_CLIENT_ID` | `YOUR-PRODUCTION-CLIENT-ID` |
| `EBAY_CLIENT_SECRET` | `YOUR-PRODUCTION-CLIENT-SECRET` |
| `EBAY_REDIRECT_URI` | `https://ebayflow.onrender.com/api/ebay/callback` |
| `EBAY_BASE_URL` | `https://api.ebay.com` |
| `EBAY_SIGNIN_URL` | `https://signin.ebay.com` |
| `FRONTEND_URL` | `https://ebayflow.com` |

**Important:** Delete any duplicate entries for these keys. Render does not allow duplicates.

---

## Step 3: Update eBay Developer Dashboard

1. Go to [developer.ebay.com](https://developer.ebay.com)
2. Sign in with your live eBay account
3. Go to **My Account** → **Developer Dashboard**
4. Click on your **Production** application
5. Go to **User Tokens** tab
6. Find your RuName: `hotlinetyres-hotlinet-invent-cnynfp`
7. Click **Edit** or **Clone**
8. Set these fields:

| Field | Value |
|---|---|
| **Auth accepted URL** | `https://ebayflow.onrender.com/api/ebay/callback` |
| **Auth declined URL** | `https://ebayflow.com/settings` |

9. Click **Save**

---

## Step 4: Redeploy Both Services

### Backend (Render)
- Push your code changes to trigger a redeploy
- Or manually click "Redeploy" in Render dashboard

### Frontend (Vercel)
- Push your code changes to trigger a redeploy
- Or manually click "Redeploy" in Vercel dashboard

---

## Step 5: Test the Connection

1. Go to `https://ebayflow.com`
2. Log in to your account
3. Go to **Settings** → **Integrations** tab
4. Click **Connect eBay Account**
5. You should be redirected to **live eBay** (not sandbox) to sign in
6. After authorizing, you should be redirected back to Settings with a success message

---

## How the Flow Works

```
User clicks "Connect eBay"
        ↓
Frontend calls: GET https://ebayflow.onrender.com/api/ebay/auth-url
        ↓
Backend generates eBay OAuth URL:
  https://auth.ebay.com/oauth2/authorize
    ?client_id=hotlinet-inventry-PRD-184c0e5fe-b1c5d43e
    &redirect_uri=https://ebayflow.onrender.com/api/ebay/callback
    &response_type=code
    &scope=<scopes>
    &state=<workspaceId>
        ↓
User signs in on eBay and authorizes
        ↓
eBay redirects to:
  https://ebayflow.onrender.com/api/ebay/callback?code=XXX&state=XXX
        ↓
Backend exchanges code for tokens
        ↓
Backend fetches account info from eBay API
        ↓
Tokens encrypted and saved to database
        ↓
Backend redirects to:
  https://ebayflow.com/settings?success=true
```

---

## Troubleshooting

### Error: `unauthorized_client`
- Wrong Client ID or using Sandbox credentials for Production
- Verify `EBAY_CLIENT_ID` matches your Production app

### Error: `invalid_request`
- `redirect_uri` doesn't match what's set in eBay RuName
- Both must be exactly: `https://ebayflow.onrender.com/api/ebay/callback`

### Error: 404 on callback
- Backend not deployed or route not accessible
- Verify `https://ebayflow.onrender.com/api/ebay/callback` returns a response

### Error: CORS blocked
- Frontend domain not in backend CORS allowlist
- Already fixed in code, but verify after redeploy

---

## Files Changed

| File | Change |
|---|---|
| `backend/.env` | Updated eBay credentials to Production |
| `backend/src/main.ts` | Added frontend domains to CORS allowlist |
| `backend/src/modules/ebay/ebay.service.ts` | Fixed to use `EBAY_REDIRECT_URI` dynamically |
| `backend/src/modules/ebay/ebay-oauth.service.ts` | Fixed to use `EBAY_REDIRECT_URI` instead of RuName |
| `backend/src/modules/ebay/ebay.controller.ts` | Added error handling, uses `FRONTEND_URL` for redirect |
| `frontend/src/app/(dashboard)/settings/page.tsx` | Fixed API routes to match NestJS controller |
| `frontend/src/app/onboarding/page.tsx` | Fixed API route to match NestJS controller |
