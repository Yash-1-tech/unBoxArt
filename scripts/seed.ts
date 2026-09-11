/**
 * MongoDB Seed Script for Unboxarts
 * Run: npx ts-node scripts/seed.ts
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unboxarts';

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['artist', 'buyer'], default: 'buyer' },
  profileImage: String,
  bio: String,
  location: String,
  socialLinks: { instagram: String, facebook: String, twitter: String, youtube: String, website: String },
  membershipTier: { type: String, enum: ['free', 'silver', 'gold', 'platinum'], default: 'free' },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalSales: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

const ArtworkSchema = new mongoose.Schema({
  title: String,
  code: { type: String, unique: true },
  description: String,
  images: [String],
  artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  medium: String,
  subject: String,
  style: String,
  color: [String],
  dimensions: { width: Number, height: Number, unit: { type: String, default: 'in' } },
  originalPrice: Number,
  digitalPrintPrice: Number,
  shippingCost: { type: Number, default: 50 },
  stock: { type: Number, default: 1 },
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isCuratorsPick: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  category: String,
  tags: [String],
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  reviews: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, rating: Number, comment: String, createdAt: { type: Date, default: Date.now } }],
  avgRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

const BlogSchema = new mongoose.Schema({
  title: String,
  slug: { type: String, unique: true },
  coverImage: String,
  content: String,
  excerpt: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [String],
  isPublished: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Artwork = mongoose.models.Artwork || mongoose.model('Artwork', ArtworkSchema);
const Blog = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  await Promise.all([User.deleteMany({}), Artwork.deleteMany({}), Blog.deleteMany({})]);
  console.log('🗑️  Cleared collections');

  const hashedPassword = await bcrypt.hash('password123', 12);

  const users = await User.insertMany([
    {
      name: 'Dinkar Jadav', email: 'dinkar@unboxarts.com', password: hashedPassword,
      role: 'artist', profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      bio: 'Contemporary Indian artist based in Mumbai. Specializes in acrylic and mixed media works exploring urban landscapes and spiritual themes.',
      location: 'Mumbai, India', socialLinks: { instagram: 'https://instagram.com/dinkartjadav' },
      membershipTier: 'gold', totalSales: 124, rating: 4.8, reviewCount: 89, isVerified: true,
    },
    {
      name: 'David Farrés Calvo', email: 'david@unboxarts.com', password: hashedPassword,
      role: 'artist', profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
      bio: 'Spanish painter from Badalona (Barcelona). Works primarily in oil and watercolor with expressionist influences.',
      location: 'Badalona, Barcelona, Spain',
      membershipTier: 'platinum', totalSales: 203, rating: 4.9, reviewCount: 156, isVerified: true,
    },
    {
      name: 'Priya Sharma', email: 'priya@unboxarts.com', password: hashedPassword,
      role: 'artist', profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
      bio: 'Delhi-based watercolor artist. Known for delicate floral studies and portraits.',
      location: 'Delhi, India', membershipTier: 'silver', totalSales: 98, rating: 4.6, isVerified: true,
    },
    {
      name: 'Anjali Nair', email: 'anjali@unboxarts.com', password: hashedPassword,
      role: 'artist', profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
      bio: 'Kochi-based artist working with acrylic and mixed media. Inspired by the backwaters and folk traditions of Kerala.',
      location: 'Kochi, Kerala, India', membershipTier: 'gold', totalSales: 156, rating: 4.7, isVerified: true,
    },
    {
      name: 'Test Buyer', email: 'buyer@unboxarts.com', password: hashedPassword,
      role: 'buyer', location: 'Pune, India', membershipTier: 'free',
    },
  ]);

  const [dinkar, david, priya, anjali, buyer] = users;
  console.log(`👤 Created ${users.length} users`);

  const artworks = await Artwork.insertMany([
    {
      title: 'Om Mandala — Sacred Geometry', code: 'HF-4380001',
      description: 'A meditative exploration of sacred geometry combining the ancient Om symbol with intricate mandala patterns in warm earth tones and gold accents.',
      images: ['https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=900&q=85'],
      artist: dinkar._id, medium: 'Acrylic On Canvas', subject: 'Religion', style: 'Contemporary',
      color: ['Gold', 'Brown', 'Ochre'], dimensions: { width: 36, height: 36, unit: 'in' },
      originalPrice: 160000, digitalPrintPrice: 4999, shippingCost: 50,
      isAvailable: true, isFeatured: true, isCuratorsPick: true, isTrending: true,
      tags: ['mandala', 'om', 'sacred', 'spiritual'], likes: 234, views: 1890, avgRating: 4.8, reviewCount: 23,
    },
    {
      title: 'Urban Chaos — Mumbai at Midnight', code: 'HF-4380002',
      description: 'An explosive abstract expressionist take on the relentless energy of Mumbai\'s nighttime streets.',
      images: ['https://images.unsplash.com/photo-1549887534-1541e9326688?w=900&q=85'],
      artist: dinkar._id, medium: 'Acrylic On Canvas', subject: 'Cityscape', style: 'Abstract Expressionism',
      color: ['Blue', 'Yellow', 'Black'], dimensions: { width: 48, height: 36, unit: 'in' },
      originalPrice: 225000, digitalPrintPrice: 5999, shippingCost: 50,
      isAvailable: true, isFeatured: true, isTrending: true,
      tags: ['mumbai', 'urban', 'abstract', 'cityscape'], likes: 312, views: 2450, avgRating: 4.9, reviewCount: 31,
    },
    {
      title: 'Folklore — The Village Dance', code: 'HF-4380003',
      description: 'Vibrant depiction of a traditional Indian village festival dance.',
      images: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900&q=85'],
      artist: dinkar._id, medium: 'Acrylic On Canvas', subject: 'Figure', style: 'Folk Art',
      color: ['Red', 'Yellow', 'Green'], dimensions: { width: 30, height: 24, unit: 'in' },
      originalPrice: 95000, digitalPrintPrice: 3499, shippingCost: 50,
      isAvailable: true, isCuratorsPick: true,
      tags: ['folk', 'dance', 'village', 'india'], likes: 189, views: 1340, avgRating: 4.7, reviewCount: 18,
    },
    {
      title: 'Mediterranean Dusk — Geometric Study', code: 'HF-4380004',
      description: 'A bold geometric abstraction inspired by the warm tones of a Mediterranean sunset.',
      images: ['https://images.unsplash.com/photo-1463453091185-61582044d556?w=900&q=85'],
      artist: david._id, medium: 'Oil On Canvas', subject: 'Abstract', style: 'Geometric Abstraction',
      color: ['Red', 'Blue', 'Orange', 'Black'], dimensions: { width: 40, height: 40, unit: 'in' },
      originalPrice: 280000, digitalPrintPrice: 6999, shippingCost: 80,
      isAvailable: true, isFeatured: true, isCuratorsPick: true,
      tags: ['geometric', 'abstract', 'oil', 'mediterranean'], likes: 445, views: 3210, avgRating: 4.9, reviewCount: 47,
    },
    {
      title: 'Catalan Landscape No. 7', code: 'HF-4380005',
      description: 'Seventh in the ongoing Catalan Landscape series — rolling hills and olive groves.',
      images: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=900&q=85'],
      artist: david._id, medium: 'Oil On Canvas', subject: 'Landscape', style: 'Contemporary Realism',
      color: ['Ochre', 'Blue', 'Green'], dimensions: { width: 36, height: 24, unit: 'in' },
      originalPrice: 195000, digitalPrintPrice: 5499, shippingCost: 80,
      isAvailable: true, isTrending: true,
      tags: ['landscape', 'catalan', 'oil'], likes: 267, views: 2100, avgRating: 4.8, reviewCount: 29,
    },
    {
      title: 'Monsoon Bloom', code: 'HF-4380006',
      description: 'Delicate watercolor study of jasmine and marigold blooming after the first monsoon rain.',
      images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=85'],
      artist: priya._id, medium: 'Watercolor On Paper', subject: 'Floral', style: 'Impressionist',
      color: ['White', 'Yellow', 'Green', 'Pink'], dimensions: { width: 18, height: 24, unit: 'in' },
      originalPrice: 35000, digitalPrintPrice: 1999, shippingCost: 30,
      isAvailable: true, isCuratorsPick: true,
      tags: ['watercolor', 'flowers', 'monsoon'], likes: 143, views: 980, avgRating: 4.6, reviewCount: 16,
    },
    {
      title: 'Portrait of Radha', code: 'HF-4380007',
      description: 'A serene portrait of Radha rendered in soft watercolor washes with fine ink detailing.',
      images: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&q=85'],
      artist: priya._id, medium: 'Watercolor & Ink', subject: 'Portrait', style: 'Traditional Contemporary',
      color: ['Blue', 'Gold', 'White'], dimensions: { width: 12, height: 16, unit: 'in' },
      originalPrice: 28000, digitalPrintPrice: 1499, shippingCost: 25,
      isAvailable: true,
      tags: ['portrait', 'radha', 'watercolor', 'spiritual'], likes: 98, views: 756, avgRating: 4.7, reviewCount: 12,
    },
    {
      title: 'Backwaters at Dawn', code: 'HF-4380008',
      description: 'The stillness of Kerala\'s backwaters at the break of dawn — golden light filtering through coconut palms.',
      images: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=900&q=85'],
      artist: anjali._id, medium: 'Acrylic On Canvas', subject: 'Landscape', style: 'Contemporary',
      color: ['Gold', 'Green', 'Blue'], dimensions: { width: 30, height: 20, unit: 'in' },
      originalPrice: 85000, digitalPrintPrice: 2999, shippingCost: 50,
      isAvailable: true, isFeatured: true, isTrending: true,
      tags: ['kerala', 'backwaters', 'dawn', 'landscape'], likes: 198, views: 1560, avgRating: 4.8, reviewCount: 21,
    },
    {
      title: 'Kathakali — The Divine Dance', code: 'HF-4380009',
      description: 'An expressive portrait of a Kathakali dancer mid-performance.',
      images: ['https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&q=85'],
      artist: anjali._id, medium: 'Acrylic On Canvas', subject: 'Figure', style: 'Expressionism',
      color: ['Green', 'Red', 'Gold', 'Black'], dimensions: { width: 24, height: 30, unit: 'in' },
      originalPrice: 120000, digitalPrintPrice: 3999, shippingCost: 50,
      isAvailable: true, isCuratorsPick: true,
      tags: ['kathakali', 'dance', 'kerala', 'expressionism'], likes: 276, views: 2100, avgRating: 4.9, reviewCount: 34,
    },
  ]);

  console.log(`🎨 Created ${artworks.length} artworks`);

  const blogs = await Blog.insertMany([
    { title: 'How to Choose Your First Original Painting', slug: 'how-to-choose-first-original-painting', coverImage: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80', excerpt: 'Buying your first original artwork is a milestone. Here\'s everything you need to know.', content: '<h2>Introduction</h2><p>Buying your first original artwork is a meaningful step...</p>', author: dinkar._id, tags: ['buying guide', 'collecting'], isPublished: true, views: 1240 },
    { title: 'The Story Behind Sacred Geometry in Indian Art', slug: 'sacred-geometry-indian-art', coverImage: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80', excerpt: 'From ancient temple carvings to modern canvas — how sacred geometry inspires artists today.', content: '<h2>Origins</h2><p>Sacred geometry has been at the heart of Indian visual culture for millennia...</p>', author: dinkar._id, tags: ['sacred geometry', 'indian art'], isPublished: true, views: 890 },
    { title: '0% Commission: Why We Built Unboxarts', slug: '0-commission-why-we-built-unboxarts', coverImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80', excerpt: 'The art market has long been tilted against independent artists. We set out to change that.', content: '<h2>The Problem</h2><p>For too long, art platforms have taken enormous cuts from artists\' sales...</p>', author: buyer._id, tags: ['unboxarts', 'mission'], isPublished: true, views: 2140 },
    { title: 'Caring for Your Acrylic Painting', slug: 'caring-for-acrylic-painting-guide', coverImage: 'https://images.unsplash.com/photo-1549887534-1541e9326688?w=800&q=80', excerpt: 'You\'ve invested in a beautiful original painting. Now let\'s make sure it lasts a lifetime.', content: '<h2>Cleaning</h2><p>Acrylic paintings are relatively hardy, but proper care ensures they remain vibrant...</p>', author: priya._id, tags: ['art care', 'acrylic'], isPublished: true, views: 678 },
    { title: 'Meet the Artist: David Farrés Calvo', slug: 'meet-artist-david-farres-calvo', coverImage: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=800&q=80', excerpt: 'From the sun-drenched coast of Catalonia, David brings a bold geometric vision to Unboxarts.', content: '<h2>Early Life</h2><p>Born and raised in Badalona on the Mediterranean coast...</p>', author: david._id, tags: ['artist spotlight', 'david farres'], isPublished: true, views: 1560 },
    { title: 'Understanding Digital Prints vs Original Paintings', slug: 'digital-prints-vs-original-paintings', coverImage: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&q=80', excerpt: 'Which should you buy? We break down the differences in value, investment potential, and display quality.', content: '<h2>What is a Digital Print?</h2><p>A digital print is a high-resolution reproduction...</p>', author: anjali._id, tags: ['digital prints', 'collecting'], isPublished: true, views: 945 },
  ]);

  console.log(`📝 Created ${blogs.length} blog posts`);

  await User.findByIdAndUpdate(buyer._id, {
    $push: { wishlist: { $each: [artworks[0]._id, artworks[3]._id, artworks[7]._id] } },
  });

  console.log('\n🌱 ─── SEED COMPLETE ───');
  console.log(`👤 Users:    ${await User.countDocuments()}`);
  console.log(`🎨 Artworks: ${await Artwork.countDocuments()}`);
  console.log(`📝 Blogs:    ${await Blog.countDocuments()}`);
  console.log('\n📧 Test Credentials:');
  console.log('   Artist:  dinkar@unboxarts.com / password123');
  console.log('   Artist:  david@unboxarts.com  / password123');
  console.log('   Buyer:   buyer@unboxarts.com  / password123');
  console.log('─────────────────────────────\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
