// Use a lightweight reactive store for phase-one and phase-two data.
import { reactive } from 'vue';
import { clearConnectionConfig, loadConnectionConfig, saveConnectionConfig } from '../utils/storage';
import { normalizeBaseUrl } from '../utils/url';

// Shared application state.
const state = reactive({
  baseUrl: '',
  apikey: '',
  selectedDaemonId: '',
  overview: null,
  initialized: false,
});

// Save the current config snapshot.
function persistConnectionConfig() {
  saveConnectionConfig({
    baseUrl: state.baseUrl,
    apikey: state.apikey,
    selectedDaemonId: state.selectedDaemonId,
  });
}

// Initialize state from local storage.
function initialize() {
  const localConfig = loadConnectionConfig();
  state.baseUrl = normalizeBaseUrl(localConfig.baseUrl);
  state.apikey = String(localConfig.apikey || '').trim();
  state.selectedDaemonId = String(localConfig.selectedDaemonId || '').trim();
  state.initialized = true;
}

// Update the panel connection info.
function setConnectionConfig(config) {
  state.baseUrl = normalizeBaseUrl(config.baseUrl);
  state.apikey = String(config.apikey || '').trim();
  persistConnectionConfig();
}

// Persist the selected daemon id for the instance page.
function setSelectedDaemonId(daemonId) {
  state.selectedDaemonId = String(daemonId || '').trim();
  persistConnectionConfig();
}

// Choose a valid daemon id from the current overview payload.
function syncSelectedDaemonId(overview) {
  const remoteList = overview?.remote || [];

  if (!remoteList.length) {
    state.selectedDaemonId = '';
    persistConnectionConfig();
    return;
  }

  const currentExists = remoteList.some((item) => item.uuid === state.selectedDaemonId);

  if (currentExists) {
    return;
  }

  const availableRemote = remoteList.find((item) => item.available);
  state.selectedDaemonId = availableRemote?.uuid || remoteList[0]?.uuid || '';
  persistConnectionConfig();
}

// Cache the overview data for dashboard and daemon selection.
function setOverview(overview) {
  state.overview = overview || null;
  syncSelectedDaemonId(overview);
}

// Clear connection state.
function reset() {
  state.baseUrl = '';
  state.apikey = '';
  state.selectedDaemonId = '';
  state.overview = null;
  clearConnectionConfig();
}

// Public store accessor.
export function useConfigStore() {
  return {
    state,
    initialize,
    setConnectionConfig,
    setSelectedDaemonId,
    setOverview,
    reset,
  };
}
