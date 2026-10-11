const OFFLINE_CACHE = 'playchive-offline-v1';
const MANIFEST_URL = 'offline-manifest.json';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

async function notifyClients(message, port) {
  if (port) port.postMessage(message);
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clients.forEach((client) => client.postMessage(message));
}

async function downloadOfflinePack(port) {
  const manifestResponse = await fetch(new URL(MANIFEST_URL, self.registration.scope), { cache: 'no-store' });
  if (!manifestResponse.ok) throw new Error(`Offline manifest unavailable (${manifestResponse.status})`);
  const manifest = await manifestResponse.json();
  const entries = Array.isArray(manifest.files) ? manifest.files : [];
  if (!entries.length) throw new Error('Offline manifest contains no files.');

  const cache = await caches.open(OFFLINE_CACHE);
  let completed = 0;
  let failed = 0;
  const failures = [];
  await notifyClients({ type: 'OFFLINE_PACK_START', total: entries.length, bytes: manifest.totalBytes || 0 }, port);

  for (const entry of entries) {
    const url = typeof entry === 'string' ? entry : entry.url;
    const absoluteUrl = new URL(url, self.registration.scope).href;
    try {
      const response = await fetch(absoluteUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${response.status}`);
      await cache.put(new Request(absoluteUrl), response.clone());
      completed += 1;
    } catch (error) {
      failed += 1;
      failures.push({ url, error: String(error?.message || error) });
    }
    await notifyClients({
      type: 'OFFLINE_PACK_PROGRESS',
      completed,
      failed,
      total: entries.length,
      current: url,
    }, port);
  }

  const ready = failed === 0;
  await notifyClients({
    type: 'OFFLINE_PACK_DONE',
    ready,
    completed,
    failed,
    total: entries.length,
    failures: failures.slice(0, 12),
  }, port);
}

self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'DOWNLOAD_OFFLINE_PACK') return;
  const port = event.ports?.[0];
  event.waitUntil(downloadOfflinePack(port).catch(async (error) => {
    await notifyClients({ type: 'OFFLINE_PACK_ERROR', error: String(error?.message || error) }, port);
  }));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(OFFLINE_CACHE);
    const cached = await cache.match(request, { ignoreSearch: true });
    try {
      const response = await fetch(request);
      if (response.ok && !url.pathname.endsWith(MANIFEST_URL)) {
        event.waitUntil(cache.put(request, response.clone()));
      }
      return response;
    } catch (error) {
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const fallback = await cache.match('./index.html', { ignoreSearch: true });
        if (fallback) return fallback;
      }
      throw error;
    }
  })());
});
