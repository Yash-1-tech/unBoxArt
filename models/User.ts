
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

const nonNegativeNumber = {
  validator: (value: number) =>
    Number.isFinite(value) && value >= 0,
  message: 'Value must be a valid non-negative number',
};

const nonNegativeInteger = {
  validator: (value: number) =>
    Number.isSafeInteger(value) && value >= 0,
  message: 'Value must be a non-negative integer',
};

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    password: {
      type: String,
      select: false,
    },

    role: {
      type: String,
      enum: ['artist', 'buyer'],
      default: 'buyer',
      required: true,
    },

    profileImage: {
      type: String,
      trim: true,
      maxlength: 2048,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    location: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    socialLinks: {
      instagram: {
        type: String,
        trim: true,
        maxlength: 500,
      },

      facebook: {
        type: String,
        trim: true,
        maxlength: 500,
      },

      twitter: {
        type: String,
        trim: true,
        maxlength: 500,
      },

      youtube: {
        type: String,
        trim: true,
        maxlength: 500,
      },

      website: {
        type: String,
        trim: true,
        maxlength: 500,
      },
    },

    membershipTier: {
      type: String,
      enum: ['free', 'silver', 'gold', 'platinum'],
      default: 'free',
      required: true,
    },

    wishlist: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Artwork',
        },
      ],
      default: [],
    },

    followers: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      default: [],
    },

    following: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      default: [],
    },

    totalSales: {
      type: Number,
      default: 0,
      min: 0,
      validate: nonNegativeNumber,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      validate: {
        validator: (value: number) =>
          Number.isFinite(value) &&
          value >= 0 &&
          value <= 5,
        message: 'Rating must be between 0 and 5',
      },
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
      validate: nonNegativeInteger,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>('User', UserSchema);

export default User;
