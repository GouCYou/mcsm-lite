function parseByteString(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const parsed = parseByteString(item);
      if (parsed > 0) {
        return parsed;
      }
    }
    return 0;
  }

  const rawValue = String(value || '').trim();

  if (!rawValue) {
    return 0;
  }

  const normalizedValue = rawValue.replace(/,/g, '').toUpperCase();
  const directNumeric = Number(normalizedValue);

  if (Number.isFinite(directNumeric)) {
    return directNumeric;
  }

  const matched = normalizedValue.match(/([0-9]+(?:\.[0-9]+)?)\s*(BYTES?|[KMGT]?I?B|[KMGT])/);

  if (!matched) {
    return 0;
  }

  const numericPart = Number(matched[1]);
  const unit = matched[2];
  const unitMap = {
    B: 1,
    BYTE: 1,
    BYTES: 1,
    K: 1024,
    KB: 1024,
    KIB: 1024,
    M: 1024 ** 2,
    MB: 1024 ** 2,
    MIB: 1024 ** 2,
    G: 1024 ** 3,
    GB: 1024 ** 3,
    GIB: 1024 ** 3,
    T: 1024 ** 4,
    TB: 1024 ** 4,
    TIB: 1024 ** 4,
  };

  return Number.isFinite(numericPart) ? numericPart * (unitMap[unit] || 1) : 0;
}

function normalizeRuntimeMemoryValue(value, key = '', hostObject = null) {
  const normalizedKey = String(key || '').toLowerCase();

  if (value == null || value === '') {
    return 0;
  }

  const rawText = typeof value === 'string' ? value.trim() : '';
  const hasExplicitUnit = typeof value === 'string' && /[a-zA-Z]/.test(rawText);

  if (hasExplicitUnit) {
    return parseByteString(value);
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }

  const memoryLimit = parseByteString(hostObject?.memoryLimit);
  const memoryUsagePercent = Number(hostObject?.memoryUsagePercent);

  if (
    normalizedKey === 'memoryusage'
    && memoryLimit > 0
    && Number.isFinite(memoryUsagePercent)
    && memoryUsagePercent > 0
    && numericValue < 1024 * 1024
  ) {
    const ratio = memoryUsagePercent > 1 ? memoryUsagePercent / 100 : memoryUsagePercent;
    const derivedValue = memoryLimit * ratio;
    if (derivedValue > 0) {
      return derivedValue;
    }
  }

  if (
    normalizedKey === 'memoryusage'
    || normalizedKey === 'memorylimit'
    || normalizedKey === 'usedmemory'
  ) {
    if (numericValue < 16384) {
      return numericValue * 1024 * 1024;
    }

    if (numericValue < 1024 * 1024) {
      return numericValue * 1024;
    }
  }

  return numericValue;
}

function findByteValue(input, depth = 0) {
  if (input == null || depth > 5) {
    return undefined;
  }

  if (typeof input === 'number' || typeof input === 'string') {
    return parseByteString(input) > 0 ? input : undefined;
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      const resolved = findByteValue(item, depth + 1);
      if (resolved !== undefined) {
        return resolved;
      }
    }
    return undefined;
  }

  if (typeof input !== 'object') {
    return undefined;
  }

  const preferredKeys = ['memoryusage', 'usedmemory', 'rss', 'memory', 'mem', 'residentsetsize', 'workingsetsize'];
  const objectKeys = Object.keys(input);

  for (const keyName of preferredKeys) {
    const matchedKey = objectKeys.find((key) => key.toLowerCase() === keyName.toLowerCase());
    if (matchedKey) {
      const normalizedValue = normalizeRuntimeMemoryValue(input[matchedKey], matchedKey, input);
      if (normalizedValue > 0) {
        return normalizedValue;
      }
    }
  }

  for (const [key, value] of Object.entries(input)) {
    const normalizedKey = key.toLowerCase();
    const mayBeRuntimeMemory = (
      normalizedKey.includes('memory')
      || normalizedKey === 'mem'
      || normalizedKey === 'rss'
      || normalizedKey.includes('usedmemory')
      || normalizedKey.includes('workingsetsize')
    );

    if (
      mayBeRuntimeMemory
      && !normalizedKey.includes('limit')
      && !normalizedKey.includes('percent')
      && !normalizedKey.includes('max')
      && !normalizedKey.includes('total')
      && !normalizedKey.includes('swap')
    ) {
      const normalizedValue = normalizeRuntimeMemoryValue(value, key, input);
      if (normalizedValue > 0) {
        return normalizedValue;
      }
    }
  }

  for (const [key, value] of Object.entries(input)) {
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey === 'info'
      || normalizedKey === 'processinfo'
      || normalizedKey === 'runtime'
      || normalizedKey === 'resource'
      || normalizedKey === 'stats'
      || normalizedKey === 'process'
      || normalizedKey === 'data'
    ) {
      const resolved = findByteValue(value, depth + 1);
      if (resolved !== undefined) {
        return resolved;
      }
    }
  }

  return undefined;
}

// 从实例运行态对象里提取更可靠的内存值，兼容数字、单位字符串和嵌套对象。
export function extractMemoryValue(input) {
  return findByteValue(input);
}

// 内部字节解析也暴露出来，方便页面判断当前值是否可疑。
export function parseBytesValue(value) {
  return parseByteString(value);
}

// 字节数转成人类可读格式。
export function formatBytes(bytes = 0) {
  const value = parseByteString(bytes);

  if (value <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** index;

  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

// 数值转百分比字符串。
export function formatPercent(value = 0) {
  const numericValue = Number(value) || 0;
  return `${(numericValue * 100).toFixed(1)}%`;
}

// 秒数转简洁运行时长文本。
export function formatUptime(seconds = 0) {
  const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

// 实例状态码转中文状态文本。
export function getInstanceStatusText(status) {
  const numericStatus = Number(status);

  switch (numericStatus) {
    case -1:
      return '忙碌';
    case 0:
      return '已停止';
    case 1:
      return '停止中';
    case 2:
      return '启动中';
    case 3:
      return '运行中';
    default:
      return '未知状态';
  }
}

// 守护节点在线状态转展示文本。
export function getAvailabilityText(available) {
  return available ? '在线' : '离线';
}
