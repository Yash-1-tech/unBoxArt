import mongoose, { Schema, Document, Model } from 'mongoose';

export type CartItemType = 'original' | 'digital_print';

export interface ICartItem {
  artwork: mongoose.Types.ObjectId;
  type: CartItemType;
  quantity: number;
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    artwork: {
      type: Schema.Types.ObjectId,
      ref: 'Artwork',
      required: [true, 'Artwork is required'],
    },

    type: {
      type: String,
      enum: {
        values: ['original', 'digital_print'],
        message: 'Invalid cart item type',
      },
      required: [true, 'Item type is required'],
    },

    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: (value: number) =>
          Number.isSafeInteger(value) && value >= 1,
        message: 'Quantity must be a positive safe integer',
      },
      default: 1,
    },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Cart owner is required'],
      unique: true,
    },

    items: {
      type: [CartItemSchema],
      default: [],
      validate: {
        validator: (items: ICartItem[]) => {
          const keys = items.map(
            (item) => `${item.artwork.toString()}:${item.type}`
          );

          return keys.length === new Set(keys).size;
        },
        message:
          'A cart cannot contain duplicate artwork and item type combinations',
      },
    },
  },
  {
    timestamps: true,
  }
);

const Cart: Model<ICart> =
  mongoose.models.Cart ||
  mongoose.model<ICart>('Cart', CartSchema);

export default Cart;