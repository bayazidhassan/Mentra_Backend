import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import net from 'net';
import app from './app';
import connectDB from './app/config/db';
import { seedAdmin } from './app/seed/adminSeeder';
import { initSocket } from './socket';

const startServer = async () => {
  try {
    await connectDB();

    // 👇 Temporary SMTP port check — remove after confirming
    const socket = net.createConnection(587, 'smtp.gmail.com');
    socket.on('connect', () => {
      console.log('✅ SMTP port 587 reachable');
      socket.destroy();
    });
    socket.on('error', (err) => {
      console.error('❌ SMTP port blocked:', err.message);
    });
    // 👆 end of check

    // Seed admin AFTER DB is connected
    await seedAdmin();

    // Wrap express app in http server — required for Socket.IO
    const httpServer = createServer(app);

    // Init Socket.IO on the same server
    initSocket(httpServer);

    // Listen on httpServer NOT app.listen
    httpServer.listen(process.env.PORT, () => {
      console.log(`Mentra listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server: ', error);
    process.exit(1);
  }
};

startServer();

// import dotenv from 'dotenv';
// dotenv.config();

// import app from './app';
// import connectDB from './app/config/db';

// const startServer = async () => {
//   try {
//     await connectDB();

//     app.listen(process.env.PORT, () => {
//       console.log(`Mentra listening on port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.error('❌ Failed to start server: ', error);
//     process.exit(1);
//   }
// };

// startServer();
