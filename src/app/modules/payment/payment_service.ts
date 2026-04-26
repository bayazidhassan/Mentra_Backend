import { Types } from 'mongoose';
import Stripe from 'stripe';
import { stripe } from '../../config/stripe';
import { createNotification } from '../notification/notification_service';
import { Session } from '../session/session_model';
import { User } from '../user/user_model';
import { Payment } from './payment_model';

// ─── createCheckoutSession ────────────────────────────────────────────────────

const createCheckoutSession = async (learnerId: string, sessionId: string) => {
  // 1. Fetch the session
  const session = await Session.findOne({
    _id: sessionId,
    learner: new Types.ObjectId(learnerId),
    status: 'accepted', // only accepted sessions can be paid
    paymentStatus: 'unpaid', // not already paid
  });

  if (!session) {
    throw new Error('Session not found or not eligible for payment.');
  }

  if (!session.price || session.price <= 0) {
    throw new Error('This session has no price set.');
  }

  // 2. Get learner info for Stripe customer
  const learner = await User.findById(learnerId).lean();

  // 3. Create or find existing pending payment record
  let payment = await Payment.findOne({
    sessionId: session._id,
    status: 'pending',
  });

  if (!payment) {
    payment = await Payment.create({
      sessionId: session._id,
      learnerId: new Types.ObjectId(learnerId),
      mentorId: session.mentor,
      amount: session.price,
      currency: 'usd',
      status: 'pending',
    });
  }

  // 4. Build redirect URLs based on env
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : 'http://localhost:3000';

  // 5. Create Stripe checkout session
  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: learner?.email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: session.title,
            description: session.description ?? `Session with your mentor`,
          },
          // Stripe expects amount in cents
          unit_amount: Math.round(session.price * 100),
        },
        quantity: 1,
      },
    ],
    // Pass IDs so webhook can identify this payment
    metadata: {
      sessionId: session._id.toString(),
      paymentId: payment._id.toString(),
      learnerId,
      mentorId: session.mentor.toString(),
    },
    success_url: `${baseUrl}/sessions?payment=success`,
    cancel_url: `${baseUrl}/sessions?payment=cancelled`,
  });

  // 6. Save stripe session ID to payment record
  payment.stripeSessionId = stripeSession.id;
  await payment.save();

  return { url: stripeSession.url };
};

// ─── handleWebhook ────────────────────────────────────────────────────────────

const handleWebhook = async (rawBody: Buffer, signature: string) => {
  let event: Stripe.Event;

  // Verify webhook signature — prevents fake events
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch {
    throw new Error('Invalid webhook signature.');
  }

  // Only handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const stripeSession = event.data.object as Stripe.Checkout.Session;

    const { sessionId, paymentId, learnerId, mentorId } =
      stripeSession.metadata ?? {};

    if (!sessionId || !paymentId || !learnerId || !mentorId) {
      throw new Error('Missing metadata in Stripe session.');
    }

    // Update Payment document
    await Payment.findByIdAndUpdate(paymentId, {
      $set: {
        status: 'paid',
        transactionId: stripeSession.payment_intent as string,
      },
    });

    // Update Session paymentStatus
    await Session.findByIdAndUpdate(sessionId, {
      $set: { paymentStatus: 'paid' },
    });

    // Notify learner
    await createNotification({
      userId: learnerId,
      type: 'payment',
      title: 'Payment successful!',
      message:
        'Your session payment was confirmed. Check your sessions for details.',
      actionUrl: '/session',
    });

    // Notify mentor
    await createNotification({
      userId: mentorId,
      type: 'payment',
      title: 'Payment received',
      message: 'A learner has paid for their session with you.',
      actionUrl: '/sessions',
    });
  }

  // Handle failed payment
  if (event.type === 'checkout.session.expired') {
    const stripeSession = event.data.object as Stripe.Checkout.Session;
    const { paymentId } = stripeSession.metadata ?? {};

    if (paymentId) {
      await Payment.findByIdAndUpdate(paymentId, {
        $set: { status: 'failed' },
      });
    }
  }
};

// ─── getPaymentStatus ─────────────────────────────────────────────────────────

const getPaymentStatus = async (learnerId: string, sessionId: string) => {
  const payment = await Payment.findOne({
    sessionId: new Types.ObjectId(sessionId),
    learnerId: new Types.ObjectId(learnerId),
  }).sort({ createdAt: -1 });

  return payment;
};

export const paymentService = {
  createCheckoutSession,
  handleWebhook,
  getPaymentStatus,
};
