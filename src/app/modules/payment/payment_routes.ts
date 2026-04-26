import express, { Router } from 'express';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { paymentController } from './payment_controller';

const router = Router();

// ⚠️ Webhook MUST use raw body — register BEFORE app.use(express.json()) middleware
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook,
);

router.post(
  '/create-checkout-session',
  authMiddleware,
  paymentController.createCheckoutSession,
);

router.get(
  '/status/:sessionId',
  authMiddleware,
  paymentController.getPaymentStatus,
);

export const paymentRoutes = router;
