import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/db/index.js';
// Import routes
import route from './src/routes/index.js';

dotenv.config();

const app = express();

app.use(express.json());

connectDB();

// Cho phép frontend gọi API
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server
  credentials: true
}));

route(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});