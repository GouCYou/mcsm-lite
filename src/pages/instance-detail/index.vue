<template>
  <AppPageScroll :refreshing="refreshing" @refresh="handlePageRefresh">
    <view class="app-page app-stack">
      <view class="app-card app-hero-card">
        <view class="detail-title-row">
          <view>
            <view class="app-page-title">{{ detailView.nickname }}</view>
            <view class="app-page-desc">{{ detailView.instanceUuid }}</view>
          </view>
          <view class="app-pill" :class="detailView.statusVariant">{{ detailView.statusText }}</view>
        </view>

        <view class="hero-summary">
          <view class="summary-item">
            <text class="summary-label">内存</text>
            <text class="summary-value">{{ detailView.memoryText }}</text>
          </view>
          <view class="summary-item">
            <text class="summary-label">CPU</text>
            <text class="summary-value">{{ detailView.cpuText }}</text>
          </view>
          <view class="summary-item">
            <text class="summary-label">玩家</text>
            <text class="summary-value">{{ detailView.playersText }}</text>
          </view>
        </view>
      </view>

      <view class="app-card">
        <view class="app-section-head">
          <view class="app-section-title">实例操作</view>
        </view>

        <view class="action-row">
          <view
            class="action-pill-button"
            :class="[primaryAction.variant, { disabled: primaryAction.disabled, loading: isActionLoading(primaryAction.key) }]"
            @click="handlePrimaryInstanceAction"
          >
            <view class="action-icon" :class="primaryAction.iconClass" />
            <text class="action-label">{{ primaryAction.label }}</text>
          </view>

          <view
            class="action-pill-button neutral"
            :class="{ disabled: isActionDisabled('restart'), loading: isActionLoading('restart') }"
            @click="handleInstanceAction('restart')"
          >
            <view class="action-icon icon-restart" />
            <text class="action-label">重启</text>
          </view>

          <view
            class="action-pill-button danger-outline"
            :class="{ disabled: isActionDisabled('kill'), loading: isActionLoading('kill') }"
            @click="handleInstanceAction('kill')"
          >
            <view class="action-icon icon-close" />
            <text class="action-label">终止</text>
          </view>
        </view>
      </view>

      <view class="app-card">
        <view class="app-section-head">
          <view class="app-section-title">控制台</view>
        </view>

        <view class="app-code-box log-box">
          <scroll-view scroll-x enhanced :show-scrollbar="false" class="log-scroll-x" @touchmove.stop>
            <scroll-view scroll-y enhanced :show-scrollbar="false" class="log-scroll-y" @touchmove.stop>
              <view class="log-content-wrap">
                <view v-for="(line, index) in displayLogLines" :key="`${index}-${line}`" class="log-line">
                  <text selectable space="nbsp" class="log-text" :class="{ 'log-text-error': isErrorLine(line) }">
                    {{ line || ' ' }}
                  </text>
                </view>
              </view>
            </scroll-view>
          </scroll-view>
          <view class="log-scrollbar-mask" />
        </view>

        <view class="command-row">
          <input
            v-model.trim="commandText"
            class="app-input command-input"
            type="text"
            placeholder="例如：say hello 或 stop"
            confirm-type="send"
            @confirm="handleSendCommand"
          />
          <view class="send-button" @click="handleSendCommand">
            <view class="send-icon" />
          </view>
        </view>
      </view>

      <view class="app-card">
        <view class="app-section-head">
          <view class="app-section-title">基础信息</view>
        </view>

        <view class="info-grid">
          <view class="info-item">
            <text class="info-label">运行目录</text>
            <text class="info-value">{{ detailView.cwdText }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">开启命令</text>
            <text class="info-value">{{ detailView.startCommandText }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">关闭命令</text>
            <text class="info-value">{{ detailView.stopCommandText }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">开启次数</text>
            <text class="info-value">{{ detailView.startedText }}</text>
          </view>
        </view>
      </view>

      <view class="app-card">
        <view class="app-section-head">
          <view>
            <view class="app-section-title">文件管理</view>
            <view class="app-muted">用悬浮窗浏览目录、预览文本、保存修改。</view>
          </view>
          <button size="mini" type="primary" @click="openFileManager">打开</button>
        </view>

        <view class="file-summary-grid">
          <view class="file-summary-item">
            <text class="file-summary-label">平台</text>
            <text class="file-summary-value">{{ fileStatus.platform || '待获取' }}</text>
          </view>
          <view class="file-summary-item">
            <text class="file-summary-label">实例任务</text>
            <text class="file-summary-value">{{ fileStatus.instanceFileTask }}</text>
          </view>
          <view class="file-summary-item">
            <text class="file-summary-label">全局任务</text>
            <text class="file-summary-value">{{ fileStatus.globalFileTask }}</text>
          </view>
          <view class="file-summary-item">
            <text class="file-summary-label">下载任务</text>
            <text class="file-summary-value">{{ fileStatus.downloadFileFromURLTask }}</text>
          </view>
        </view>

        <view class="app-text">当前目录：{{ fileState.target }}</view>
        <view v-if="fileState.absolutePath" class="app-muted">实际路径：{{ fileState.absolutePath }}</view>
        <view v-if="fileState.error" class="file-inline-error">{{ fileState.error }}</view>
      </view>
    </view>

    <view v-if="fileModal.visible" class="modal-mask" @click="closeFileManager">
      <view class="modal-sheet" @click.stop>
        <view class="modal-handle" />

        <view class="modal-head">
          <view>
            <view class="modal-title">文件管理</view>
            <view class="modal-subtitle">轻触文件夹直接进入，轻触文件直接预览。</view>
          </view>
          <view class="modal-close" @click="closeFileManager">关闭</view>
        </view>

        <view class="path-toolbar">
          <view class="path-action" :class="{ disabled: fileState.target === '/' }" @click="goParentDirectory">
            <view class="path-action-icon icon-arrow-left" />
          </view>

          <view class="path-chip-box">
            <view class="path-chip-label">当前目录</view>
            <view class="path-chip-value">{{ fileState.target }}</view>
            <view v-if="fileState.absolutePath" class="path-chip-desc">{{ fileState.absolutePath }}</view>
          </view>

          <view class="path-action" @click="refreshFiles">
            <view class="path-action-icon icon-refresh-mini" />
          </view>
          <view class="path-action path-action-primary" @click="openCreateActionSheet">
            <view class="path-action-icon icon-plus-mini" />
          </view>
        </view>

        <view v-if="fileState.error" class="file-error-box">
          <view class="file-error-title">文件列表加载失败</view>
          <view class="file-error-text">{{ fileState.error }}</view>
          <button size="mini" type="primary" @click="refreshFiles">重新加载</button>
        </view>

        <scroll-view
          scroll-y
          enhanced
          :show-scrollbar="false"
          class="file-list-scroll"
          :class="{ 'file-list-scroll-with-preview': filePreview.visible }"
        >
          <view v-if="fileState.loading && !fileItems.length" class="app-empty">正在加载文件列表...</view>
          <view v-else-if="!fileItems.length && !fileState.error" class="app-empty">当前目录暂无文件内容。</view>

          <view v-else class="file-list">
            <view v-for="item in fileItems" :key="item.key" class="file-card">
              <view class="file-card-main" @click="handleFileCardPress(item)">
                <view class="file-icon" :class="{ directory: item.isDirectory }">
                  <text>{{ item.isDirectory ? 'DIR' : 'TXT' }}</text>
                </view>

                <view class="file-meta">
                  <view class="file-title">{{ item.name }}</view>
                  <view class="file-subline">
                    <text>{{ item.typeText }}</text>
                    <text>{{ item.sizeText }}</text>
                  </view>
                  <view class="file-time">{{ item.timeText }}</view>
                </view>

                <view class="file-more-button" @click.stop="openEntryActionSheet(item)">
                  <view class="file-more-dot" />
                  <view class="file-more-dot" />
                  <view class="file-more-dot" />
                </view>
              </view>
            </view>
          </view>
        </scroll-view>

        <view v-if="filePreview.visible" class="preview-drawer">
          <view class="preview-head">
            <view>
              <view class="preview-title">文件预览</view>
              <view class="preview-path">{{ filePreview.target }}</view>
            </view>
            <view class="preview-close" @click="closePreview">收起</view>
          </view>

          <textarea v-model="filePreview.content" class="editor-box" />

          <view class="preview-actions">
            <button size="mini" type="primary" @click="saveCurrentPreview">保存</button>
            <button size="mini" @click="fetchCurrentDownloadInfo">下载地址</button>
          </view>

          <view v-if="downloadInfo.url" class="download-box">
            <view class="app-text">{{ downloadInfo.url }}</view>
            <view class="app-toolbar">
              <button size="mini" @click="copyDownloadUrl">复制链接</button>
            </view>
          </view>
        </view>
      </view>
    </view>
  </AppPageScroll>
</template>

<script setup>
// 实例详情页负责展示日志、实例操作和文件管理弹层。
import { computed, reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import {
  createFolder,
  deleteFiles,
  fetchDownloadAddress,
  fetchFileContent,
  fetchFileList,
  fetchFileStatus,
  moveFiles,
  saveFileContent,
  touchFile,
} from '../../api/files';
import {
  fetchInstanceDetail,
  fetchInstanceOutputLog,
  killInstance,
  restartInstance,
  sendInstanceCommand,
  startInstance,
  stopInstance,
} from '../../api/instances';
import AppPageScroll from '../../components/AppPageScroll.vue';
import { useConfigStore } from '../../stores/config';
import { formatBytes, formatPercent, getInstanceStatusText } from '../../utils/format';
import { showToast } from '../../utils/message';

// 获取全局连接配置，用于拼装下载地址。
const configStore = useConfigStore();

// 记录当前实例的路由参数。
const daemonId = ref('');
const uuid = ref('');

// 缓存详情、日志和命令输入。
const detail = ref(null);
const outputLog = ref('');
const commandText = ref('');
const currentAction = ref('');
const isRefreshing = ref(false);

// 文件系统相关状态。
const fileItems = ref([]);
const fileState = reactive({
  target: '/',
  page: 0,
  pageSize: 100,
  loading: false,
  loaded: false,
  error: '',
  absolutePath: '',
});

// 文件管理弹层状态。
const fileModal = reactive({
  visible: false,
});

// 文件预览状态。
const filePreview = reactive({
  visible: false,
  target: '',
  content: '',
});

// 下载链接状态。
const downloadInfo = reactive({
  url: '',
});

// 文件系统任务摘要。
const fileStatus = reactive({
  platform: '',
  instanceFileTask: 0,
  globalFileTask: 0,
  downloadFileFromURLTask: 0,
  disks: [],
});

// 对实例详情做一层展示转换，减少模板判断。
const detailView = computed(() => {
  const raw = detail.value || {};
  const config = raw.config || {};
  const info = raw.info || {};
  const processInfo = raw.processInfo || {};
  const currentPlayers = Number(info.currentPlayers);
  const maxPlayers = Number(info.maxPlayers);
  const status = Number(raw.status ?? 0);

  return {
    nickname: config.nickname || raw.instanceUuid || '实例详情',
    instanceUuid: raw.instanceUuid || uuid.value || '-',
    status,
    statusText: getInstanceStatusText(raw.status),
    statusVariant: getStatusVariant(status),
    cwdText: config.cwd || '-',
    startCommandText: config.startCommand || '-',
    stopCommandText: config.stopCommand || '-',
    cpuText: formatPercent(processInfo.cpu),
    memoryText: formatBytes(processInfo.memory),
    playersText: currentPlayers >= 0 && maxPlayers >= 0 ? `${currentPlayers}/${maxPlayers}` : '暂无数据',
    startedText: Number(raw.started || 0),
  };
});

// 页面下拉刷新依赖计算属性暴露状态。
const refreshing = computed(() => isRefreshing.value);

// 清理 ANSI 控制字符，避免日志里出现颜色码残留。
const displayOutputLog = computed(() => normalizeConsoleLog(outputLog.value || '暂无日志输出'));

// 控制台按行渲染，方便对 ERROR 做高亮。
const displayLogLines = computed(() => displayOutputLog.value.split('\n'));

// 根据实例当前状态生成主操作按钮。
const primaryAction = computed(() => {
  const status = detailView.value.status;

  if (status === 3) {
    return {
      key: 'stop',
      label: '关闭',
      variant: 'danger-fill',
      iconClass: 'icon-stop',
      disabled: isActionDisabled('stop'),
    };
  }

  if (status === 2) {
    return {
      key: 'start',
      label: '开启中',
      variant: 'primary',
      iconClass: 'icon-play',
      disabled: true,
    };
  }

  return {
    key: 'start',
    label: '开启',
    variant: 'primary',
    iconClass: 'icon-play',
    disabled: isActionDisabled('start'),
  };
});

// 页面加载时读取实例参数并初始化数据。
onLoad(async (options) => {
  daemonId.value = String(options?.daemonId || '');
  uuid.value = String(options?.uuid || '');
  await refreshAll();
});

// 页面整体下拉刷新。
async function handlePageRefresh() {
  if (isRefreshing.value) {
    return;
  }

  isRefreshing.value = true;

  try {
    await refreshAll();
  } finally {
    isRefreshing.value = false;
  }
}

// 统一刷新详情、日志和文件状态。
async function refreshAll() {
  if (!daemonId.value || !uuid.value) {
    showToast('缺少实例参数');
    return;
  }

  await Promise.all([loadDetail(true), loadLog(false), loadFileStatus(false)]);

  if (fileModal.visible || fileState.loaded) {
    await loadFiles(false);
  }
}

// 获取实例详情。
async function loadDetail(showLoading) {
  try {
    const response = await fetchInstanceDetail(
      {
        daemonId: daemonId.value,
        uuid: uuid.value,
      },
      showLoading
    );

    detail.value = response.data || null;
  } catch (error) {
    console.error('加载实例详情失败', error);
  }
}

// 获取实例最近日志。
async function loadLog(showLoading) {
  try {
    const response = await fetchInstanceOutputLog(
      {
        daemonId: daemonId.value,
        uuid: uuid.value,
        size: 8192,
      },
      showLoading
    );

    outputLog.value = String(response.data || '');
  } catch (error) {
    console.error('加载实例日志失败', error);
  }
}

// 获取文件任务和平台信息。
async function loadFileStatus(showLoading) {
  try {
    const response = await fetchFileStatus(
      {
        daemonId: daemonId.value,
        uuid: uuid.value,
      },
      showLoading
    );

    Object.assign(fileStatus, response.data || {});
  } catch (error) {
    console.error('加载文件状态失败', error);
  }
}

// 打开文件管理弹层，并在首次打开时加载目录数据。
async function openFileManager() {
  fileModal.visible = true;

  if (!fileState.loaded || fileState.error) {
    await refreshFiles();
  }
}

// 关闭文件管理弹层。
function closeFileManager() {
  fileModal.visible = false;
}

// 加载当前目录文件列表。
async function loadFiles(showLoading) {
  fileState.loading = true;
  fileState.error = '';

  try {
    const response = await fetchFileList({
      daemonId: daemonId.value,
      uuid: uuid.value,
      target: fileState.target,
      page: fileState.page,
      pageSize: fileState.pageSize,
      loading: showLoading,
    });

    const items = extractFileItems(response);
    fileState.absolutePath = extractAbsolutePath(response);
    fileItems.value = items.map(mapFileItem);
    fileState.loaded = true;

    console.log('file list response', {
      requestTarget: fileState.target,
      absolutePath: fileState.absolutePath,
      itemsCount: items.length,
      total: Number(response?.data?.total ?? response?.total ?? 0),
    });
  } catch (error) {
    console.error('加载文件列表失败', error);
    fileItems.value = [];
    fileState.loaded = true;
    fileState.error = error?.message || '文件列表加载失败';
    fileState.absolutePath = '';
  } finally {
    fileState.loading = false;
  }
}

// 统一刷新文件状态和当前目录列表。
async function refreshFiles() {
  await Promise.all([loadFileStatus(false), loadFiles(true)]);
}

// 发送命令后优先刷新日志，再补刷新详情和文件状态。
async function handleSendCommand() {
  if (!commandText.value) {
    showToast('请输入命令');
    return;
  }

  try {
    await sendInstanceCommand({
      daemonId: daemonId.value,
      uuid: uuid.value,
      command: commandText.value,
    });

    commandText.value = '';

    await wait(500);
    await loadLog(true);
    await Promise.all([loadDetail(false), loadFileStatus(false)]);
  } catch (error) {
    console.error('发送实例命令失败', error);
  }
}

// 统一处理主操作按钮点击。
async function handlePrimaryInstanceAction() {
  if (primaryAction.value.disabled) {
    return;
  }

  await handleInstanceAction(primaryAction.value.key);
}

// 执行实例动作。
async function handleInstanceAction(action) {
  const actionMap = {
    start: startInstance,
    stop: stopInstance,
    restart: restartInstance,
    kill: killInstance,
  };

  const actionFn = actionMap[action];

  if (!actionFn) {
    return;
  }

  currentAction.value = action;

  try {
    await actionFn({
      daemonId: daemonId.value,
      uuid: uuid.value,
    });

    await refreshAll();
  } catch (error) {
    console.error(`执行实例动作失败: ${action}`, error);
  } finally {
    currentAction.value = '';
  }
}

// 判断某个按钮是否处于加载状态。
function isActionLoading(action) {
  return currentAction.value === action;
}

// 按当前实例状态禁用无效动作。
function isActionDisabled(action) {
  if (currentAction.value && currentAction.value !== action) {
    return true;
  }

  const status = detailView.value.status;

  if (action === 'start') {
    return status === 2 || status === 3;
  }

  if (action === 'stop' || action === 'kill') {
    return status === 0 || status === 1;
  }

  if (action === 'restart') {
    return status === 0 || status === 1 || status === 2;
  }

  return false;
}

// 打开新建动作面板。
function openCreateActionSheet() {
  uni.showActionSheet({
    itemList: ['新建文件', '新建文件夹'],
    success: async ({ tapIndex }) => {
      if (tapIndex === 0) {
        await handleCreateFile();
      }

      if (tapIndex === 1) {
        await handleCreateFolder();
      }
    },
  });
}

// 新建文件。
async function handleCreateFile() {
  const name = await promptTextInput('新建文件', '输入文件名');

  if (!name) {
    return;
  }

  try {
    await touchFile({
      daemonId: daemonId.value,
      uuid: uuid.value,
      target: joinPath(fileState.target, name),
    });

    await loadFiles(false);
  } catch (error) {
    console.error('新建文件失败', error);
  }
}

// 新建文件夹。
async function handleCreateFolder() {
  const name = await promptTextInput('新建文件夹', '输入文件夹名');

  if (!name) {
    return;
  }

  try {
    await createFolder({
      daemonId: daemonId.value,
      uuid: uuid.value,
      target: joinPath(fileState.target, name),
    });

    await loadFiles(false);
  } catch (error) {
    console.error('新建文件夹失败', error);
  }
}

// 卡片主体点击后，目录直接打开，文件直接预览。
async function handleFileCardPress(item) {
  if (item.isDirectory) {
    await openDirectory(item);
    return;
  }

  await handleFileItemClick(item);
}

// 打开文件或目录的动作面板。
function openEntryActionSheet(item) {
  const itemList = item.isDirectory
    ? ['打开', '重命名', '删除']
    : ['预览', '下载地址', '重命名', '删除'];

  uni.showActionSheet({
    itemList,
    success: async ({ tapIndex }) => {
      if (item.isDirectory) {
        if (tapIndex === 0) {
          await openDirectory(item);
        }

        if (tapIndex === 1) {
          await handleRenameEntry(item);
        }

        if (tapIndex === 2) {
          await handleDeleteEntry(item);
        }

        return;
      }

      if (tapIndex === 0) {
        await handleFileItemClick(item);
      }

      if (tapIndex === 1) {
        await fetchItemDownloadInfo(item);
      }

      if (tapIndex === 2) {
        await handleRenameEntry(item);
      }

      if (tapIndex === 3) {
        await handleDeleteEntry(item);
      }
    },
  });
}

// 打开目录并刷新目录列表。
async function openDirectory(item) {
  fileState.target = item.fullPath;
  fileState.page = 0;
  closePreview();
  await loadFiles(true);
}

// 直接尝试读取文件内容，不再先按扩展名拦截。
async function handleFileItemClick(item) {
  try {
    const response = await fetchFileContent(
      {
        daemonId: daemonId.value,
        uuid: uuid.value,
        target: item.fullPath,
      },
      true
    );

    filePreview.visible = true;
    filePreview.target = item.fullPath;
    filePreview.content = extractFileContent(response);
    downloadInfo.url = '';
  } catch (error) {
    console.error('读取文件内容失败', error);
  }
}

// 返回上一级目录。
async function goParentDirectory() {
  if (fileState.target === '/') {
    return;
  }

  fileState.target = getParentPath(fileState.target);
  fileState.page = 0;
  closePreview();
  await loadFiles(true);
}

// 重命名单个文件或目录。
async function handleRenameEntry(item) {
  const nextName = await promptTextInput('重命名', '输入新的名称', item.name);

  if (!nextName || nextName === item.name) {
    return;
  }

  const targetPath = joinPath(getParentPath(item.fullPath), nextName);

  try {
    await moveFiles({
      daemonId: daemonId.value,
      uuid: uuid.value,
      targets: [[item.fullPath, targetPath]],
    });

    if (filePreview.target === item.fullPath) {
      filePreview.target = targetPath;
    }

    await loadFiles(false);
  } catch (error) {
    console.error('重命名文件失败', error);
  }
}

// 删除单个文件或目录。
async function handleDeleteEntry(item) {
  const confirmed = await confirmAction(item.isDirectory ? '确认删除这个文件夹吗？' : '确认删除这个文件吗？');

  if (!confirmed) {
    return;
  }

  try {
    await deleteFiles({
      daemonId: daemonId.value,
      uuid: uuid.value,
      targets: [item.fullPath],
    });

    if (filePreview.target === item.fullPath) {
      closePreview();
    }

    await loadFiles(false);
  } catch (error) {
    console.error('删除文件失败', error);
  }
}

// 关闭文件预览。
function closePreview() {
  filePreview.visible = false;
  filePreview.target = '';
  filePreview.content = '';
  downloadInfo.url = '';
}

// 保存当前预览文件内容。
async function saveCurrentPreview() {
  if (!filePreview.target) {
    return;
  }

  try {
    await saveFileContent(
      {
        daemonId: daemonId.value,
        uuid: uuid.value,
        target: filePreview.target,
        text: filePreview.content,
      },
      true
    );
  } catch (error) {
    console.error('保存文件失败', error);
  }
}

// 给当前预览文件生成下载链接。
async function fetchCurrentDownloadInfo() {
  if (!filePreview.target) {
    showToast('请先选择文件');
    return;
  }

  await fetchDownloadInfo(filePreview.target);
}

// 给列表中的文件生成下载链接。
async function fetchItemDownloadInfo(item) {
  await fetchDownloadInfo(item.fullPath);
}

// 统一请求下载地址配置，并拼出可复制链接。
async function fetchDownloadInfo(targetPath) {
  try {
    const response = await fetchDownloadAddress({
      daemonId: daemonId.value,
      uuid: uuid.value,
      fileName: targetPath,
    });

    const addr = String(response.data?.addr || '');
    const password = String(response.data?.password || '');
    const baseScheme = configStore.state.baseUrl.startsWith('https://') ? 'https' : 'http';
    const normalizedAddr = /^https?:\/\//i.test(addr) ? addr : `${baseScheme}://${addr}`;
    const fileName = targetPath.split('/').filter(Boolean).pop() || 'download';

    downloadInfo.url = `${normalizedAddr}/download/${password}/${encodeURIComponent(fileName)}`;
    showToast('下载地址已生成', 'success');
  } catch (error) {
    console.error('生成下载地址失败', error);
  }
}

// 复制下载链接。
function copyDownloadUrl() {
  if (!downloadInfo.url) {
    showToast('暂无下载链接');
    return;
  }

  uni.setClipboardData({
    data: downloadInfo.url,
    success: () => {
      showToast('下载链接已复制', 'success');
    },
  });
}

// 删除前弹出确认框。
function confirmAction(content) {
  return new Promise((resolve) => {
    uni.showModal({
      title: '确认操作',
      content,
      success: (result) => {
        resolve(Boolean(result.confirm));
      },
      fail: () => {
        resolve(false);
      },
    });
  });
}

// 使用原生输入弹窗，减少页面内联表单堆叠。
function promptTextInput(title, placeholderText, content = '') {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      editable: true,
      placeholderText,
      content,
      success: (result) => {
        if (!result.confirm) {
          resolve('');
          return;
        }

        resolve(String(result.content || '').trim());
      },
      fail: () => {
        resolve('');
      },
    });
  });
}

// 把响应里的文件列表兼容成统一数组结构。
function extractFileItems(response) {
  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

// 提取接口返回里的绝对路径，方便判断后端实际解析到了哪里。
function extractAbsolutePath(response) {
  if (typeof response?.data?.absolutePath === 'string') {
    return response.data.absolutePath;
  }

  if (typeof response?.absolutePath === 'string') {
    return response.absolutePath;
  }

  return '';
}

// 把响应里的文件文本兼容成统一字符串。
function extractFileContent(response) {
  if (typeof response?.data === 'string') {
    return response.data;
  }

  if (typeof response === 'string') {
    return response;
  }

  return String(response?.data ?? '');
}

// 统一文件列表项的展示字段。
function mapFileItem(item) {
  const fullPath = joinPath(fileState.target, item.name);
  const isDirectory = Number(item.type) === 0;

  return {
    ...item,
    key: `${fullPath}:${item.time}:${item.size}`,
    fullPath,
    isDirectory,
    typeText: isDirectory ? '文件夹' : '文件',
    sizeText: isDirectory ? '-' : formatBytes(item.size),
    timeText: item.time || '-',
  };
}

// 统一实例状态标签样式。
function getStatusVariant(status) {
  if (status === 3) {
    return 'success';
  }

  if (status === 2 || status === 1 || status === -1) {
    return 'warn';
  }

  return '';
}

// 简单等待一段时间，给后端产生日志的时间。
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// 拼接文件路径。
function joinPath(basePath, name) {
  const normalizedBasePath = String(basePath || '');
  const useWindowsSeparator = /[a-zA-Z]:[\\/]/.test(normalizedBasePath) || normalizedBasePath.includes('\\');

  if (useWindowsSeparator) {
    const cleanedBase = normalizedBasePath.replace(/[\\/]+$/, '');
    const cleanedName = String(name || '').replace(/^[\\/]+/, '');
    return `${cleanedBase}\\${cleanedName}`;
  }

  if (basePath === '/' || !basePath) {
    return `/${name}`;
  }

  return `${basePath}/${name}`.replace(/\/+/g, '/');
}

// 兼容 Unix/Windows 两种目录格式，获取上一级目录。
function getParentPath(targetPath) {
  const normalizedTargetPath = String(targetPath || '');

  if (!normalizedTargetPath || normalizedTargetPath === '/') {
    return '/';
  }

  if (/[a-zA-Z]:[\\/]/.test(normalizedTargetPath) || normalizedTargetPath.includes('\\')) {
    const normalized = normalizedTargetPath.replace(/\//g, '\\').replace(/[\\]+$/, '');
    const driveRootMatch = normalized.match(/^[a-zA-Z]:$/);

    if (driveRootMatch) {
      return `${normalized}\\`;
    }

    const segments = normalized.split('\\').filter(Boolean);

    if (segments.length <= 1) {
      return normalized.endsWith('\\') ? normalized : `${normalized}\\`;
    }

    const parent = segments.slice(0, -1).join('\\');
    return /^[a-zA-Z]:$/.test(parent) ? `${parent}\\` : parent;
  }

  const parts = normalizedTargetPath.split('/').filter(Boolean);
  parts.pop();
  return parts.length ? `/${parts.join('/')}` : '/';
}

// 清理控制台日志中的 ANSI 颜色码和控制字符。
function normalizeConsoleLog(value = '') {
  return String(value)
    .replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '')
    .replace(/\u001b[@-_]/g, '')
    .replace(/\r/g, '')
    .replace(/\u0008/g, '')
    .replace(/\u0000/g, '');
}

// 命中 ERROR 的日志行直接标红。
function isErrorLine(line = '') {
  return /\bERROR\b/i.test(String(line));
}
</script>

<style scoped>
.detail-title-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.hero-summary {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 24rpx;
}

.summary-item {
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.62);
}

.summary-label {
  display: block;
  font-size: 22rpx;
  color: #64748b;
}

.summary-value {
  display: block;
  margin-top: 10rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #0f172a;
  word-break: break-all;
}

.action-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18rpx;
}

.action-pill-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  min-height: 84rpx;
  padding: 0 18rpx;
  border-radius: 20rpx;
  border: 1rpx solid rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.06);
  box-sizing: border-box;
}

.action-pill-button.primary {
  color: #ffffff;
  border: none;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.action-pill-button.neutral {
  color: #111827;
}

.action-pill-button.danger-outline {
  color: #ef4444;
  border-color: rgba(248, 113, 113, 0.9);
  background: rgba(255, 255, 255, 0.98);
}

.action-pill-button.danger-fill {
  color: #ffffff;
  border: none;
  background: linear-gradient(135deg, #fb7185, #ef4444);
}

.action-pill-button.disabled {
  opacity: 0.55;
}

.action-label {
  font-size: 28rpx;
  font-weight: 600;
}

.action-icon {
  position: relative;
  width: 28rpx;
  height: 28rpx;
}

.icon-play::before {
  content: '';
  position: absolute;
  left: 6rpx;
  top: 2rpx;
  width: 0;
  height: 0;
  border-top: 12rpx solid transparent;
  border-bottom: 12rpx solid transparent;
  border-left: 18rpx solid currentColor;
}

.icon-stop::before,
.icon-stop::after {
  content: '';
  position: absolute;
  top: 2rpx;
  width: 4rpx;
  height: 22rpx;
  border-radius: 4rpx;
  background: currentColor;
}

.icon-stop::before {
  left: 7rpx;
}

.icon-stop::after {
  right: 7rpx;
}

.icon-close::before,
.icon-close::after {
  content: '';
  position: absolute;
  left: 12rpx;
  top: 2rpx;
  width: 4rpx;
  height: 24rpx;
  border-radius: 4rpx;
  background: currentColor;
}

.icon-close::before {
  transform: rotate(45deg);
}

.icon-close::after {
  transform: rotate(-45deg);
}

.icon-restart::before,
.icon-restart::after {
  content: '';
  position: absolute;
}

.icon-restart::before {
  left: 4rpx;
  top: 4rpx;
  width: 18rpx;
  height: 18rpx;
  border: 3rpx solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
}

.icon-restart::after {
  right: 1rpx;
  top: 1rpx;
  width: 0;
  height: 0;
  border-left: 8rpx solid currentColor;
  border-top: 6rpx solid transparent;
  border-bottom: 6rpx solid transparent;
  transform: rotate(18deg);
}

.log-box {
  position: relative;
  height: 680rpx;
  margin-top: 18rpx;
  padding: 0;
  overflow: hidden;
}

.log-scroll-x {
  width: 100%;
  height: 100%;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.log-scroll-y {
  width: max-content;
  min-width: 100%;
  height: 100%;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.log-scroll-x::-webkit-scrollbar,
.log-scroll-y::-webkit-scrollbar,
.file-list-scroll::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.log-content-wrap {
  display: inline-block;
  min-width: 100%;
  min-height: 100%;
  padding: 18rpx 20rpx 24rpx;
  box-sizing: border-box;
}

.log-line {
  width: max-content;
  min-width: 100%;
}

.log-text {
  display: block;
  color: #e2e8f0;
  font-size: 16rpx;
  line-height: 1.38;
  font-family: Consolas, Monaco, monospace;
  white-space: pre;
  word-break: normal;
}

.log-text-error {
  color: #ef4444;
}

.log-scrollbar-mask {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 16rpx;
  background: #0f172a;
  pointer-events: none;
}

.command-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 20rpx;
}

.command-input {
  flex: 1;
  margin-top: 0;
}

.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  min-width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
  box-shadow: 0 14rpx 28rpx rgba(37, 99, 235, 0.22);
}

.send-icon {
  width: 0;
  height: 0;
  margin-left: 6rpx;
  border-top: 12rpx solid transparent;
  border-bottom: 12rpx solid transparent;
  border-left: 24rpx solid #ffffff;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.info-item {
  padding: 20rpx;
  border-radius: 22rpx;
  background: rgba(248, 250, 252, 0.9);
  border: 1rpx solid rgba(148, 163, 184, 0.12);
}

.info-label {
  display: block;
  font-size: 22rpx;
  color: #64748b;
}

.info-value {
  display: block;
  margin-top: 10rpx;
  font-size: 27rpx;
  line-height: 1.6;
  color: #0f172a;
  word-break: break-all;
}

.file-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.file-summary-item {
  padding: 20rpx;
  border-radius: 22rpx;
  background: rgba(248, 250, 252, 0.9);
  border: 1rpx solid rgba(148, 163, 184, 0.12);
}

.file-summary-label {
  display: block;
  font-size: 22rpx;
  color: #64748b;
}

.file-summary-value {
  display: block;
  margin-top: 8rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #0f172a;
}

.file-inline-error {
  margin-top: 14rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #dc2626;
}

.modal-mask {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 28rpx 18rpx;
  background: rgba(15, 23, 42, 0.34);
  backdrop-filter: blur(10rpx);
  z-index: 90;
  box-sizing: border-box;
}

.modal-sheet {
  position: relative;
  width: 100%;
  max-height: 86vh;
  padding: 18rpx 20rpx 28rpx;
  border-radius: 36rpx 36rpx 24rpx 24rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 30rpx 80rpx rgba(15, 23, 42, 0.2);
  box-sizing: border-box;
}

.modal-handle {
  width: 88rpx;
  height: 8rpx;
  margin: 0 auto 18rpx;
  border-radius: 999rpx;
  background: rgba(148, 163, 184, 0.45);
}

.modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #0f172a;
}

.modal-subtitle {
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #64748b;
  word-break: break-all;
}

.modal-close {
  min-width: 92rpx;
  padding: 14rpx 20rpx;
  border-radius: 18rpx;
  background: rgba(241, 245, 249, 0.92);
  font-size: 24rpx;
  font-weight: 600;
  color: #334155;
  text-align: center;
  box-sizing: border-box;
}

.modal-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 22rpx;
}

.path-toolbar {
  display: grid;
  grid-template-columns: 72rpx minmax(0, 1fr) 72rpx 72rpx;
  gap: 14rpx;
  margin-top: 20rpx;
  align-items: stretch;
}

.path-action {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20rpx;
  background: rgba(241, 245, 249, 0.92);
  border: 1rpx solid rgba(148, 163, 184, 0.14);
}

.path-action.disabled {
  opacity: 0.45;
}

.path-action-primary {
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
  border: none;
}

.path-chip-box {
  min-width: 0;
  padding: 14rpx 18rpx;
  border-radius: 22rpx;
  background: rgba(248, 250, 252, 0.94);
  border: 1rpx solid rgba(148, 163, 184, 0.12);
}

.path-chip-label {
  font-size: 20rpx;
  color: #94a3b8;
}

.path-chip-value {
  margin-top: 6rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: #0f172a;
  word-break: break-all;
}

.path-chip-desc {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #64748b;
  word-break: break-all;
}

.path-action-icon {
  position: relative;
  width: 28rpx;
  height: 28rpx;
}

.icon-arrow-left::before {
  content: '';
  position: absolute;
  left: 8rpx;
  top: 5rpx;
  width: 14rpx;
  height: 14rpx;
  border-left: 4rpx solid #334155;
  border-bottom: 4rpx solid #334155;
  transform: rotate(45deg);
}

.icon-refresh-mini::before,
.icon-refresh-mini::after {
  content: '';
  position: absolute;
}

.icon-refresh-mini::before {
  left: 5rpx;
  top: 5rpx;
  width: 16rpx;
  height: 16rpx;
  border: 3rpx solid #334155;
  border-right-color: transparent;
  border-radius: 50%;
}

.icon-refresh-mini::after {
  right: 2rpx;
  top: 3rpx;
  width: 0;
  height: 0;
  border-left: 8rpx solid #334155;
  border-top: 6rpx solid transparent;
  border-bottom: 6rpx solid transparent;
  transform: rotate(15deg);
}

.icon-plus-mini::before,
.icon-plus-mini::after {
  content: '';
  position: absolute;
  background: #ffffff;
  border-radius: 4rpx;
}

.icon-plus-mini::before {
  left: 12rpx;
  top: 4rpx;
  width: 4rpx;
  height: 20rpx;
}

.icon-plus-mini::after {
  left: 4rpx;
  top: 12rpx;
  width: 20rpx;
  height: 4rpx;
}

.create-panel,
.selected-panel,
.preview-panel,
.file-error-box {
  margin-top: 20rpx;
  padding: 20rpx;
  border-radius: 24rpx;
  background: rgba(248, 250, 252, 0.88);
  border: 1rpx solid rgba(148, 163, 184, 0.14);
}

.create-actions,
.selected-actions,
.preview-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.selected-path,
.preview-path {
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #64748b;
  word-break: break-all;
}

.file-error-title,
.preview-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #0f172a;
}

.file-error-text {
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #dc2626;
  word-break: break-all;
}

.preview-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.preview-close {
  min-width: 76rpx;
  padding: 10rpx 16rpx;
  border-radius: 16rpx;
  background: rgba(226, 232, 240, 0.8);
  font-size: 22rpx;
  font-weight: 600;
  color: #475569;
  text-align: center;
  box-sizing: border-box;
}

.editor-box {
  width: 100%;
  min-height: 320rpx;
  margin-top: 16rpx;
  padding: 20rpx;
  border-radius: 24rpx;
  background: #0f172a;
  color: #e2e8f0;
  box-sizing: border-box;
  font-size: 24rpx;
  line-height: 1.65;
}

.file-list-scroll {
  height: 54vh;
  margin-top: 20rpx;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.file-list-scroll-with-preview {
  padding-bottom: 420rpx;
  box-sizing: border-box;
}

.file-list > * + * {
  margin-top: 16rpx;
}

.file-card {
  padding: 20rpx;
  border-radius: 24rpx;
  background: rgba(248, 250, 252, 0.92);
  border: 1rpx solid rgba(148, 163, 184, 0.12);
}

.file-card-main {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  min-width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
  font-size: 22rpx;
  font-weight: 700;
}

.file-icon.directory {
  background: rgba(14, 165, 233, 0.12);
  color: #0284c7;
}

.file-meta {
  flex: 1;
  min-width: 0;
}

.file-more-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  width: 64rpx;
  min-width: 64rpx;
  height: 64rpx;
  margin-left: 12rpx;
  border-radius: 18rpx;
  background: rgba(241, 245, 249, 0.94);
}

.file-more-dot {
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: #64748b;
}

.file-title {
  font-size: 29rpx;
  font-weight: 700;
  color: #0f172a;
  word-break: break-all;
}

.file-subline {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 8rpx;
  font-size: 23rpx;
  color: #64748b;
}

.file-time {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.5;
  color: #94a3b8;
  word-break: break-all;
}

.file-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.download-box {
  margin-top: 18rpx;
  padding: 20rpx;
  border-radius: 22rpx;
  background: rgba(219, 234, 254, 0.56);
  border: 1rpx solid rgba(59, 130, 246, 0.14);
}

.preview-drawer {
  position: absolute;
  left: 16rpx;
  right: 16rpx;
  bottom: 16rpx;
  z-index: 3;
  padding: 20rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 -6rpx 40rpx rgba(15, 23, 42, 0.14);
  border: 1rpx solid rgba(148, 163, 184, 0.12);
}
</style>
