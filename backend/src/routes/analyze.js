import { Router } from 'express';
import mongoose from 'mongoose';
import { findSkills, parseJdSkills } from '../services/compare.js';
import Analysis from '../models/Analysis.js';

const router = Router();

router.post('/', async (req, res) => {
  const { resumeText, jdText = '' } = req.body || {};

  if (!resumeText || !resumeText.trim()) {
    return res.status(400).json({ error: 'resumeText is required' });
  }

  const jdSkills = parseJdSkills(jdText);
  const { present, missing, total } = findSkills(resumeText, jdSkills);
  const score = Math.round((present.length / total) * 100);

  // Save when MongoDB is reachable; respond anyway if it is not,
  // so the app keeps working without a local Mongo running.
  let saved = true;
  if (mongoose.connection.readyState === 1) {
    try {
      await Analysis.create({ resumeText, jdText, score, present, missing, totalSkills: total });
    } catch (err) {
      saved = false;
      console.error('Could not save analysis:', err.message);
    }
  } else {
    saved = false;
  }

  res.json({ score, present, missing, total, jdSkills, saved });
});

export default router;
