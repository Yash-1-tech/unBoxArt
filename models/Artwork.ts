import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview {
  user: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface IArtwork extends Document {
  title: string;
  code: string;
  description?: string;
  images: string[];
  artist: mongoose.Types.ObjectId;
  medium: string;
  subject?: string;
  style?: string;
  color?: string[];
  dimensions: {
    width: number;
    height: number;
    unit: 'in' | 'cm';
  };
  originalPrice: number;
  digitalPrintPrice?: number;
  shippingCost: number;
  stock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  isCuratorsPick: boolean;
  isTrending: boolean;
  category?: string;
  tags?: string[];
  likes: number;
  views: number;
  reviews: IReview[];
  avgRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const ArtworkSchema = new Schema<IArtwork>(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    images: [{ type: String, required: true }],
    artist: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    medium: { type: String, required: true },
    subject: { type: String },
    style: { type: String },
    color: [{ type: String }],
    dimensions: {
      width: { type: Number, required: true },
      height: { type: Number, required: true },
      unit: { type: String, enum: ['in', 'cm'], default: 'in' },
    },
    originalPrice: { type: Number, required: true },
    digitalPrintPrice: { type: Number },
    shippingCost: { type: Number, default: 50 },
    stock: { type: Number, default: 1 },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isCuratorsPick: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    category: { type: String },
    tags: [{ type: String }],
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    reviews: [ReviewSchema],
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ArtworkSchema.pre('save', function (next) {
  if (this.reviews && this.reviews.length > 0) {
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.avgRating = Math.round((total / this.reviews.length) * 10) / 10;
    this.reviewCount = this.reviews.length;
  }
  next();
});

const Artwork: Model<IArtwork> =
  mongoose.models.Artwork || mongoose.model<IArtwork>('Artwork', ArtworkSchema);

export default Artwork;
