import { Router } from 'express';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { paymentController } from './payment_controller';

const router = Router();

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
