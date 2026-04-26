import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { paymentController } from './app/modules/payment/payment_controller';
import router from './app/routes';

const app = express();

app.use(
  cors({
    origin: ['https://mentra-one.vercel.app', 'http://localhost:3000'],
    credentials: true,
  }),
);

// The Stripe webhook requires the RAW request body (not parsed JSON).
// You must register the webhook routes BEFORE app.use(express.json()) middleware.
// Webhook must use raw body
app.use(
  '/api/v1/payment/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook,
);

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', router);

app.get('/', (req, res) => {
  res.send('Hello Mentra!');
});

export default app;
