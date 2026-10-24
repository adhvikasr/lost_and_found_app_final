import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const PORT = parseInt(process.env.PORT, 10) || 3001;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log(' Campus Lost & Found - Backend Server Started');
  console.log('====================================================');
  console.log(` Server running at: http://localhost:${PORT}`);
  console.log(` Health check URL:  http://localhost:${PORT}/api/health`);
  console.log(` Items API URL:     http://localhost:${PORT}/api/items`);
  console.log(` Frontend URL:      http://localhost:${PORT}/`);
  console.log('====================================================');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Error] Port ${PORT} is already in use. Try specifying another PORT in .env.`);
  } else {
    console.error('[Error] Server failure:', err);
  }
  process.exit(1);
});

export default server;
