import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  artwork: mongoose.Types.ObjectId;
  type: 'original' | 'digital_print';
  printMedium?: string;
  printSize?: string;
  quantity: number;
  price: number;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  buyer: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  paymentMethod: 'razorpay' | 'upi' | 'netbanking' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  razorpayOrderId?: string;
  paymentReference?: string;
  refundStatus?: 'pending' | 'processed' | 'failed';
  refundReference?: string;
  refundIdempotencyKey?: string;
  refundError?: string;
  orderStatus:
    | 'placed'
    | 'confirmed'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'returned';
  inventoryAdjusted: boolean;
  inventoryReservationExpiresAt?: Date;
  inventoryReleasedAt?: Date;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const nonNegativeNumber = {
  validator: (value: number) =>
    Number.isFinite(value) && value >= 0,
  message: 'Value must be a valid non-negative number',
};

const OrderItemSchema = new Schema<IOrderItem>({
  artwork: {
    type: Schema.Types.ObjectId,
    ref: 'Artwork',
    required: true,
  },

  type: {
    type: String,
    enum: ['original', 'digital_print'],
    required: true,
  },

  printMedium: {
    type: String,
    trim: true,
    maxlength: 100,
  },

  printSize: {
    type: String,
    trim: true,
    maxlength: 100,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
    validate: {
      validator: (value: number) =>
        Number.isSafeInteger(value) && value >= 1,
      message: 'Quantity must be a positive safe integer',
    },
  },

  price: {
    type: Number,
    required: true,
    min: 0,
    validate: nonNegativeNumber,
  },
});

const ShippingAddressSchema = new Schema<IShippingAddress>({
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },

  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30,
  },

  addressLine1: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },

  addressLine2: {
    type: String,
    trim: true,
    maxlength: 200,
  },

  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },

  state: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },

  pincode: {
    type: String,
    required: true,
    validate: {
      validator: (value: string) => /^\d{6}$/.test(value),
      message: 'Pincode must contain exactly 6 digits',
    },
  },

  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    default: 'India',
  },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) =>
          Array.isArray(items) && items.length > 0,
        message: 'An order must contain at least one item',
      },
    },

    shippingAddress: {
      type: ShippingAddressSchema,
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
      validate: nonNegativeNumber,
    },

    shippingCost: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: nonNegativeNumber,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
      validate: nonNegativeNumber,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
      validate: nonNegativeNumber,
    },

    paymentMethod: {
      type: String,
      enum: ['razorpay', 'upi', 'netbanking', 'cod'],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },

    razorpayOrderId: String,
    paymentReference: String,

    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
    },

    refundReference: String,
    refundIdempotencyKey: String,
    refundError: String,

    inventoryAdjusted: {
      type: Boolean,
      default: false,
    },

    inventoryReservationExpiresAt: Date,
    inventoryReleasedAt: Date,

    orderStatus: {
      type: String,
      enum: [
        'placed',
        'confirmed',
        'shipped',
        'delivered',
        'cancelled',
        'returned',
      ],
      default: 'placed',
    },

    trackingNumber: {
      type: String,
      trim: true,
      maxlength: 120,
    },

    notes: {
      type: String,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.pre('validate', async function () {
  if (!this.orderNumber) {
    const count =
      await mongoose.models.Order.countDocuments();

    this.orderNumber =
      `UBA-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
});

const Order: Model<IOrder> =
  mongoose.models.Order ||
  mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
