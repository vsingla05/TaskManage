import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';

// Default 5001: macOS often reserves 5000 for AirPlay Receiver (EADDRINUSE).
const PORT = Number(process.env.PORT) || 5000;

await connectDB();
const server = http.createServer(app);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n[${err.code}] Port ${PORT} is already in use.\n\n` +
        `Fix:\n` +
        `  1) Stop the other API:  lsof -i :${PORT}   then   kill <PID>\n` +
        `  2) Or pick another port in backend/.env:  PORT=5002\n` +
        `  3) If you only need one backend, close duplicate terminals running "npm run dev".\n`
    );
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
