const OFFLINE_READY_KEY = 'playchive:offline-pack-ready:v2';

const state = {
  button: null, status: null, dialog: null, phase: null, fill: null, percent: null,
  progress: null, files: null, size: null, cached: null, current: null, start: null,
  cancel: null, clear: null, importInput: null, registration: null, manifest: null,
};

function setState(next, text) {
  if (state.button) {
    state.button.dataset.offlineState = next;
    state.button.disabled = next === 'downloading' || next === 'importing';
    state.button.setAttribute('aria-busy', String(next === 'downloading' || next === 'importing'));
  }
  if (state.status) state.status.textContent = text;
  if (state.dialog) state.dialog.dataset.offlineState = next;
  if (state.cancel) state.cancel.hidden = next !== 'downloading';
  if (state.start) state.start.disabled = next === 'downloading' || next === 'importing';
  if (state.importInput) state.importInput.disabled = next === 'downloading' || next === 'importing';
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB']; let value = bytes; let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

function updateProgress(done, total, cachedBytes, current = '') {
  const pct = Math.round((done / Math.max(1, total)) * 100);
  if (state.fill) state.fill.style.width = `${pct}%`;
  if (state.percent) state.percent.textContent = `${pct}%`;
  if (state.progress) state.progress.setAttribute('aria-valuenow', String(pct));
  if (state.cached) state.cached.textContent = formatBytes(cachedBytes);
  if (state.current && current) state.current.textContent = current.replace(/^\.\//, '');
}

function applyWorkerMessage(message) {
  if (!message) return;
  if (message.type === 'OFFLINE_PACK_START') {
    const total = Number(message.total) || 0;
    state.manifest = { total, bytes: Number(message.bytes) || 0 };
    if (state.files) state.files.textContent = total.toLocaleString();
    if (state.size) state.size.textContent = formatBytes(message.bytes);
    if (state.phase) state.phase.textContent = 'Caching the archive';
    updateProgress(0, total, 0, 'Preparing local archive…'); setState('downloading', '0% · preparing');
  } else if (message.type === 'OFFLINE_PACK_PROGRESS') {
    const done = (Number(message.completed) || 0) + (Number(message.failed) || 0);
    const total = Number(message.total) || state.manifest?.total || 1;
    if (state.phase) state.phase.textContent = message.failed ? 'Caching with warnings' : 'Building local archive';
    updateProgress(done, total, Number(message.cachedBytes) || 0, message.current ? `Caching ${message.current}` : 'Caching files…');
    setState('downloading', `${Math.round((done / total) * 100)}% · ${done}/${total}`);
  } else if (message.type === 'OFFLINE_PACK_DONE') {
    const total = Number(message.total) || 0;
    updateProgress(Number(message.completed) + Number(message.failed), total, Number(message.cachedBytes) || 0, message.ready ? 'Archive verified on this device' : 'Finished with missing files');
    if (message.ready) {
      localStorage.setItem(OFFLINE_READY_KEY, 'true');
      if (state.phase) state.phase.textContent = 'Archive ready'; setState('ready', 'Offline ready');
      if (state.start) state.start.textContent = 'Refresh offline pack';
    } else {
      localStorage.removeItem(OFFLINE_READY_KEY);
      if (state.phase) state.phase.textContent = 'Partial archive'; setState('partial', `${message.completed}/${message.total} cached`);
      if (state.start) state.start.textContent = 'Retry missing files';
    }
  } else if (message.type === 'OFFLINE_PACK_CANCELLED') {
    if (state.phase) state.phase.textContent = 'Download paused';
    if (state.current) state.current.textContent = 'Download cancelled — resume when ready';
    setState('partial', 'Paused'); if (state.start) state.start.textContent = 'Resume download';
  } else if (message.type === 'OFFLINE_PACK_CLEARED') {
    localStorage.removeItem(OFFLINE_READY_KEY); updateProgress(0, state.manifest?.total || 1, 0, 'Local pack cleared');
    if (state.phase) state.phase.textContent = 'Ready to prepare'; if (state.start) state.start.textContent = 'Prepare offline pack'; setState('idle', 'Online only');
  } else if (message.type === 'OFFLINE_PACK_ERROR') {
    if (state.phase) state.phase.textContent = 'Could not finish';
    if (state.current) state.current.textContent = message.error || 'Try again in a moment';
    setState('error', 'Try again'); if (state.start) state.start.textContent = 'Try again';
    console.warn('[PLAYCHIVE offline]', message.error);
  }
}

function post(type) {
  const active = state.registration?.active;
  if (!active) throw new Error('Offline worker is not active yet. Reload once and try again.');
  active.postMessage({ type });
}

function openDialog() { if (!state.dialog) return; if (typeof state.dialog.showModal === 'function' && !state.dialog.open) state.dialog.showModal(); else state.dialog.setAttribute('open', ''); }
function closeDialog() { if (!state.dialog) return; if (state.dialog.open && typeof state.dialog.close === 'function') state.dialog.close(); else state.dialog.removeAttribute('open'); }

const CONTENT_TYPES = {
  html: 'text/html', css: 'text/css', js: 'text/javascript', json: 'application/json',
  wasm: 'application/wasm', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon', woff: 'font/woff',
  woff2: 'font/woff2', mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav', wad: 'application/octet-stream',
};
function contentType(path) { return CONTENT_TYPES[path.split('.').pop().toLowerCase()] || 'application/octet-stream'; }

function readU16(view, offset) { return view.getUint16(offset, true); }
function readU32(view, offset) { return view.getUint32(offset, true); }
function findEndRecord(view) {
  for (let i = view.byteLength - 22; i >= Math.max(0, view.byteLength - 65557); i -= 1) if (readU32(view, i) === 0x06054b50) return i;
  throw new Error('This is not a readable ZIP archive.');
}

async function inflateRaw(bytes) {
  if (!('DecompressionStream' in window)) throw new Error('This browser cannot unpack compressed transfer ZIPs.');
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZip(arrayBuffer) {
  const view = new DataView(arrayBuffer); const end = findEndRecord(view);
  const count = readU16(view, end + 10); const directorySize = readU32(view, end + 12); const directoryOffset = readU32(view, end + 16);
  if (count > 10000 || directoryOffset + directorySize > view.byteLength) throw new Error('Transfer ZIP directory is invalid.');
  const entries = []; let cursor = directoryOffset;
  for (let i = 0; i < count; i += 1) {
    if (readU32(view, cursor) !== 0x02014b50) throw new Error('Transfer ZIP contains an invalid entry.');
    const method = readU16(view, cursor + 10); const compressedSize = readU32(view, cursor + 20); const nameSize = readU16(view, cursor + 28); const extraSize = readU16(view, cursor + 30); const commentSize = readU16(view, cursor + 32); const localOffset = readU32(view, cursor + 42);
    const name = new TextDecoder().decode(new Uint8Array(arrayBuffer, cursor + 46, nameSize));
    if (!name || name.endsWith('/') || name.includes('..') || name.startsWith('/')) throw new Error('Transfer ZIP contains an unsafe path.');
    if (readU32(view, localOffset) !== 0x04034b50) throw new Error('Transfer ZIP local header is invalid.');
    const localNameSize = readU16(view, localOffset + 26); const localExtraSize = readU16(view, localOffset + 28); const dataStart = localOffset + 30 + localNameSize + localExtraSize;
    const compressed = new Uint8Array(arrayBuffer, dataStart, compressedSize);
    let bytes;
    if (method === 0) bytes = new Uint8Array(compressed);
    else if (method === 8) bytes = await inflateRaw(compressed);
    else throw new Error(`Unsupported ZIP compression method for ${name}.`);
    entries.push({ path: name, bytes, size: bytes.byteLength });
    cursor += 46 + nameSize + extraSize + commentSize;
  }
  return entries;
}

function importFile(entry) {
  return new Promise((resolve, reject) => {
    const active = state.registration?.active;
    if (!active) { reject(new Error('Offline worker is not active yet.')); return; }
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => reject(new Error(`Import timed out for ${entry.path}.`)), 30000);
    channel.port1.onmessage = (event) => { if (event.data?.type === 'OFFLINE_PACK_IMPORT_FILE') { window.clearTimeout(timeout); resolve(); } else if (event.data?.type === 'OFFLINE_PACK_ERROR') { window.clearTimeout(timeout); reject(new Error(event.data.error)); } };
    const buffer = entry.bytes.buffer.slice(entry.bytes.byteOffset, entry.bytes.byteOffset + entry.bytes.byteLength);
    active.postMessage({ type: 'IMPORT_OFFLINE_FILE', path: entry.path, contentType: contentType(entry.path), buffer }, [buffer, channel.port2]);
  });
}

async function importTransferPack(file) {
  if (!file) return;
  setState('importing', 'Reading transfer ZIP'); if (state.phase) state.phase.textContent = 'Checking transfer pack';
  try {
    const entries = await readZip(await file.arrayBuffer());
    const manifestEntry = entries.find((entry) => entry.path === 'offline-manifest.json');
    if (!manifestEntry) throw new Error('This transfer ZIP has no offline manifest.');
    const manifest = JSON.parse(new TextDecoder().decode(manifestEntry.bytes));
    if (!String(manifest.schemaVersion || '').startsWith('1')) throw new Error('This transfer pack version is not supported.');
    const expected = new Map((manifest.files || []).map((entry) => [String(entry.url || '').replace(/^\.\//, ''), Number(entry.bytes) || 0]));
    const payload = entries.filter((entry) => expected.has(entry.path));
    if (!payload.length || payload.length !== expected.size) throw new Error('This transfer pack is incomplete.');
    if (payload.some((entry) => entry.size !== expected.get(entry.path))) throw new Error('This transfer pack failed its size check.');
    if (state.files) state.files.textContent = payload.length.toLocaleString();
    if (state.size) state.size.textContent = formatBytes(payload.reduce((sum, entry) => sum + entry.size, 0));
    let done = 0; let bytes = 0; updateProgress(0, payload.length, 0, 'Installing local archive…');
    for (const entry of payload) {
      await importFile(entry); done += 1; bytes += entry.size; updateProgress(done, payload.length, bytes, `Importing ${entry.path}`); setState('importing', `${Math.round((done / payload.length) * 100)}% · importing`);
    }
    localStorage.setItem(OFFLINE_READY_KEY, 'true');
    if (state.phase) state.phase.textContent = 'Archive imported';
    if (state.current) state.current.textContent = 'Transfer pack verified on this device';
    setState('ready', 'Offline ready'); if (state.start) state.start.textContent = 'Refresh offline pack';
  } catch (error) {
    if (state.phase) state.phase.textContent = 'Import failed';
    if (state.current) state.current.textContent = error.message;
    setState('error', 'Import failed');
  } finally { if (state.importInput) state.importInput.value = ''; }
}

export function initOfflinePack() {
  state.button = document.getElementById('offline-pack-button'); state.status = document.getElementById('offline-pack-status'); state.dialog = document.getElementById('offline-pack-dialog'); state.phase = document.getElementById('offline-pack-phase'); state.fill = document.getElementById('offline-pack-progress-fill'); state.percent = document.getElementById('offline-pack-percent'); state.progress = state.dialog?.querySelector('[role="progressbar"]'); state.files = document.getElementById('offline-pack-files'); state.size = document.getElementById('offline-pack-size'); state.cached = document.getElementById('offline-pack-cached'); state.current = document.getElementById('offline-pack-current'); state.start = document.getElementById('offline-pack-start'); state.cancel = document.getElementById('offline-pack-cancel'); state.clear = document.getElementById('offline-pack-clear'); state.importInput = document.getElementById('offline-pack-import');
  if (!state.button || !('serviceWorker' in navigator)) { if (state.status) state.status.textContent = 'Browser cache unavailable'; return; }
  if (localStorage.getItem(OFFLINE_READY_KEY) === 'true') { setState('ready', 'Offline ready'); if (state.phase) state.phase.textContent = 'Archive ready on this device'; if (state.start) state.start.textContent = 'Refresh offline pack'; }
  state.button.addEventListener('click', openDialog);
  state.importInput?.addEventListener('change', () => importTransferPack(state.importInput.files?.[0]));
  state.dialog?.addEventListener('click', (event) => {
    if (event.target === state.dialog) closeDialog(); const action = event.target.closest?.('[data-offline-action]')?.dataset.offlineAction;
    if (action === 'close') closeDialog();
    if (action === 'start') { try { setState('downloading', 'Preparing…'); if (state.phase) state.phase.textContent = 'Waking archive worker'; post('DOWNLOAD_OFFLINE_PACK'); } catch (error) { applyWorkerMessage({ type: 'OFFLINE_PACK_ERROR', error: error.message }); } }
    if (action === 'cancel') { try { post('CANCEL_OFFLINE_PACK'); } catch {} }
    if (action === 'clear') { try { post('CLEAR_OFFLINE_PACK'); } catch (error) { applyWorkerMessage({ type: 'OFFLINE_PACK_ERROR', error: error.message }); } }
  });
  state.dialog?.addEventListener('cancel', (event) => { if (state.button.dataset.offlineState === 'downloading' || state.button.dataset.offlineState === 'importing') { event.preventDefault(); try { post('CANCEL_OFFLINE_PACK'); } catch {} } });
  navigator.serviceWorker.addEventListener('message', (event) => applyWorkerMessage(event.data));
  fetch('./offline-manifest.json', { cache: 'no-store' }).then((response) => response.ok ? response.json() : null).then((manifest) => { if (!manifest) return; state.manifest = { total: Array.isArray(manifest.files) ? manifest.files.length : 0, bytes: Number(manifest.totalBytes) || 0 }; if (state.files) state.files.textContent = state.manifest.total.toLocaleString(); if (state.size) state.size.textContent = formatBytes(state.manifest.bytes); }).catch(() => {});
  navigator.serviceWorker.register('./offline-worker.js', { scope: './' }).then((registration) => { state.registration = registration; }).catch((error) => { setState('error', 'Unavailable'); console.warn('[PLAYCHIVE offline] registration failed', error); });
}
