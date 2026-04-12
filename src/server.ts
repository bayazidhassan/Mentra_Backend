import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import connectDB from './app/config/db';

const startServer = async () => {
  try {
    await connectDB();

    app.listen(process.env.PORT, () => {
      console.log(`Mentra listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server: ', error);
    process.exit(1);
  }
};

startServer();
