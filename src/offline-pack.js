const OFFLINE_READY_KEY = 'playchive:offline-pack-ready:v2';

const state = {
  button: null,
  status: null,
  dialog: null,
  phase: null,
  fill: null,
  percent: null,
  progress: null,
  files: null,
  size: null,
  cached: null,
  current: null,
  start: null,
  cancel: null,
  clear: null,
  registration: null,
  manifest: null,
};

function setState(next, text) {
  if (state.button) {
    state.button.dataset.offlineState = next;
    state.button.disabled = next === 'downloading';
    state.button.setAttribute('aria-busy', String(next === 'downloading'));
  }
  if (state.status) state.status.textContent = text;
  if (state.dialog) state.dialog.dataset.offlineState = next;
  if (state.cancel) state.cancel.hidden = next !== 'downloading';
  if (state.start) state.start.disabled = next === 'downloading';
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
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
    updateProgress(0, total, 0, 'Preparing local archive…');
    setState('downloading', '0% · preparing');
  } else if (message.type === 'OFFLINE_PACK_PROGRESS') {
    const done = (Number(message.completed) || 0) + (Number(message.failed) || 0);
    const total = Number(message.total) || state.manifest?.total || 1;
    const bytes = Number(message.cachedBytes) || 0;
    if (state.phase) state.phase.textContent = message.failed ? 'Caching with warnings' : 'Building local archive';
    updateProgress(done, total, bytes, message.current ? `Caching ${message.current}` : 'Caching files…');
    setState('downloading', `${Math.round((done / total) * 100)}% · ${done}/${total}`);
  } else if (message.type === 'OFFLINE_PACK_DONE') {
    const total = Number(message.total) || 0;
    updateProgress(Number(message.completed) + Number(message.failed), total, Number(message.cachedBytes) || 0, message.ready ? 'Archive verified on this device' : 'Finished with missing files');
    if (message.ready) {
      localStorage.setItem(OFFLINE_READY_KEY, 'true');
      if (state.phase) state.phase.textContent = 'Archive ready';
      setState('ready', 'Offline ready');
      if (state.start) state.start.textContent = 'Refresh offline pack';
    } else {
      localStorage.removeItem(OFFLINE_READY_KEY);
      if (state.phase) state.phase.textContent = 'Partial archive';
      setState('partial', `${message.completed}/${message.total} cached`);
      if (state.start) state.start.textContent = 'Retry missing files';
    }
  } else if (message.type === 'OFFLINE_PACK_CANCELLED') {
    if (state.phase) state.phase.textContent = 'Download paused';
    if (state.current) state.current.textContent = 'Download cancelled — resume when ready';
    setState('partial', 'Paused');
    if (state.start) state.start.textContent = 'Resume download';
  } else if (message.type === 'OFFLINE_PACK_CLEARED') {
    localStorage.removeItem(OFFLINE_READY_KEY);
    updateProgress(0, state.manifest?.total || 1, 0, 'Local pack cleared');
    if (state.phase) state.phase.textContent = 'Ready to prepare';
    if (state.start) state.start.textContent = 'Prepare offline pack';
    setState('idle', 'Online only');
  } else if (message.type === 'OFFLINE_PACK_ERROR') {
    if (state.phase) state.phase.textContent = 'Could not finish';
    if (state.current) state.current.textContent = message.error || 'Try again in a moment';
    setState('error', 'Try again');
    if (state.start) state.start.textContent = 'Try again';
    console.warn('[PLAYCHIVE offline]', message.error);
  }
}

function post(type) {
  const active = state.registration?.active;
  if (!active) throw new Error('Offline worker is not active yet. Reload once and try again.');
  active.postMessage({ type });
}

function openDialog() {
  if (!state.dialog) return;
  if (typeof state.dialog.showModal === 'function' && !state.dialog.open) state.dialog.showModal();
  else state.dialog.setAttribute('open', '');
}

function closeDialog() {
  if (!state.dialog) return;
  if (state.dialog.open && typeof state.dialog.close === 'function') state.dialog.close();
  else state.dialog.removeAttribute('open');
}

export function initOfflinePack() {
  state.button = document.getElementById('offline-pack-button');
  state.status = document.getElementById('offline-pack-status');
  state.dialog = document.getElementById('offline-pack-dialog');
  state.phase = document.getElementById('offline-pack-phase');
  state.fill = document.getElementById('offline-pack-progress-fill');
  state.percent = document.getElementById('offline-pack-percent');
  state.progress = state.dialog?.querySelector('[role="progressbar"]');
  state.files = document.getElementById('offline-pack-files');
  state.size = document.getElementById('offline-pack-size');
  state.cached = document.getElementById('offline-pack-cached');
  state.current = document.getElementById('offline-pack-current');
  state.start = document.getElementById('offline-pack-start');
  state.cancel = document.getElementById('offline-pack-cancel');
  state.clear = document.getElementById('offline-pack-clear');
  if (!state.button || !('serviceWorker' in navigator)) {
    state.status && (state.status.textContent = 'Browser cache unavailable');
    return;
  }

  if (localStorage.getItem(OFFLINE_READY_KEY) === 'true') {
    setState('ready', 'Offline ready');
    if (state.phase) state.phase.textContent = 'Archive ready on this device';
    if (state.start) state.start.textContent = 'Refresh offline pack';
  }

  state.button.addEventListener('click', openDialog);
  state.dialog?.addEventListener('click', (event) => {
    if (event.target === state.dialog) closeDialog();
    const action = event.target.closest?.('[data-offline-action]')?.dataset.offlineAction;
    if (action === 'close') closeDialog();
    if (action === 'start') {
      try { setState('downloading', 'Preparing…'); if (state.phase) state.phase.textContent = 'Waking archive worker'; post('DOWNLOAD_OFFLINE_PACK'); } catch (error) { applyWorkerMessage({ type: 'OFFLINE_PACK_ERROR', error: error.message }); }
    }
    if (action === 'cancel') { try { post('CANCEL_OFFLINE_PACK'); } catch { /* already stopped */ } }
    if (action === 'clear') { try { post('CLEAR_OFFLINE_PACK'); } catch (error) { applyWorkerMessage({ type: 'OFFLINE_PACK_ERROR', error: error.message }); } }
  });
  state.dialog?.addEventListener('cancel', (event) => { if (state.button.dataset.offlineState === 'downloading') { event.preventDefault(); try { post('CANCEL_OFFLINE_PACK'); } catch {} } });
  navigator.serviceWorker.addEventListener('message', (event) => applyWorkerMessage(event.data));
  fetch('./offline-manifest.json', { cache: 'no-store' }).then((response) => response.ok ? response.json() : null).then((manifest) => {
    if (!manifest) return;
    state.manifest = { total: Array.isArray(manifest.files) ? manifest.files.length : 0, bytes: Number(manifest.totalBytes) || 0 };
    if (state.files) state.files.textContent = state.manifest.total.toLocaleString();
    if (state.size) state.size.textContent = formatBytes(state.manifest.bytes);
  }).catch(() => { /* manifest status is explained when the worker starts */ });
  navigator.serviceWorker.register('./offline-worker.js', { scope: './' })
    .then((registration) => { state.registration = registration; })
    .catch((error) => { setState('error', 'Unavailable'); console.warn('[PLAYCHIVE offline] registration failed', error); });
}
