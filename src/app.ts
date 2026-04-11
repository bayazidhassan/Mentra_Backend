import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import router from './routes';

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://mentra-one.vercel.app',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }),
);

//handle preflight
app.options('*', cors());

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', router);

app.get('/', (req, res) => {
  res.send('Hello Mentra!');
});

export default app;
