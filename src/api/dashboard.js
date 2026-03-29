// 仪表盘相关请求统一维护在这里。
import { request } from './request';

// 获取面板概览数据。
export function fetchOverview(options = {}) {
  const { loading = false, loadingText = '正在加载面板数据...' } = options;

  return request({
    url: '/api/overview',
    method: 'GET',
    loading,
    loadingText,
  });
}
