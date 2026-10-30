
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

const nonNegativeNumber = {
  validator: (value: number) =>
    Number.isFinite(value) && value >= 0,
  message: 'Value must be a valid non-negative number',
};

const positiveNumber = {
  validator: (value: number) =>
    Number.isFinite(value) && value > 0,
  message: 'Value must be a valid positive number',
};

const nonNegativeInteger = {
  validator: (value: number) =>
    Number.isSafeInteger(value) && value >= 0,
  message: 'Value must be a non-negative integer',
};

const ReviewSchema = new Schema<IReview>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: (value: number) =>
        Number.isInteger(value) && value >= 1 && value <= 5,
      message: 'Rating must be an integer between 1 and 5',
    },
  },

  comment: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: '',
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ArtworkSchema = new Schema<IArtwork>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 80,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
    },

    images: {
      type: [
        {
          type: String,
          required: true,
          trim: true,
          maxlength: 2048,
        },
      ],
      required: true,
      validate: {
        validator: (images: string[]) =>
          Array.isArray(images) &&
          images.length >= 1 &&
          images.length <= 6 &&
          images.every(
            (image) =>
              typeof image === 'string' &&
              image.trim().length > 0
          ),
        message: 'Artwork must have between 1 and 6 valid images',
      },
    },

    artist: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    medium: {
      type: String,
      required: true,
      enum: [
        'Acrylic',
        'Oil',
        'Watercolor',
        'Pencil',
        'Digital',
        'Mixed Media',
      ],
    },

    subject: {
      type: String,
      enum: [
        'Abstract',
        'Landscape',
        'Portrait',
        'Still Life',
        'Wildlife',
        'Religious',
      ],
    },

    style: {
      type: String,
      enum: [
        'Modern',
        'Contemporary',
        'Impressionist',
        'Realist',
        'Expressionist',
      ],
    },

    color: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 50,
        },
      ],
      default: [],
      validate: {
        validator: (colors: string[]) =>
          Array.isArray(colors) && colors.length <= 10,
        message: 'An artwork cannot have more than 10 colors',
      },
    },

    dimensions: {
      width: {
        type: Number,
        required: true,
        min: 0,
        validate: positiveNumber,
      },

      height: {
        type: Number,
        required: true,
        min: 0,
        validate: positiveNumber,
      },

      unit: {
        type: String,
        enum: ['in', 'cm'],
        default: 'in',
        required: true,
      },
    },

    originalPrice: {
      type: Number,
      required: true,
      min: 0,
      validate: nonNegativeNumber,
    },

    digitalPrintPrice: {
      type: Number,
      min: 0,
      validate: nonNegativeNumber,
    },

    shippingCost: {
      type: Number,
      default: 50,
      min: 0,
      validate: nonNegativeNumber,
    },

    stock: {
      type: Number,
      default: 1,
      min: 0,
      validate: nonNegativeInteger,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isCuratorsPick: {
      type: Boolean,
      default: false,
    },

    isTrending: {
      type: Boolean,
      default: false,
    },

    category: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    tags: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 50,
        },
      ],
      default: [],
      validate: {
        validator: (tags: string[]) =>
          Array.isArray(tags) && tags.length <= 30,
        message: 'An artwork cannot have more than 30 tags',
      },
    },

    likes: {
      type: Number,
      default: 0,
      min: 0,
      validate: nonNegativeInteger,
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
      validate: nonNegativeInteger,
    },

    reviews: {
      type: [ReviewSchema],
      default: [],
      validate: {
        validator: (reviews: IReview[]) => {
          if (!Array.isArray(reviews)) {
            return false;
          }

          const reviewerIds = reviews.map(
            (review) => review.user.toString()
          );

          return (
            reviewerIds.length ===
            new Set(reviewerIds).size
          );
        },
        message: 'A buyer can only review an artwork once',
      },
    },

    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      validate: nonNegativeNumber,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
      validate: nonNegativeInteger,
    },
  },
  {
    timestamps: true,
  }
);

// Keep review statistics synchronized whenever an artwork
// document is saved through Mongoose document operations.
ArtworkSchema.pre('save', function () {
  const reviews = this.reviews || [];

  this.reviewCount = reviews.length;

  if (reviews.length === 0) {
    this.avgRating = 0;
    return;
  }

  const total = reviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );

  this.avgRating =
    Math.round((total / reviews.length) * 10) / 10;
});

const Artwork: Model<IArtwork> =
  mongoose.models.Artwork ||
  mongoose.model<IArtwork>('Artwork', ArtworkSchema);

export default Artwork;
