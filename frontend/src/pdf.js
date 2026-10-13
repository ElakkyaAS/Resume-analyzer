// ============================================================
// PDF text extraction — pdf.js is bundled by Vite, the worker
// is resolved as an asset URL. No CDN scripts.
// ============================================================

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export async function extractPdfText(file) {
  const data = await file.arrayBuffer();
  const pdf = await getDocument({ data }).promise;

  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(' ') + ' ';
  }
  return text;
}
