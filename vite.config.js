import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // pdf.js ships modern syntax (top-level await); raise the target so the
    // bundler doesn't complain about it.
    target: 'es2022',
  },
});
