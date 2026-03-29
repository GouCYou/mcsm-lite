// 字节数转成人类可读格式。
export function formatBytes(bytes = 0) {
  const value = Number(bytes) || 0;

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
