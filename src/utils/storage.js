// Keep all local-storage keys in one place.
const STORAGE_KEYS = {
  connectionConfig: 'mcsm-lite:connection-config',
};

// Load saved connection data from local storage.
export function loadConnectionConfig() {
  try {
    const value = uni.getStorageSync(STORAGE_KEYS.connectionConfig);
    return value || { baseUrl: '', apikey: '', selectedDaemonId: '' };
  } catch (error) {
    console.error('Failed to load connection config', error);
    return { baseUrl: '', apikey: '', selectedDaemonId: '' };
  }
}

// Persist connection data to local storage.
export function saveConnectionConfig(config) {
  uni.setStorageSync(STORAGE_KEYS.connectionConfig, {
    baseUrl: config.baseUrl || '',
    apikey: config.apikey || '',
    selectedDaemonId: config.selectedDaemonId || '',
  });
}

// Remove saved connection data.
export function clearConnectionConfig() {
  uni.removeStorageSync(STORAGE_KEYS.connectionConfig);
}
