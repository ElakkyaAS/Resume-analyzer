import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema(
  {
    resumeText: { type: String, required: true },
    jdText: { type: String, default: '' },
    score: { type: Number, required: true },
    present: { type: [String], required: true },
    missing: { type: [String], required: true },
    totalSkills: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Analysis', analysisSchema);
