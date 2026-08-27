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

Here's everything added in this conversation, from first message to now:

---

## Project built from scratch

### Foundation
- Full Next.js 14 project with App Router, TypeScript, Tailwind CSS
- MongoDB connection utility with hot-reload caching
- 4 Mongoose models — User, Artwork, Blog, Order
- Global layout with Navbar and Footer
- Design system — Inter font, brand red `#e63329`, all utility classes

### Pages built (10 total)
| Page | Route |
|------|-------|
| Home | `/` |
| Art Gallery | `/art-gallery` |
| Artwork Detail | `/artwork/[id]` |
| Artists Directory | `/artists` |
| Artist Profile | `/artists/[id]` |
| Sign In | `/auth/signin` |
| Sign Up | `/auth/signup` |
| Dashboard | `/dashboard` |
| Blog | `/blog` |
| Contact | `/contact` |

### API routes (15 total)
- `POST /api/auth/register` — create account with bcrypt
- `POST /api/auth/login` — validate credentials
- `GET/POST /api/artworks` — list with filters, create
- `GET/PATCH/DELETE /api/artworks/[id]` — single artwork CRUD
- `POST /api/artworks/[id]/like` — like counter
- `POST /api/artworks/[id]/reviews` — add review
- `GET /api/users` — list artists
- `GET/PATCH /api/users/[id]` — profile + artworks
- `GET/POST /api/users/[id]/wishlist` — toggle wishlist
- `GET/POST /api/blogs` — list and create
- `GET /api/blogs/[slug]` — single post
- `GET/POST /api/orders` — order list and creation
- `POST /api/upload` — Cloudinary image upload

### Components
- `Navbar` — sticky, mega menu, search overlay, mobile menu
- `Footer` — payment logos, Instagram grid, follow icons, 7-column links
- `HeroCarousel` — auto-playing with dots and arrows
- `FeaturedArtists` — horizontal scroll with ratings
- `ArtworkSection` — self-fetching, used for all homepage sections
- `ArtworkCard` — with image error fallback emoji placeholder
- `ValueProps` — 4 trust signals
- `YouTubeSection` — video thumbnail cards
- `CategorySection` — browse by category grid

### New pages added mid-conversation
- `/cart` — remove items, order summary, proceed to checkout
- `/checkout` — address form, payment method selector
- `/dashboard/upload` — Pinterest-style drag and drop image upload form

### Database
- Full seed script with 4 artists, 9 artworks, 6 blogs, test accounts

---

## Bugs fixed during the session

| Error | Fix |
|-------|-----|
| Next.js 9 installed | Upgraded to 14.2.0 |
| `pages` directory not found | Project structure was flat, Python script rebuilt it |
| `@apply group` CSS error | Removed `group` from `@apply` |
| `Export Pinterest doesn't exist` | Removed Pinterest from lucide import, replaced with inline SVG |
| `nextConfig is not defined` | Rewrote next.config.js after terminal corruption |
| MongoDB IP whitelist error | Set Atlas to allow `0.0.0.0/0` for Codespace |
| Git history 628MB bloat | Deleted `.git`, reinitialised clean repo, pushed 169KB |
| Font not loading | Replaced `next/font/google` with standard `<link>` tag |
| `globals.css @apply group` error | Cleaned up all invalid `@apply` directives |

---

## Infrastructure

- `.gitignore` — correctly excludes `.next`, `node_modules`, `.env.local`
- `.env.example` — all variables documented
- `.devcontainer/devcontainer.json` — auto `npm install` for new Codespace contributors
- `DOCUMENTATION.md` — 659 lines covering every route, model, deployment, and integration guide
- `write_files.py` — portable script to rebuild entire project structure from scratch

---

## What's still to do

| Priority | Feature |
|----------|---------|
| 🔴 High | Auth sessions — login doesn't persist between pages yet |
| 🔴 High | Route protection — dashboard accessible without login |
| 🔴 High | Payment gateway — Razorpay or Stripe |
| 🟡 Medium | Cart state — connect Add to Cart button to cart page |
| 🟡 Medium | Checkout submits real order to MongoDB |
| 🟡 Medium | Seller order dashboard |
| 🟢 Low | Google OAuth end-to-end |
| 🟢 Low | Email notifications via Resend |
| 🟢 Low | Search wired to API |
| 🟢 Low | Deploy to Vercel |

---

