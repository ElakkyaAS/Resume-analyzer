import ScoreRing from './ScoreRing.jsx';
import SkillChips from './SkillChips.jsx';

export default function Result({ result, onReset }) {
  const { score, present, missing, total, saved, summary, source } = result;
  const note =
    `${present.length} of ${total} skills checked ` +
    (score >= 75 ? '— strong match 💪' : score >= 45 ? '— decent, room to grow' : '— lots of gaps to fill');

  return (
    <section id="result" className="result">
      <div className="container">
        <div className="result-grid">
          <div className="score-card">
            <ScoreRing score={score} />
            <p className="score-label">Resume score</p>
            <p className="score-note">{note}</p>
            {summary && <p className="score-summary">{summary}</p>}
          </div>

          <div className="skills-card">
            <SkillChips
              heading="Skills found"
              skills={present}
              cls="present"
              emptyMessage="No matching skills found."
            />
            <SkillChips
              heading="Skills missing"
              skills={missing}
              cls="missing"
              emptyMessage="Every skill on the list showed up 🎉"
            />
            <p className="saved-note">
              {saved ? '✓ Saved to MongoDB' : '⚠ Not saved — MongoDB not reachable'}
              {source === 'labd' ? ' · scored by labd' : ''}
            </p>
            <button className="btn ghost" onClick={onReset}>↺ Analyze another resume</button>
          </div>
        </div>
      </div>
    </section>
  );
}
