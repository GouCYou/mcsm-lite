// 实例相关接口统一维护在此处。
import { request } from './request';

// 获取某个节点下的实例列表。
export function fetchInstanceList(options = {}) {
  const {
    daemonId = '',
    page = 1,
    pageSize = 10,
    instanceName = '',
    status = '',
    loading = true,
  } = options;

  return request({
    url: '/api/service/remote_service_instances',
    method: 'GET',
    query: {
      daemonId,
      page,
      page_size: pageSize,
      instance_name: instanceName,
      status,
    },
    loading,
    loadingText: '正在刷新实例列表...',
  });
}

// 获取单个实例详情。
export function fetchInstanceDetail(payload, loading = true) {
  return request({
    url: '/api/instance',
    method: 'GET',
    query: {
      uuid: payload.uuid,
      daemonId: payload.daemonId,
    },
    loading,
    loadingText: '正在加载实例详情...',
  });
}

// 获取实例最近日志。
export function fetchInstanceOutputLog(payload, loading = true) {
  return request({
    url: '/api/protected_instance/outputlog',
    method: 'GET',
    query: {
      uuid: payload.uuid,
      daemonId: payload.daemonId,
      size: payload.size,
    },
    loading,
    loadingText: '正在加载实例日志...',
  });
}

// 向实例发送命令。
export function sendInstanceCommand(payload) {
  return request({
    url: '/api/protected_instance/command',
    method: 'GET',
    query: {
      uuid: payload.uuid,
      daemonId: payload.daemonId,
      command: payload.command,
    },
    loading: true,
    loadingText: '正在发送命令...',
    successTip: '命令已发送',
  });
}

// 抽象实例动作请求，减少重复代码。
function runInstanceAction(url, payload, actionLabel) {
  return request({
    url,
    method: 'GET',
    query: {
      uuid: payload.uuid,
      daemonId: payload.daemonId,
    },
    loading: true,
    loadingText: `正在${actionLabel}...`,
    successTip: `${actionLabel}成功`,
  });
}

// 启动实例。
export function startInstance(payload) {
  return runInstanceAction('/api/protected_instance/open', payload, '启动实例');
}

// 停止实例。
export function stopInstance(payload) {
  return runInstanceAction('/api/protected_instance/stop', payload, '停止实例');
}

// 重启实例。
export function restartInstance(payload) {
  return runInstanceAction('/api/protected_instance/restart', payload, '重启实例');
}

// 强制结束实例。
export function killInstance(payload) {
  return runInstanceAction('/api/protected_instance/kill', payload, '结束实例');
}
