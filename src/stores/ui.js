import { reactive } from 'vue';

const state = reactive({
  toast: {
    visible: false,
    closing: false,
    title: '',
    type: 'info',
  },
  loading: {
    visible: false,
    closing: false,
    title: '处理中...',
  },
});

let toastTimer = 0;
let toastLeaveTimer = 0;
let loadingLeaveTimer = 0;

function clearToastTimers() {
  clearTimeout(toastTimer);
  clearTimeout(toastLeaveTimer);
}

function clearLoadingTimers() {
  clearTimeout(loadingLeaveTimer);
}

function showToast(title = '', type = 'info', duration = 2200) {
  clearToastTimers();
  state.toast.title = String(title || '').trim();
  state.toast.type = type || 'info';
  state.toast.visible = true;
  state.toast.closing = false;

  toastTimer = setTimeout(() => {
    hideToast();
  }, duration);
}

function hideToast(immediate = false) {
  clearToastTimers();

  if (!state.toast.visible) {
    return;
  }

  if (immediate) {
    state.toast.visible = false;
    state.toast.closing = false;
    state.toast.title = '';
    state.toast.type = 'info';
    return;
  }

  state.toast.closing = true;

  toastLeaveTimer = setTimeout(() => {
    state.toast.visible = false;
    state.toast.closing = false;
    state.toast.title = '';
    state.toast.type = 'info';
  }, 180);
}

function showLoading(title = '处理中...') {
  clearLoadingTimers();
  state.loading.title = String(title || '处理中...').trim();
  state.loading.visible = true;
  state.loading.closing = false;
}

function hideLoading(immediate = false) {
  clearLoadingTimers();

  if (!state.loading.visible) {
    return;
  }

  if (immediate) {
    state.loading.visible = false;
    state.loading.closing = false;
    state.loading.title = '处理中...';
    return;
  }

  state.loading.closing = true;

  loadingLeaveTimer = setTimeout(() => {
    state.loading.visible = false;
    state.loading.closing = false;
    state.loading.title = '处理中...';
  }, 180);
}

export function useUiStore() {
  return {
    state,
    showToast,
    hideToast,
    showLoading,
    hideLoading,
  };
}
