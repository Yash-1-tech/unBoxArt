import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'artist' | 'buyer';
  profileImage?: string;
  bio?: string;
  location?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    website?: string;
  };
  membershipTier: 'free' | 'silver' | 'gold' | 'platinum';
  wishlist: mongoose.Types.ObjectId[];
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  totalSales?: number;
  rating?: number;
  reviewCount?: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false },
    role: { type: String, enum: ['artist', 'buyer'], default: 'buyer' },
    profileImage: { type: String },
    bio: { type: String, maxlength: 1000 },
    location: { type: String },
    socialLinks: {
      instagram: String,
      facebook: String,
      twitter: String,
      youtube: String,
      website: String,
    },
    membershipTier: {
      type: String,
      enum: ['free', 'silver', 'gold', 'platinum'],
      default: 'free',
    },
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Artwork' }],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    totalSales: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
