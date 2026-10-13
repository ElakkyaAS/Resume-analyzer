import { useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Upload from './components/Upload.jsx';
import Result from './components/Result.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import { extractPdfText } from './pdf.js';
import './jd.css';

export default function App() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [reading, setReading] = useState(false);

  useEffect(() => {
    if (result) {
      document.getElementById('result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  function pickFile(picked) {
    setError('');
    setResult(null);
    if (!picked) return;
    if (picked.type !== 'application/pdf') {
      setError("That's not a PDF — please choose a .pdf file.");
      return;
    }
    setFile(picked);
  }

  async function analyze() {
    if (!file) return;
    setReading(true);
    try {
      const resumeText = await extractPdfText(file);
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jdText: jd }),
      });
      if (!res.ok) throw new Error('API returned ' + res.status);
      setResult(await res.json());
    } catch (err) {
      console.error(err);
      setError("Couldn't analyze — is the backend running on port 5000?");
    } finally {
      setReading(false);
    }
  }

  function reset() {
    setFile(null);
    setJd('');
    setError('');
    setResult(null);
    document.getElementById('dropzone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Upload
          file={file}
          jd={jd}
          error={error}
          reading={reading}
          onFile={pickFile}
          onJd={setJd}
          onAnalyze={analyze}
        />
        {result && <Result result={result} onReset={reset} />}
        <HowItWorks />
      </main>
      <footer>
        <p>Resume Analyzer — built with React, Vite and an Express API.</p>
      </footer>
    </>
  );
}
