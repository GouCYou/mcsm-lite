// 统一封装 uni.request，集中处理地址拼接、apikey、超时和错误提示。
import { useConfigStore } from '../stores/config';
import { hideLoading, showLoading, showToast } from '../utils/message';
import { buildRequestUrl } from '../utils/url';

// 创建通用请求方法。
export function request(options = {}) {
  const configStore = useConfigStore();
  const {
    url,
    method = 'GET',
    data = {},
    query = {},
    timeout = 10000,
    loading = false,
    loadingText = '请求中...',
    successTip = '',
  } = options;

  const { baseUrl, apikey } = configStore.state;

  // 未完成连接配置时直接中断请求，避免发出无效调用。
  if (!baseUrl || !apikey) {
    showToast('请先填写 baseUrl 和 apikey');
    return Promise.reject(new Error('Missing baseUrl or apikey'));
  }

  // 所有请求统一自动拼接 apikey。
  const requestUrl = buildRequestUrl(baseUrl, url, {
    ...query,
    apikey,
  });

  if (loading) {
    showLoading(loadingText);
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: requestUrl,
      method,
      data,
      timeout,
      header: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      success: (response) => {
        const { statusCode, data: responseData } = response;

        // 先处理 HTTP 层异常。
        if (statusCode < 200 || statusCode >= 300) {
          const message = `请求失败（HTTP ${statusCode}）`;
          showToast(message);
          reject(new Error(message));
          return;
        }

        // 再处理 MCSManager 业务状态码。
        if (!responseData || responseData.status !== 200) {
          const message = responseData?.message || responseData?.msg || '接口返回异常';
          showToast(message);
          reject(new Error(message));
          return;
        }

        if (successTip) {
          showToast(successTip, 'success');
        }

        resolve(responseData);
      },
      fail: (error) => {
        const message = String(error?.errMsg || '').includes('timeout')
          ? '请求超时，请检查网络或服务状态'
          : '网络请求失败，请检查地址或服务是否可用';

        showToast(message);
        reject(new Error(message));
      },
      complete: () => {
        if (loading) {
          hideLoading();
        }
      },
    });
  });
}
