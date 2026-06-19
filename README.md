# Unboxarts — Art Marketplace

India's largest art portal. Buy and sell original paintings and digital prints with **0% commission**.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Playfair Display / DM Sans fonts
- **Database:** MongoDB with Mongoose ODM
- **Auth:** NextAuth.js (Google, Facebook, Apple OAuth)
- **Images:** Cloudinary
- **Payments:** Stripe + PayPal + UPI

---

## Project Structure

```
unboxarts/
├── app/
│   ├── layout.tsx              # Global layout (Navbar + Footer)
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles + design tokens
│   ├── art-gallery/
│   │   └── page.tsx            # Gallery/Listing page with filters
│   ├── artwork/[id]/
│   │   └── page.tsx            # Product details page
│   ├── artists/
│   │   ├── page.tsx            # Artists directory (A-Z)
│   │   └── [id]/page.tsx       # Artist profile + portfolio
│   ├── blog/
│   │   └── page.tsx            # Blog listing
│   ├── dashboard/
│   │   └── page.tsx            # Buyer/Artist dashboard
│   ├── auth/
│   │   ├── signin/page.tsx     # Sign In
│   │   └── signup/page.tsx     # Sign Up
│   └── contact/
│       └── page.tsx            # Contact page
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx          # Sticky nav with mega-menu + search
│   │   └── Footer.tsx          # Multi-column footer
│   ├── home/
│   │   ├── HeroCarousel.tsx    # Auto-playing hero slider
│   │   ├── FeaturedArtists.tsx # Horizontal artist carousel
│   │   ├── ArtworkSection.tsx  # Reusable section grid
│   │   ├── YouTubeSection.tsx  # YouTube video cards
│   │   ├── CategorySection.tsx # Browse by category
│   │   └── ValueProps.tsx      # Trust signals row
│   └── ui/
│       └── ArtworkCard.tsx     # Reusable artwork card
├── models/
│   ├── User.ts                 # Mongoose User schema
│   ├── Artwork.ts              # Mongoose Artwork schema
│   └── Blog.ts                 # Mongoose Blog schema
├── lib/
│   └── db.ts                   # MongoDB connection utility
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
└── .env.example
```

---

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd unboxarts
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
# Fill in your credentials
```

### 3. Run Dev Server

```bash
npm run dev
# Open http://localhost:3000
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home with hero, featured artists, curators picks, trendy, affordable, YouTube |
| `/art-gallery` | Masonry grid gallery with filter toolbar |
| `/artwork/[id]` | Product detail with image zoom, checkout, recommendations |
| `/artists` | A-Z artist directory with 6-col grid |
| `/artists/[id]` | Artist profile with bio and masonry portfolio |
| `/blog` | Blog listing in 3-col grid |
| `/dashboard` | Full buyer/artist dashboard with sidebar |
| `/auth/signin` | Sign in modal/page |
| `/auth/signup` | Sign up modal/page |
| `/contact` | Contact page |

---

## Design System

- **Primary Color:** `#e63329` (Unboxarts Red)
- **Fonts:** Playfair Display (headings) + DM Sans (body)
- **Aesthetic:** Clean white minimalist — artwork takes center stage
- **Grid:** CSS columns (masonry) for organic gallery feel

---

## Database Models

### User
Fields: name, email, password, role (artist|buyer), profileImage, bio, location, socialLinks, membershipTier (free|silver|gold|platinum), wishlist, followers, following, rating, isVerified

### Artwork
Fields: title, code, description, images[], artist (ref), medium, subject, style, color[], dimensions, originalPrice, digitalPrintPrice, shippingCost, stock, isAvailable, isFeatured, isCuratorsPick, isTrending, likes, views, reviews[], avgRating

### Blog
Fields: title, slug, coverImage, content, excerpt, author (ref), tags[], isPublished, views

---

## Membership Plans

| Plan | Price | Artworks |
|------|-------|----------|
| Free | ₹0/mo | Up to 10 |
| Silver | ₹25/mo | Up to 50 |
| Gold | ₹59/mo | Up to 100 + Advanced Analytics |
| Platinum | ₹125/mo | Unlimited + Expert Consultation |

---

