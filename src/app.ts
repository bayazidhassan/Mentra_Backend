import cors from 'cors';
import express from 'express';
import router from './routes';
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }),
);

app.use('/api/v1', router);

app.get('/', (req, res) => {
  res.send('Hello Mentra!');
});

export default app;
