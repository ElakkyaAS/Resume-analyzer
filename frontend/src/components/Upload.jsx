import { useRef, useState } from 'react';

export default function Upload({ file, jd, error, reading, onFile, onJd, onAnalyze }) {
  const inputRef = useRef(null);
  const [dragover, setDragover] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragover(false);
    onFile(e.dataTransfer.files?.[0] ?? null);
  }

  return (
    <section id="analyze" className="upload-section">
      <div className="container">
        <div className="jd-box">
          <label className="jd-label" htmlFor="jd">Job description (optional)</label>
          <textarea
            id="jd"
            className="jd-input"
            rows={6}
            value={jd}
            onChange={(e) => onJd(e.target.value)}
            placeholder="Paste the job description you're targeting — its skills join the comparison list."
          />
        </div>

        <div
          id="dropzone"
          className={'dropzone' + (dragover ? ' dragover' : '')}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
          onDragLeave={() => setDragover(false)}
          onDrop={handleDrop}
        >
          <p className="dz-icon">📄</p>
          <p className="dz-title">Drop your resume here</p>
          <p className="dz-sub">
            or <span className="dz-browse">browse your files</span> — PDF only
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {file && <p className="picked">Selected: {file.name}</p>}
        {error && <p className="error">{error}</p>}

        <button className="btn" onClick={onAnalyze} disabled={!file || reading}>
          {reading ? 'Analyzing…' : 'Analyze resume'}
        </button>
      </div>
    </section>
  );
}
