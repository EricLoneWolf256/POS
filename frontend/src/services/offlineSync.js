import api from './api';

const OFFLINE_SALES_KEY = 'offline_sales';

export function getOfflineSales() {
  return JSON.parse(localStorage.getItem(OFFLINE_SALES_KEY) || '[]');
}

export async function syncOfflineSales() {
  const sales = getOfflineSales();
  if (!sales.length || !navigator.onLine) return { synced: 0 };

  const results = await api.post('/sync/push', {
    items: sales.map(s => ({
      entityType: 'sale',
      entityId: s.offlineId,
      action: 'create',
      payload: s,
    })),
  });

  const syncedIds = results.data.results
    .filter(r => r.status === 'queued')
    .map(r => r.entityId);

  const remaining = sales.filter(s => !syncedIds.includes(s.offlineId));
  localStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(remaining));

  if (syncedIds.length) {
    await api.post('/sync/process');
  }

  return { synced: syncedIds.length, remaining: remaining.length };
}

export function setupAutoSync() {
  window.addEventListener('online', () => {
    syncOfflineSales().then(({ synced }) => {
      if (synced > 0) console.log(`Synced ${synced} offline sales`);
    });
  });
}
