// 清理用户输入的地址，避免结尾斜杠导致接口路径重复。
export function normalizeBaseUrl(baseUrl = '') {
  return String(baseUrl).trim().replace(/\/+$/, '');
}

// 补全用户输入的面板地址，允许只输入 IP 或域名。
export function completeBaseUrlInput(baseUrl = '') {
  const rawValue = String(baseUrl || '').trim();

  if (!rawValue) {
    return '';
  }

  const withProtocol = /^https?:\/\//i.test(rawValue) ? rawValue : `http://${rawValue}`;

  try {
    const parsedUrl = new URL(withProtocol);

    if (!parsedUrl.port) {
      parsedUrl.port = '23333';
    }

    return normalizeBaseUrl(parsedUrl.toString());
  } catch (error) {
    return normalizeBaseUrl(withProtocol);
  }
}

// 将对象转换为 query 字符串。
export function buildQueryString(query = {}) {
  // 某些后端会区分“缺少参数”和“空字符串参数”，这里保留空字符串，只过滤 undefined/null。
  const queryEntries = Object.entries(query).filter(([, value]) => value !== undefined && value !== null);

  if (!queryEntries.length) {
    return '';
  }

  return queryEntries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

// 拼接完整请求地址。
export function buildRequestUrl(baseUrl, path, query = {}) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const queryString = buildQueryString(query);

  return queryString ? `${normalizedBaseUrl}${normalizedPath}?${queryString}` : `${normalizedBaseUrl}${normalizedPath}`;
}
