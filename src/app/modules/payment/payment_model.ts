import { Schema, model } from 'mongoose';
import { TPayment } from './payment_interface';

const paymentSchema = new Schema<TPayment>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    learnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    stripeSessionId: {
      type: String, // Stripe checkout session ID
    },
    transactionId: {
      type: String, // Stripe payment intent ID
    },
  },
  { timestamps: true },
);

export const Payment = model<TPayment>('Payment', paymentSchema);
