import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PORT = 8123;
const BASE = `http://localhost:${PORT}`;

const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: new URL('..', import.meta.url).pathname,
  stdio: 'ignore',
});

function fail(message) {
  console.error('FAIL: ' + message);
  server.kill('SIGTERM');
  process.exit(1);
}

async function retryFetch(path, attempts = 20) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(BASE + path);
      if (res.status !== 502) return res;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

try {
  const index = await retryFetch('/');
  if (!index) fail('server never came up');
  const indexHtml = await index.text();
  if (!indexHtml.includes('script.js')) fail('index.html does not reference script.js');
  if (index.status !== 200) fail('index.html status ' + index.status);

  const scriptRes = await retryFetch('/script.js');
  if (!scriptRes) fail('script.js not served');
  const script = await scriptRes.text();
  if (!script.includes('SRTM_Color_Index')) fail('script.js lost the SRTM layer config');
  if (!script.includes("format: 'image/png'")) fail('SRTM layer is not requesting image/png');

  const locals = ['MODIS', 'VIIRS', 'Landsat_WELD', 'CesiumTerrainProvider.fromUrl', 'GoogleMapsCompatible_Level'];
  for (const needle of locals) {
    if (!readFileSync(new URL('../script.js', import.meta.url), 'utf8').includes(needle)) {
      fail('script.js missing expected token: ' + needle);
    }
  }

  console.log('PASS: server up, 4 GIBS layers configured, SRTM uses image/png');
} catch (err) {
  fail(err.message);
} finally {
  server.kill('SIGTERM');
}