import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';

import fmbRoutes from './routes/fmbRoutes.js';
import { setupDgpsSockets } from './sockets/dgpsSocket.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Initialize WebSocket Server with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/fmb', fmbRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API & WebSocket Engine Operational' });
});

// Attach our real-time PostGIS tracking logic
setupDgpsSockets(io);

httpServer.listen(PORT, () => {
  console.log(`[Server] FMB Backend & WebSocket Engine running on port ${PORT}`);
});