import express from 'express';
const app = express();

app.get('/', (req, res) => {
  res.send('Hello Mentra!');
});

export default app;
