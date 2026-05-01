import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { paymentController } from './payment_controller';

const router = Router();

router.use(authenticate);

router.post(
  '/create-checkout-session',
  paymentController.createCheckoutSession,
);

router.get('/status/:sessionId', paymentController.getPaymentStatus);

export const paymentRoutes = router;
