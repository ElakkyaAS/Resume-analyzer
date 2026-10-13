import { useEffect, useState } from 'react';

const RING_LENGTH = 326.7; // 2π × r(52)
const COLORS = { good: '#3ecf8e', warn: '#f5b544', bad: '#ff6b6b' };

export default function ScoreRing({ score }) {
  const color = score >= 75 ? COLORS.good : score >= 45 ? COLORS.warn : COLORS.bad;

  const [fill, setFill] = useState(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setFill(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const start = performance.now();
    let raf;
    function tick(now) {
      const progress = Math.min((now - start) / 900, 1);
      setDisplay(Math.round(score * progress));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div className="ring-wrap">
      <svg className="ring" viewBox="0 0 120 120" aria-hidden="true">
        <circle className="ring-bg" cx="60" cy="60" r="52" />
        <circle
          className="ring-fg"
          cx="60"
          cy="60"
          r="52"
          style={{
            stroke: color,
            strokeDashoffset: fill ? RING_LENGTH * (1 - score / 100) : RING_LENGTH,
          }}
        />
      </svg>
      <div className="score-num">
        <span>{display}</span><span className="pct">%</span>
      </div>
    </div>
  );
}
