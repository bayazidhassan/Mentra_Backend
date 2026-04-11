import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import router from './app/routes';

const app = express();

app.use(
  cors({
    origin: ['https://mentra-one.vercel.app', 'http://localhost:3000'],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', router);

app.get('/', (req, res) => {
  res.send('Hello Mentra!');
});

export default app;
