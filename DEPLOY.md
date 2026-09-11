# Unboxarts — Deployment Guide

## Prerequisites
- GitHub repo pushed and clean (run `git status` to confirm)
- MongoDB Atlas cluster running
- All required env vars ready

---

## Step 1 — Set up third-party services (one time)

### MongoDB Atlas (database)
Already done if your dev server connects. Use the same URI for production.

### Cloudinary (image uploads)
1. Go to [cloudinary.com](https://cloudinary.com) → Sign up free
2. Dashboard shows: **Cloud Name**, **API Key**, **API Secret**
3. Copy all three

### Razorpay (payments)
1. Go to [razorpay.com](https://razorpay.com) → Sign up
2. Dashboard → Settings → API Keys → **Generate Test Key**
3. Copy Key ID and Secret
4. For live payments: complete KYC in Razorpay dashboard

---

## Step 2 — Deploy to Vercel

### Option A — GitHub import (recommended)
1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Click **"Add New Project"**
3. Import your `unBoxArt` repository
4. Framework: **Next.js** (auto-detected)
5. Click **"Environment Variables"** and add ALL of these:

```
MONGODB_URI             = your Atlas URI
NEXTAUTH_SECRET         = your random 32-char string
NEXTAUTH_URL            = https://your-project.vercel.app  ← set AFTER first deploy
CLOUDINARY_CLOUD_NAME   = from Cloudinary dashboard
CLOUDINARY_API_KEY      = from Cloudinary dashboard
CLOUDINARY_API_SECRET   = from Cloudinary dashboard
RAZORPAY_KEY_ID         = from Razorpay dashboard
RAZORPAY_KEY_SECRET     = from Razorpay dashboard
NEXT_PUBLIC_RAZORPAY_KEY_ID = same as RAZORPAY_KEY_ID
```

6. Click **Deploy** — takes ~2 minutes

### Option B — Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## Step 3 — After first deploy

1. Copy your Vercel URL (e.g. `https://unboxarts-abc123.vercel.app`)
2. Go to Vercel → Project → Settings → Environment Variables
3. Update `NEXTAUTH_URL` to your actual URL
4. Update `NEXT_PUBLIC_APP_URL` to your actual URL
5. Go to Vercel → Deployments → **Redeploy** (to pick up the new env vars)

### Update MongoDB Atlas IP whitelist
1. Atlas → Network Access → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`)
   (Vercel uses dynamic IPs so you need to allow all)

---

## Step 4 — Custom domain (optional)

1. Buy a domain at [Namecheap](https://namecheap.com) or [GoDaddy](https://godaddy.com)
2. Vercel → Project → Settings → Domains → **Add Domain**
3. Follow DNS instructions (usually takes 10–60 minutes to propagate)
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your custom domain
5. Redeploy

---

## Step 5 — Seed production database

After deploying, run the seed script against your production MongoDB URI:

```bash
MONGODB_URI="mongodb+srv://..." npx ts-node scripts/seed.ts
```

This adds the 4 artists, 9 artworks, and 6 blog posts to your live database.

---

## Production checklist

- [ ] MongoDB Atlas cluster active and IP allowlisted
- [ ] All env vars set in Vercel dashboard
- [ ] `NEXTAUTH_URL` matches your actual domain (not localhost)
- [ ] Cloudinary keys set — test by uploading an artwork
- [ ] Razorpay test mode — place a test order
- [ ] Razorpay KYC complete before accepting real money
- [ ] Database seeded with initial data
- [ ] Custom domain configured (optional)

---

## Environment variables reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | ✅ | Random 32+ char string for session encryption |
| `NEXTAUTH_URL` | ✅ | Your production URL |
| `CLOUDINARY_CLOUD_NAME` | For image uploads | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | For image uploads | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | For image uploads | From Cloudinary dashboard |
| `RAZORPAY_KEY_ID` | For payments | From Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | For payments | From Razorpay dashboard |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | For payments | Same as KEY_ID, exposed to browser |
| `NEXT_PUBLIC_APP_URL` | Optional | Your production URL |

---

## Updating the site after changes

```bash
# In your Codespace:
git add .
git commit -m "Your change description"
git push

# Vercel auto-deploys on every push to main
# Takes about 90 seconds
```

---

## Free tier limits summary

| Service | Free limit | Your usage |
|---------|-----------|------------|
| MongoDB Atlas | 512 MB | ~1 MB per 1000 artworks |
| Cloudinary | 25 GB storage | ~3 MB per image |
| Vercel | 100 GB bandwidth/month | Very generous |
| Razorpay | Free test mode | Pay per live transaction |
| GitHub Codespaces | 120 hrs/month | Stop when not coding |

All services stay free through launch and early growth.
