import { RequestHandler } from 'express';
import { paymentService } from './payment_service';

// ─── createCheckoutSession ────────────────────────────────────────────────────

const createCheckoutSession: RequestHandler = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        message: 'sessionId is required.',
        data: null,
      });
      return;
    }

    const data = await paymentService.createCheckoutSession(
      req.user?.id as string,
      sessionId,
    );

    res.status(200).json({
      success: true,
      message: 'Checkout session created.',
      data, // { url: 'https://checkout.stripe.com/...' }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to create checkout session.',
      data: null,
    });
  }
};

// ─── handleWebhook ────────────────────────────────────────────────────────────
// IMPORTANT: this route must use express.raw() NOT express.json()
// Register it BEFORE the global json middleware in server.ts

const handleWebhook: RequestHandler = async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    res
      .status(400)
      .json({ success: false, message: 'Missing stripe signature.' });
    return;
  }

  try {
    await paymentService.handleWebhook(req.body as Buffer, signature);
    res.status(200).json({ received: true });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Webhook error.',
    });
  }
};

// ─── getPaymentStatus ─────────────────────────────────────────────────────────

const getPaymentStatus: RequestHandler = async (req, res) => {
  try {
    const { sessionId } = req.params as { sessionId: string };
    const payment = await paymentService.getPaymentStatus(
      req.user?.id as string,
      sessionId,
    );
    res.status(200).json({
      success: true,
      message: 'Payment status fetched.',
      data: payment,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to fetch payment status.',
      data: null,
    });
  }
};

export const paymentController = {
  createCheckoutSession,
  handleWebhook,
  getPaymentStatus,
};
