import { useUiStore } from '../stores/ui';

// 统一封装轻提示，收口到自定义玻璃消息层。
export function showToast(title, icon = 'none', duration = 2000) {
  const uiStore = useUiStore();
  const type = icon === 'success' ? 'success' : icon === 'error' ? 'error' : 'info';
  uiStore.showToast(title, type, duration);
}

// 显示全局加载提示。
export function showLoading(title = '加载中...') {
  const uiStore = useUiStore();
  uiStore.showLoading(title);
}

// 关闭全局加载提示。
export function hideLoading() {
  const uiStore = useUiStore();
  uiStore.hideLoading();
}
