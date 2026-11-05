const OFFLINE_CACHE = 'playchive-offline-v2';
const MANIFEST_URL = 'offline-manifest.json';
let cancelRequested = false;
let downloadActive = false;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('playchive-offline-') && key !== OFFLINE_CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function notifyClients(message, port) {
  if (port) port.postMessage(message);
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clients.forEach((client) => client.postMessage(message));
}

async function downloadOfflinePack(port) {
  if (downloadActive) return;
  downloadActive = true;
  cancelRequested = false;
  try {
  const manifestResponse = await fetch(new URL(MANIFEST_URL, self.registration.scope), { cache: 'no-store' });
  if (!manifestResponse.ok) throw new Error(`Offline manifest unavailable (${manifestResponse.status})`);
  const manifest = await manifestResponse.json();
  const entries = Array.isArray(manifest.files) ? manifest.files : [];
  if (!entries.length) throw new Error('Offline manifest contains no files.');

  const cache = await caches.open(OFFLINE_CACHE);
  let completed = 0;
  let failed = 0;
  let cachedBytes = 0;
  const failures = [];
  await notifyClients({ type: 'OFFLINE_PACK_START', total: entries.length, bytes: manifest.totalBytes || 0 }, port);

  for (const entry of entries) {
    if (cancelRequested) {
      await notifyClients({ type: 'OFFLINE_PACK_CANCELLED', completed, failed, total: entries.length, cachedBytes }, port);
      return;
    }
    const url = typeof entry === 'string' ? entry : entry.url;
    const expectedBytes = typeof entry === 'string' ? 0 : Number(entry.bytes) || 0;
    const absoluteUrl = new URL(url, self.registration.scope).href;
    try {
      const cached = await cache.match(new Request(absoluteUrl));
      if (cached) {
        completed += 1;
        cachedBytes += expectedBytes;
        await notifyClients({
          type: 'OFFLINE_PACK_PROGRESS',
          completed,
          failed,
          total: entries.length,
          current: url,
          cachedBytes,
          resumed: true,
        }, port);
        continue;
      }
      const response = await fetch(absoluteUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${response.status}`);
      await cache.put(new Request(absoluteUrl), response.clone());
      completed += 1;
      cachedBytes += expectedBytes;
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
      cachedBytes,
    }, port);
  }

  const ready = failed === 0;
  await notifyClients({
    type: 'OFFLINE_PACK_DONE',
    ready,
    completed,
    failed,
    total: entries.length,
    cachedBytes,
    failures: failures.slice(0, 12),
  }, port);
  } finally {
    downloadActive = false;
    cancelRequested = false;
  }
}

async function clearOfflinePack(port) {
  const deleted = await caches.delete(OFFLINE_CACHE);
  await notifyClients({ type: 'OFFLINE_PACK_CLEARED', deleted }, port);
}

self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'DOWNLOAD_OFFLINE_PACK') return;
  const port = event.ports?.[0];
  event.waitUntil(downloadOfflinePack(port).catch(async (error) => {
    await notifyClients({ type: 'OFFLINE_PACK_ERROR', error: String(error?.message || error) }, port);
  }));
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  const port = event.ports?.[0];
  if (event.data.type === 'CANCEL_OFFLINE_PACK') {
    cancelRequested = true;
    return;
  }
  if (event.data.type === 'CLEAR_OFFLINE_PACK') {
    event.waitUntil(clearOfflinePack(port));
  }
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
