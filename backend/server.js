import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { connectDB } from './src/config/db.js';
import analyzeRouter from './src/routes/analyze.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/analyze', analyzeRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));

connectDB();
