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
      required: true,
    },

    type: {
      type: String,
      enum: ['original', 'digital_print'],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
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
      required: true,
      unique: true,
    },

    items: {
      type: [CartItemSchema],
      default: [],
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