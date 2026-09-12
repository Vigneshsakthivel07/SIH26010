import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fmbRoutes from './routes/fmbRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded FMB images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/fmb', fmbRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'FMB Storage Engine Operational' });
});

app.listen(PORT, () => {
  console.log(`[Server] FMB Backend running on port ${PORT}`);
});