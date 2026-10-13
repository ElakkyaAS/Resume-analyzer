import mongoose from 'mongoose';

export function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resume-analyzer';

  mongoose
    .connect(uri)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection failed:', err.message));
}
