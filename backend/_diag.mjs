process.env.VERCEL = '1';
const mod = await import('./server.js');
const app = mod.default;
console.log('default export is a function:', typeof app === 'function');

// Exercise the app in-process, the way Vercel invokes it.
const server = app.listen(0, async () => {
  const port = server.address().port;
  const res = await fetch(`http://127.0.0.1:${port}/api/health`);
  console.log('GET /api/health ->', res.status, await res.text());
  server.close();
});
