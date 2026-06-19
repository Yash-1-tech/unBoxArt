# Unboxarts — Complete Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Getting Started](#4-getting-started)
5. [Environment Variables](#5-environment-variables)
6. [Database Setup](#6-database-setup)
7. [Pages & Routes](#7-pages--routes)
8. [API Reference](#8-api-reference)
9. [Components](#9-components)
10. [Database Models](#10-database-models)
11. [Making It a Live Website](#11-making-it-a-live-website)
12. [Adding Real Images](#12-adding-real-images)
13. [Payment Integration](#13-payment-integration)
14. [Authentication Setup](#14-authentication-setup)
15. [Deployment Guide](#15-deployment-guide)
16. [Common Issues & Fixes](#16-common-issues--fixes)

---

## 1. Project Overview

Unboxarts is a full-stack art marketplace where:
- **Artists** can list and sell original paintings and digital prints
- **Buyers** can discover, wishlist, and purchase artwork
- **0% commission** — all sales go directly to the artist
- **Features:** Authentication, image upload, cart, checkout, dashboard, blog

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | MongoDB with Mongoose |
| Auth | Custom JWT (upgradeable to NextAuth) |
| Image Storage | Cloudinary (recommended) |
| Payments | Stripe / Razorpay |
| Deployment | Vercel (recommended) |
| Language | TypeScript |

---

## 3. Project Structure

```
unBoxArt/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (Navbar + Footer)
│   ├── page.tsx                  # Home page
│   ├── globals.css               # Global styles
│   ├── art-gallery/
│   │   └── page.tsx              # Gallery listing with filters
│   ├── artwork/[id]/
│   │   └── page.tsx              # Product detail page
│   ├── artists/
│   │   ├── page.tsx              # Artists directory
│   │   └── [id]/page.tsx         # Artist profile page
│   ├── auth/
│   │   ├── signin/page.tsx       # Sign in
│   │   └── signup/page.tsx       # Sign up
│   ├── cart/
│   │   └── page.tsx              # Shopping cart
│   ├── checkout/
│   │   └── page.tsx              # Checkout
│   ├── dashboard/
│   │   └── page.tsx              # User dashboard
│   ├── blog/
│   │   └── page.tsx              # Blog listing
│   └── contact/
│       └── page.tsx              # Contact page
│
├── app/api/                      # API Routes
│   ├── auth/
│   │   ├── register/route.ts     # POST — create account
│   │   └── login/route.ts        # POST — sign in
│   ├── artworks/
│   │   ├── route.ts              # GET list, POST create
│   │   └── [id]/
│   │       ├── route.ts          # GET, PATCH, DELETE
│   │       ├── like/route.ts     # POST — toggle like
│   │       └── reviews/route.ts  # POST — add review
│   ├── users/
│   │   ├── route.ts              # GET list
│   │   └── [id]/
│   │       ├── route.ts          # GET, PATCH profile
│   │       └── wishlist/route.ts # GET, POST wishlist
│   ├── blogs/
│   │   ├── route.ts              # GET list, POST create
│   │   └── [slug]/route.ts       # GET single post
│   └── orders/
│       └── route.ts              # GET, POST orders
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx            # Top navigation bar
│   │   └── Footer.tsx            # Footer with links
│   ├── home/
│   │   ├── HeroCarousel.tsx      # Homepage hero slider
│   │   ├── FeaturedArtists.tsx   # Artist carousel
│   │   ├── ArtworkSection.tsx    # Artwork grid section
│   │   ├── YouTubeSection.tsx    # YouTube video cards
│   │   ├── CategorySection.tsx   # Browse by category
│   │   └── ValueProps.tsx        # Trust signals
│   └── ui/
│       └── ArtworkCard.tsx       # Reusable artwork card
│
├── models/                       # MongoDB Mongoose schemas
│   ├── User.ts
│   ├── Artwork.ts
│   ├── Blog.ts
│   └── Order.ts
│
├── lib/
│   └── db.ts                     # MongoDB connection
│
├── scripts/
│   └── seed.ts                   # Database seeder
│
├── .env.local                    # Your environment variables
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## 4. Getting Started

### Step 1 — Install Node.js
Download from https://nodejs.org (version 18 or higher)

### Step 2 — Install dependencies
```bash
cd /workspaces/unBoxArt
npm install
```

### Step 3 — Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### Step 4 — Start MongoDB
```bash
# Option A: Local MongoDB
mongod

# Option B: MongoDB Atlas (cloud) — recommended
# Sign up at https://cloud.mongodb.com
# Create free cluster → get connection string → paste in MONGODB_URI
```

### Step 5 — Seed sample data
```bash
npx ts-node scripts/seed.ts
```

### Step 6 — Run the app
```bash
npm run dev
# Open http://localhost:3000
```

---

## 5. Environment Variables

Create a `.env.local` file with these values:

```env
# ── Required ──────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/unboxarts
# OR for Atlas:
# MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/unboxarts

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=paste-any-random-32-character-string-here
# Generate one: openssl rand -base64 32

# ── Image Upload (Cloudinary) ──────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Payments ───────────────────────────────────────
# For Indian payments (recommended):
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# For international payments:
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx

# ── OAuth (optional) ──────────────────────────────
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_secret

FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_secret

# ── App ────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 6. Database Setup

### MongoDB Atlas (Recommended — Free Cloud DB)

1. Go to https://cloud.mongodb.com
2. Click **"Try Free"** → create account
3. Choose **M0 Free** tier → click Create
4. Under **Security → Database Access**: Add a user with username + password
5. Under **Security → Network Access**: Add IP `0.0.0.0/0` (allow all)
6. Click **Connect** → **Drivers** → copy the URI
7. Paste into `.env.local`:
   ```
   MONGODB_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/unboxarts
   ```

### Seed the database
```bash
npx ts-node scripts/seed.ts
```
Creates:
- 4 artist accounts
- 9 artworks with full details
- 6 blog posts
- 1 buyer test account

**Test login after seeding:**
- Artist: `dinkar@unboxarts.com` / `password123`
- Buyer: `buyer@unboxarts.com` / `password123`

---

## 7. Pages & Routes

| URL | Page | Description |
|-----|------|-------------|
| `/` | Home | Hero, featured artists, artwork sections |
| `/art-gallery` | Gallery | All artworks with filters |
| `/artwork/[id]` | Product Detail | Full artwork page with buy options |
| `/artists` | Artists | Directory of all artists |
| `/artists/[id]` | Artist Profile | Bio + portfolio |
| `/auth/signin` | Sign In | Login form |
| `/auth/signup` | Sign Up | Registration form |
| `/cart` | Cart | Shopping cart |
| `/checkout` | Checkout | Address + payment |
| `/dashboard` | Dashboard | User account management |
| `/blog` | Blog | Article listing |
| `/contact` | Contact | Contact form |

---

## 8. API Reference

### Authentication
```
POST /api/auth/register    Create new account
POST /api/auth/login       Sign in
```

### Artworks
```
GET  /api/artworks                    List artworks (with filters)
POST /api/artworks                    Create artwork (artist only)
GET  /api/artworks/[id]               Get single artwork
PATCH /api/artworks/[id]              Update artwork
DELETE /api/artworks/[id]             Delete artwork
POST /api/artworks/[id]/like          Like artwork
POST /api/artworks/[id]/reviews       Add review
```

**Artwork query parameters:**
```
?medium=acrylic
?subject=landscape
?style=abstract
?collection=curators-picks
?sort=newest|popular|price-asc|price-desc
?minPrice=10000&maxPrice=50000
?page=1&limit=12
?q=search+term
```

### Users
```
GET  /api/users              List artists
GET  /api/users/[id]         Get profile + artworks
PATCH /api/users/[id]        Update profile
GET  /api/users/[id]/wishlist   Get wishlist
POST /api/users/[id]/wishlist   Toggle wishlist item
```

### Orders
```
GET  /api/orders?buyerId=xxx   Get buyer's orders
POST /api/orders               Create order
```

### Blogs
```
GET  /api/blogs              List blog posts
POST /api/blogs              Create post
GET  /api/blogs/[slug]       Get single post
```

---

## 9. Components

### ArtworkCard
```tsx
<ArtworkCard
  id="1"
  title="Painting Title"
  artistName="Dinkar Jadav"
  medium="Acrylic On Canvas"
  dimensions='36"×36"'
  price={160000}
  image="https://..."
  likes={123}
  views={456}
  comments={12}
  rating={4.3}
/>
```

### ArtworkSection (homepage sections)
```tsx
<ArtworkSection
  title="Curators' Picks"
  viewAllHref="/art-gallery?collection=curators-picks"
  artworks={artworksArray}
  columns={3}
/>
```

### HeroCarousel
Auto-plays slides every 5.5 seconds. Edit the `slides` array in `HeroCarousel.tsx` to change images and text.

---

## 10. Database Models

### User
```
name, email, password, role (artist|buyer),
profileImage, bio, location, socialLinks,
membershipTier (free|silver|gold|platinum),
wishlist[], followers[], totalSales, rating, isVerified
```

### Artwork
```
title, code, description, images[], artist (ref User),
medium, subject, style, color[], dimensions,
originalPrice, digitalPrintPrice, shippingCost,
stock, isAvailable, isFeatured, isCuratorsPick, isTrending,
likes, views, reviews[], avgRating, reviewCount
```

### Order
```
orderNumber, buyer (ref User), items[],
shippingAddress, subtotal, shippingCost, total,
paymentMethod, paymentStatus, orderStatus, trackingNumber
```

### Blog
```
title, slug, coverImage, content, excerpt,
author (ref User), tags[], isPublished, views
```

---

## 11. Making It a Fully Functioning Website

### Step 1 — Real Images (Cloudinary)

1. Sign up at https://cloudinary.com (free tier: 25GB)
2. Get your Cloud Name, API Key, API Secret
3. Add to `.env.local`
4. Install: `npm install cloudinary`
5. Create upload API route:

```ts
// app/api/upload/route.ts
import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve) => {
    cloudinary.uploader.upload_stream(
      { folder: 'unboxarts' },
      (error, result) => {
        if (error) resolve(NextResponse.json({ error }, { status: 500 }));
        else resolve(NextResponse.json({ url: result?.secure_url }));
      }
    ).end(buffer);
  });
}
```

### Step 2 — Real Payments (Razorpay — best for India)

1. Sign up at https://razorpay.com
2. Get Test API keys from Dashboard → Settings → API Keys
3. Install: `npm install razorpay`
4. Create order API:

```ts
// app/api/payment/create-order/route.ts
import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const { amount } = await req.json();
  const order = await razorpay.orders.create({
    amount: amount * 100, // paise
    currency: 'INR',
  });
  return NextResponse.json(order);
}
```

### Step 3 — Real Authentication (Session-based)

Currently login returns user data but doesn't create a session. To add sessions:

1. Install: `npm install iron-session`
2. Wrap your login route to set a cookie
3. Create a middleware to protect dashboard routes

```ts
// lib/session.ts
import { SessionOptions } from 'iron-session';

export const sessionOptions: SessionOptions = {
  password: process.env.NEXTAUTH_SECRET!,
  cookieName: 'unboxarts-session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production' },
};

declare module 'iron-session' {
  interface IronSessionData {
    user?: { id: string; name: string; email: string; role: string };
  }
}
```

### Step 4 — Email Notifications

1. Sign up at https://resend.com (free: 3000 emails/month)
2. Install: `npm install resend`
3. Send emails on order, registration, etc.

```ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'orders@unboxarts.com',
  to: buyerEmail,
  subject: 'Order Confirmed — Unboxarts',
  html: '<p>Your order has been placed!</p>',
});
```

---

## 12. Adding Real Images

Replace placeholder images in these files:

### Homepage Hero (`components/home/HeroCarousel.tsx`)
```ts
const slides = [
  {
    image: 'YOUR_CLOUDINARY_URL_HERE',  // ← replace this
    title: 'BUY AND SELL ART\nWITH 0% COMMISSION',
    ...
  }
];
```

### Artwork Data
Upload via dashboard → images get stored in MongoDB as Cloudinary URLs.

### Artist Photos
Stored in MongoDB `profileImage` field → uploaded via dashboard.

---

## 13. Payment Integration

### Razorpay (Recommended for India)

Add to your checkout page:
```tsx
const handlePayment = async () => {
  // 1. Create order on server
  const res = await fetch('/api/payment/create-order', {
    method: 'POST',
    body: JSON.stringify({ amount: total }),
  });
  const order = await res.json();

  // 2. Open Razorpay
  const rzp = new (window as any).Razorpay({
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
    order_id: order.id,
    amount: order.amount,
    currency: 'INR',
    name: 'Unboxarts',
    handler: async (response: any) => {
      // 3. Verify payment on server
      await fetch('/api/payment/verify', {
        method: 'POST',
        body: JSON.stringify(response),
      });
      router.push('/orders/success');
    },
  });
  rzp.open();
};
```

Add Razorpay script to `app/layout.tsx`:
```tsx
<script src="https://checkout.razorpay.com/v1/checkout.js" />
```

---

## 14. Authentication Setup

### Current State
- `/api/auth/register` — creates accounts in MongoDB ✅
- `/api/auth/login` — validates credentials ✅
- No session persistence yet ❌

### To Add Sessions (iron-session)
```bash
npm install iron-session
```

Then update login route to set encrypted cookie, and create a `/api/auth/me` route to check session.

### Google OAuth (optional)
1. Go to https://console.cloud.google.com
2. Create project → APIs → OAuth 2.0 Credentials
3. Authorised redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. Add Client ID + Secret to `.env.local`

---

## 15. Deployment Guide

### Deploy to Vercel (Recommended — Free)

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial Unboxarts"
git remote add origin https://github.com/YOUR_USERNAME/unboxarts.git
git push -u origin main
```

2. Go to https://vercel.com → Import GitHub repo
3. Add all environment variables from `.env.local`
4. Click Deploy → your site is live in ~2 minutes

### Custom Domain
1. Buy domain at GoDaddy / Namecheap / Google Domains
2. In Vercel → Project → Domains → Add domain
3. Update DNS records as shown by Vercel
4. SSL certificate is automatic

### Production Checklist
- [ ] MongoDB Atlas cluster (not localhost)
- [ ] All env variables set in Vercel dashboard
- [ ] NEXTAUTH_URL updated to production URL
- [ ] Cloudinary set up for image uploads
- [ ] Razorpay live keys (after KYC approval)
- [ ] Custom domain configured
- [ ] Google Search Console connected

---

## 16. Common Issues & Fixes

### "Couldn't find a pages directory"
**Cause:** Next.js version too old or app folder missing
**Fix:** `npm install next@14.2.0 react@18.3.0 react-dom@18.3.0`

### Images not loading
**Cause:** Unsplash blocked in Codespace / no real images yet
**Fix:** Use Cloudinary or local images in `/public/images/`

### MongoDB connection error
**Cause:** Wrong URI or IP not whitelisted
**Fix:** Check MONGODB_URI in .env.local, whitelist your IP in Atlas

### "Module not found: @/"
**Cause:** tsconfig paths not set
**Fix:** Ensure tsconfig.json has `"paths": { "@/*": ["./*"] }`

### Auth not persisting
**Cause:** No session management yet
**Fix:** Install iron-session, see Section 14

### Build fails on Vercel
**Cause:** Missing env variables
**Fix:** Add all .env.local variables to Vercel dashboard → Settings → Environment Variables

---

## Membership Plans

| Plan | Price | Features |
|------|-------|----------|
| Free | ₹0/month | 10 artworks, basic visibility |
| Silver | ₹25/month | 50 artworks, payment receipts |
| Gold | ₹59/month | 100 artworks, advanced analytics, trending badge |
| Platinum | ₹125/month | Unlimited, expert consultation, priority support |

---

## Support

- Email: support@unboxarts.com
- Built by DigiBloom.in
