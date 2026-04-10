import dotenv from 'dotenv';
import app from './app';
import connectDB from './config/db';
dotenv.config();

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
