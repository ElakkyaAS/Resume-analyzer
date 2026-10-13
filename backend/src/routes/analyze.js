import { Router } from 'express';
import mongoose from 'mongoose';
import { findSkills, parseJdSkills } from '../services/compare.js';
import { analyzeResumeWithLabd, labdConfigured } from '../services/labd.js';
import Analysis from '../models/Analysis.js';

const router = Router();

router.post('/', async (req, res) => {
  const { resumeText, jdText = '' } = req.body || {};

  if (!resumeText || !resumeText.trim()) {
    return res.status(400).json({ error: 'resumeText is required' });
  }

  // Prefer the AI pass; fall back to the keyword matcher when the key is
  // missing or labd is unreachable, so the app degrades instead of failing.
  let result = null;
  let source = 'keywords';
  let aiError = null;

  if (labdConfigured()) {
    try {
      result = await analyzeResumeWithLabd(resumeText, jdText);
      source = 'labd';
    } catch (err) {
      aiError = err.message;
      console.error('labd analysis failed, falling back to keywords:', err.message);
    }
  }

  if (!result) {
    const jdSkills = parseJdSkills(jdText);
    const { present, missing, total } = findSkills(resumeText, jdSkills);
    result = {
      score: Math.round((present.length / total) * 100),
      present,
      missing,
      total,
      jdSkills,
      summary: '',
      percentLeft: null,
    };
  }

  // Save when MongoDB is reachable; respond anyway if it is not,
  // so the app keeps working without a local Mongo running.
  let saved = true;
  if (mongoose.connection.readyState === 1) {
    try {
      await Analysis.create({
        resumeText,
        jdText,
        score: result.score,
        present: result.present,
        missing: result.missing,
        totalSkills: result.total,
      });
    } catch (err) {
      saved = false;
      console.error('Could not save analysis:', err.message);
    }
  } else {
    saved = false;
  }

  res.json({ ...result, source, aiError, saved });
});

export default router;
