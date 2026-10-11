const OFFLINE_READY_KEY = 'playchive:offline-pack-ready:v1';

function setState(button, status, state, text) {
  if (button) {
    button.dataset.offlineState = state;
    button.disabled = state === 'downloading';
    button.setAttribute('aria-busy', String(state === 'downloading'));
  }
  if (status) status.textContent = text;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

function applyWorkerMessage(button, status, message) {
  if (!message) return;
  if (message.type === 'OFFLINE_PACK_START') {
    const size = formatBytes(message.bytes);
    setState(button, status, 'downloading', size ? `0% · ${size}` : '0% · preparing');
  } else if (message.type === 'OFFLINE_PACK_PROGRESS') {
    const done = message.completed + message.failed;
    const percent = Math.round((done / Math.max(1, message.total)) * 100);
    setState(button, status, 'downloading', `${percent}% · ${done}/${message.total}`);
  } else if (message.type === 'OFFLINE_PACK_DONE') {
    if (message.ready) {
      localStorage.setItem(OFFLINE_READY_KEY, 'true');
      setState(button, status, 'ready', 'Offline ready');
    } else {
      localStorage.removeItem(OFFLINE_READY_KEY);
      setState(button, status, 'partial', `${message.completed}/${message.total} cached`);
    }
  } else if (message.type === 'OFFLINE_PACK_ERROR') {
    setState(button, status, 'error', 'Try again');
    console.warn('[PLAYCHIVE offline]', message.error);
  }
}

export function initOfflinePack() {
  const button = document.getElementById('offline-pack-button');
  const status = document.getElementById('offline-pack-status');
  if (!button || !('serviceWorker' in navigator)) {
    status && (status.textContent = 'Browser cache unavailable');
    return;
  }

  if (localStorage.getItem(OFFLINE_READY_KEY) === 'true') {
    setState(button, status, 'ready', 'Offline ready');
  }

  navigator.serviceWorker.addEventListener('message', (event) => applyWorkerMessage(button, status, event.data));
  navigator.serviceWorker.register('./offline-worker.js', { scope: './' })
    .then((registration) => {
      button.addEventListener('click', async () => {
        if (button.dataset.offlineState === 'downloading') return;
        setState(button, status, 'downloading', 'Preparing…');
        try {
          const active = registration.active || (await navigator.serviceWorker.ready).active;
          if (!active) throw new Error('Offline worker is not active yet. Reload once and try again.');
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => applyWorkerMessage(button, status, event.data);
          active.postMessage({ type: 'DOWNLOAD_OFFLINE_PACK' }, [channel.port2]);
        } catch (error) {
          setState(button, status, 'error', 'Try again');
          console.warn('[PLAYCHIVE offline]', error);
        }
      }, { once: false });
    })
    .catch((error) => {
      setState(button, status, 'error', 'Unavailable');
      console.warn('[PLAYCHIVE offline] registration failed', error);
    });
}
