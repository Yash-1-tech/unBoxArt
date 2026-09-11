import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';

// POST /api/payment/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }
export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId, // our MongoDB order _id
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
    }

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Mark order as paid in MongoDB
    if (orderId) {
      await connectDB();
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'paid',
        paymentReference: razorpay_payment_id,
        orderStatus: 'confirmed',
      });
    }

    return NextResponse.json({
      verified: true,
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    console.error('[POST /api/payment/verify]', err);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
