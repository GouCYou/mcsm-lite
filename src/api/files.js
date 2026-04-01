// 文件管理相关接口统一维护在这里。
import { request } from './request';

// 统一构造文件管理接口的 query，避免空参数污染请求。
function buildFileQuery(options = {}, extraQuery = {}) {
  const query = {
    daemonId: options.daemonId,
    uuid: options.uuid,
    ...extraQuery,
  };

  return Object.fromEntries(
    // 文件列表接口要求 file_name 可以显式为空字符串，否则 panel 端会把它转成 "undefined"。
    Object.entries(query).filter(([, value]) => value !== undefined && value !== null)
  );
}

// 获取当前目录文件列表。
export function fetchFileList(options = {}) {
  const {
    target = '/',
    page = 0,
    pageSize = 100,
    fileName = '',
    loading = true,
  } = options;

  return request({
    url: '/api/files/list',
    method: 'GET',
    query: buildFileQuery(options, {
      target,
      page,
      page_size: pageSize,
      file_name: fileName,
    }),
    loading,
    loadingText: '正在加载文件列表...',
  });
}

// 读取文件内容。
export function fetchFileContent(options = {}, loading = true) {
  return request({
    url: '/api/files',
    method: 'PUT',
    query: buildFileQuery(options),
    data: {
      target: options.target,
    },
    loading,
    loadingText: '正在读取文件内容...',
  });
}

// 保存文件内容。
export function saveFileContent(options = {}, loading = true) {
  return request({
    url: '/api/files',
    method: 'PUT',
    query: buildFileQuery(options),
    data: {
      target: options.target,
      text: options.text,
    },
    loading,
    loadingText: '正在保存文件...',
    successTip: '文件已保存',
  });
}

// 获取文件系统状态。
export function fetchFileStatus(options = {}, loading = false) {
  return request({
    url: '/api/files/status',
    method: 'GET',
    query: buildFileQuery(options),
    loading,
    loadingText: '正在加载文件状态...',
  });
}

// 新建空文件。
export function touchFile(options = {}) {
  return request({
    url: '/api/files/touch',
    method: 'POST',
    query: buildFileQuery(options),
    data: {
      target: options.target,
    },
    loading: true,
    loadingText: '正在创建文件...',
    successTip: '文件已创建',
  });
}

// 新建文件夹。
export function createFolder(options = {}) {
  return request({
    url: '/api/files/mkdir',
    method: 'POST',
    query: buildFileQuery(options),
    data: {
      target: options.target,
    },
    loading: true,
    loadingText: '正在创建文件夹...',
    successTip: '文件夹已创建',
  });
}

// 获取文件下载/预览地址配置。
export function fetchDownloadAddress(options = {}) {
  return request({
    url: '/api/files/download',
    method: 'POST',
    query: buildFileQuery(options, {
      file_name: options.fileName,
    }),
    loading: false,
  });
}

// 删除文件或目录。
export function deleteFiles(options = {}) {
  return request({
    url: '/api/files',
    method: 'DELETE',
    query: buildFileQuery(options),
    data: {
      targets: options.targets || [],
    },
    loading: true,
    loadingText: '正在删除文件...',
    successTip: '删除成功',
  });
}

// 移动或重命名文件。
export function moveFiles(options = {}) {
  return request({
    url: '/api/files/move',
    method: 'PUT',
    query: buildFileQuery(options),
    data: {
      targets: options.targets || [],
    },
    loading: true,
    loadingText: '正在移动文件...',
    successTip: '操作成功',
  });
}
