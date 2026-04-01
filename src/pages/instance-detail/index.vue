<template>
  <view class="detail-page-root">
    <AppPageScroll :refreshing="refreshing" :scroll-enabled="!fileModal.visible" @refresh="handlePageRefresh">
      <view class="app-page app-stack detail-shell" :class="{ 'detail-shell-enter': detailEnterAnimated, 'detail-shell-leave': detailLeaving }">
        <view class="detail-nav-row">
          <view class="detail-back-button" @click="goBackToInstances">
            <view class="detail-back-icon" />
            <text class="detail-back-label">返回实例</text>
          </view>
        </view>

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
            <view class="app-mini-button primary" @click="openFileManager">
              <text>打开</text>
            </view>
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
    </AppPageScroll>

    <view
      v-if="fileModal.visible"
      class="modal-mask"
      :class="{ 'overlay-leave': fileModal.closing }"
      :style="getOverlayMotionStyle(fileModal)"
      @click="closeFileManager"
    >
      <view
        class="modal-sheet"
        :class="{ 'sheet-leave': fileModal.closing }"
        :style="getSheetMotionStyle(fileModal)"
        @click.stop
      >
        <view class="modal-top">
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
            <view class="app-mini-button primary" @click="refreshFiles">
              <text>重新加载</text>
            </view>
          </view>
        </view>

        <view class="file-list-scroll">
          <view v-if="fileState.loading && !fileItems.length" class="app-empty">正在加载文件列表...</view>
          <view v-else-if="!fileItems.length && !fileState.error" class="app-empty">当前目录暂无文件内容。</view>

          <view v-else class="file-list">
            <view v-for="item in fileItems" :key="item.key" class="file-card">
              <view class="file-card-main" @click="handleFileCardPress(item)">
                <view class="file-icon" :class="{ directory: item.isDirectory }">
                  <text>{{ item.badgeText }}</text>
                </view>

                <view class="file-meta">
                  <view class="file-title">{{ item.name }}</view>
                  <view class="file-subline">
                    <text>{{ item.typeText }}</text>
                    <text>{{ item.sizeText }}</text>
                  </view>
                </view>

                <view class="file-more-button" @click.stop="openEntryActionSheet(item)">
                  <view class="file-more-dot" />
                  <view class="file-more-dot" />
                  <view class="file-more-dot" />
                </view>
              </view>
            </view>
          </view>
        </view>

        <view
          v-if="filePreview.visible"
          class="preview-overlay"
          :class="{ 'overlay-leave': filePreview.closing }"
          :style="getOverlayMotionStyle(filePreview)"
          @click="closePreview"
        >
          <view
            class="preview-drawer"
            :class="{ 'preview-drawer-leave': filePreview.closing }"
            :style="getPreviewDrawerMotionStyle(filePreview)"
            @click.stop
          >
            <view class="preview-head">
              <view class="preview-head-copy">
                <view class="preview-title">{{ filePreview.kind === 'image' ? '图片预览' : '文件预览' }}</view>
                <view class="preview-path">{{ filePreview.target }}</view>
              </view>
              <view class="preview-head-actions">
                <view v-if="filePreview.kind === 'text'" class="preview-close preview-save" @click="saveCurrentPreview">保存</view>
                <view class="preview-close" @click="closePreview">收起</view>
              </view>
            </view>

            <textarea v-if="filePreview.kind === 'text'" v-model="filePreview.content" class="editor-box" />
            <view v-else-if="filePreview.kind === 'image'" class="preview-image-wrap">
              <img
                v-if="filePreview.imageSrc && !filePreview.error"
                class="preview-image-native"
                :src="filePreview.imageSrc"
                alt=""
                referrerpolicy="no-referrer"
                @load="handlePreviewImageLoad"
                @error="handlePreviewImageError"
              />
              <view v-else class="preview-image-empty">{{ filePreview.error || '正在准备图片预览...' }}</view>
            </view>
          </view>
        </view>

        <view
          v-if="createMenu.visible"
          class="glass-overlay menu-overlay"
          :class="{ 'overlay-leave': createMenu.closing }"
          @click="closeCreateMenu"
        >
          <view class="glass-sheet action-sheet" :class="{ 'sheet-leave': createMenu.closing }" @click.stop>
            <view class="glass-sheet-title">新建内容</view>
            <view class="glass-sheet-subtitle">选择要在当前目录创建的内容</view>

            <view class="glass-action-list">
              <view
                v-for="action in createMenuActions"
                :key="action.key"
                class="glass-action-item"
                @click="handleCreateMenuAction(action.key)"
              >
                <view class="glass-action-label">{{ action.label }}</view>
                <view class="glass-action-desc">{{ action.desc }}</view>
              </view>
            </view>
          </view>
        </view>

        <view
          v-if="entryMenu.visible"
          class="glass-overlay menu-overlay"
          :class="{ 'overlay-leave': entryMenu.closing }"
          @click="closeEntryMenu"
        >
          <view class="glass-sheet action-sheet" :class="{ 'sheet-leave': entryMenu.closing }" @click.stop>
            <view class="glass-sheet-title">{{ entryMenu.item?.name || '文件操作' }}</view>
            <view class="glass-sheet-subtitle">{{ getPreviewDisplayType(entryMenu.item) }}操作</view>

            <view class="glass-action-list">
              <view
                v-for="action in entryMenuActions"
                :key="action.key"
                class="glass-action-item"
                :class="{ danger: action.danger }"
                @click="handleEntryMenuAction(action.key)"
              >
                <view class="glass-action-label">{{ action.label }}</view>
                <view class="glass-action-desc">{{ action.desc }}</view>
              </view>
            </view>
          </view>
        </view>

        <view
          v-if="inputDialog.visible"
          class="glass-overlay dialog-overlay"
          :class="{ 'overlay-leave': inputDialog.closing }"
          @click="closeInputDialog"
        >
          <view class="glass-sheet dialog-sheet" :class="{ 'sheet-leave': inputDialog.closing }" @click.stop>
            <view class="glass-sheet-title">{{ inputDialog.title }}</view>
            <view class="glass-sheet-subtitle">{{ inputDialog.placeholder }}</view>
            <input
              v-model.trim="inputDialog.value"
              class="app-input glass-dialog-input"
              type="text"
              :placeholder="inputDialog.placeholder"
              focus
            />
            <view class="glass-dialog-actions">
              <view class="glass-dialog-button" @click="closeInputDialog">取消</view>
              <view class="glass-dialog-button primary" @click="submitInputDialog">{{ inputDialog.confirmText }}</view>
            </view>
          </view>
        </view>

        <view
          v-if="confirmDialog.visible"
          class="glass-overlay dialog-overlay"
          :class="{ 'overlay-leave': confirmDialog.closing }"
          @click="closeConfirmDialog"
        >
          <view class="glass-sheet dialog-sheet" :class="{ 'sheet-leave': confirmDialog.closing }" @click.stop>
            <view class="glass-sheet-title">{{ confirmDialog.title }}</view>
            <view class="glass-sheet-subtitle">{{ confirmDialog.message }}</view>
            <view class="glass-dialog-actions">
              <view class="glass-dialog-button" @click="closeConfirmDialog">取消</view>
              <view class="glass-dialog-button" :class="{ danger: confirmDialog.danger }" @click="submitConfirmDialog">
                {{ confirmDialog.confirmText }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    <AppMessageHost />
  </view>
</template>

<script setup>
// 实例详情页负责展示日志、实例操作和文件管理弹层。
import { computed, nextTick, reactive, ref } from 'vue';
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
import AppMessageHost from '../../components/AppMessageHost.vue';
import AppPageScroll from '../../components/AppPageScroll.vue';
import { useConfigStore } from '../../stores/config';
import { extractMemoryValue, formatBytes, formatPercent, getInstanceStatusText } from '../../utils/format';
import { showToast } from '../../utils/message';

// 记录当前实例的路由参数。
const daemonId = ref('');
const uuid = ref('');
const configStore = useConfigStore();
const detailEnterAnimated = ref(false);
const detailLeaving = ref(false);

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
  closing: false,
  entered: false,
});

// 文件预览状态。
const filePreview = reactive({
  visible: false,
  closing: false,
  entered: false,
  target: '',
  content: '',
  kind: 'text',
  imageSrc: '',
  imageCandidates: [],
  imageCandidateIndex: -1,
  error: '',
});

const createMenu = reactive({
  visible: false,
  closing: false,
});

const entryMenu = reactive({
  visible: false,
  closing: false,
  item: null,
});

const inputDialog = reactive({
  visible: false,
  closing: false,
  title: '',
  placeholder: '',
  confirmText: '确认',
  value: '',
  mode: '',
  item: null,
});

const confirmDialog = reactive({
  visible: false,
  closing: false,
  title: '确认操作',
  message: '',
  confirmText: '确认',
  danger: false,
  item: null,
  mode: '',
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
    cpuText: formatPercent(resolveDetailCpu(raw)),
    memoryText: formatBytes(resolveDetailMemory(raw)),
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

  if (String(options?.nav || '') === 'forward') {
    detailEnterAnimated.value = true;
    setTimeout(() => {
      detailEnterAnimated.value = false;
    }, 320);
  }

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

function goBackToInstances() {
  if (detailLeaving.value) {
    return;
  }

  detailLeaving.value = true;
  const pages = getCurrentPages();

  setTimeout(() => {
    if (pages.length > 1) {
      uni.navigateBack({
        delta: 1,
      });
      return;
    }

    uni.redirectTo({
      url: '/src/pages/instances/index?navDirection=backward',
    });
  }, 220);
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
  fileModal.closing = false;
  fileModal.entered = false;
  fileModal.visible = true;
  await nextTick();
  fileModal.entered = true;

  if (!fileState.loaded || fileState.error) {
    await refreshFiles();
  }
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

const imageExtensionSet = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico', 'avif']);
const textExtensionSet = new Set([
  'txt', 'log', 'json', 'json5', 'yaml', 'yml', 'xml', 'toml', 'ini', 'conf', 'cfg', 'properties',
  'env', 'md', 'csv', 'tsv', 'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'vue', 'html', 'htm', 'css',
  'scss', 'sass', 'less', 'java', 'kt', 'go', 'rs', 'py', 'rb', 'php', 'sh', 'bash', 'zsh', 'fish',
  'bat', 'cmd', 'ps1', 'sql', 'dockerfile', 'gitignore', 'npmrc', 'lock', 'secret',
]);

// 打开新建动作面板。
function openCreateActionSheet() {
  closeEntryMenu(true);
  createMenu.closing = false;
  createMenu.visible = true;
}

// 新建文件。
function handleCreateFile() {
  openInputDialog({
    mode: 'create-file',
    title: '新建文件',
    placeholder: '输入文件名',
    confirmText: '创建',
  });
}

// 新建文件夹。
function handleCreateFolder() {
  openInputDialog({
    mode: 'create-folder',
    title: '新建文件夹',
    placeholder: '输入文件夹名',
    confirmText: '创建',
  });
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
  closeCreateMenu(true);
  entryMenu.closing = false;
  entryMenu.visible = true;
  entryMenu.item = item;
}

// 打开目录并刷新目录列表。
async function openDirectory(item) {
  closeAllFileMenus();
  fileState.target = item.fullPath;
  fileState.page = 0;
  closePreview();
  await loadFiles(true);
}

// 直接尝试读取文件内容，不再先按扩展名拦截。
async function handleFileItemClick(item) {
  const previewKind = getPreviewKind(item);

  if (previewKind === 'image') {
    await previewImageFile(item);
    return;
  }

  if (previewKind !== 'text') {
    showToast('仅支持预览文本或图片文件');
    return;
  }

  try {
    const response = await fetchFileContent(
      {
        daemonId: daemonId.value,
        uuid: uuid.value,
        target: item.fullPath,
      },
      true
    );

    filePreview.closing = false;
    filePreview.entered = false;
    filePreview.visible = true;
    filePreview.target = item.fullPath;
    filePreview.kind = 'text';
    filePreview.content = extractFileContent(response);
    filePreview.imageSrc = '';
    filePreview.imageCandidates = [];
    filePreview.imageCandidateIndex = -1;
    filePreview.error = '';
    await nextTick();
    filePreview.entered = true;
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
function handleRenameEntry(item) {
  openInputDialog({
    mode: 'rename',
    title: '重命名',
    placeholder: '输入新的名称',
    confirmText: '保存',
    value: item.name,
    item,
  });
}

// 删除单个文件或目录。
function handleDeleteEntry(item) {
  confirmDialog.closing = false;
  confirmDialog.visible = true;
  confirmDialog.title = item.isDirectory ? '删除文件夹' : '删除文件';
  confirmDialog.message = item.isDirectory ? '确认删除这个文件夹吗？删除后无法恢复。' : '确认删除这个文件吗？删除后无法恢复。';
  confirmDialog.confirmText = '删除';
  confirmDialog.danger = true;
  confirmDialog.item = item;
  confirmDialog.mode = 'delete';
}

// 关闭文件预览。
function closePreview(immediate = false) {
  playLeave(
    filePreview,
    () => {
      filePreview.entered = false;
      filePreview.target = '';
      filePreview.content = '';
      filePreview.kind = 'text';
      filePreview.imageSrc = '';
      filePreview.imageCandidates = [];
      filePreview.imageCandidateIndex = -1;
      filePreview.error = '';
    },
    immediate
  );
}

// 保存当前预览文件内容。
async function saveCurrentPreview() {
  if (!filePreview.target || filePreview.kind !== 'text') {
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

function closeCreateMenu(immediate = false) {
  playLeave(createMenu, null, immediate);
}

function closeEntryMenu(immediate = false) {
  playLeave(
    entryMenu,
    () => {
      entryMenu.item = null;
    },
    immediate
  );
}

function openInputDialog(options = {}) {
  closeCreateMenu(true);
  closeEntryMenu(true);
  inputDialog.closing = false;
  inputDialog.visible = true;
  inputDialog.mode = options.mode || '';
  inputDialog.title = options.title || '';
  inputDialog.placeholder = options.placeholder || '';
  inputDialog.confirmText = options.confirmText || '确认';
  inputDialog.value = String(options.value || '');
  inputDialog.item = options.item || null;
}

function closeInputDialog(immediate = false) {
  playLeave(
    inputDialog,
    () => {
      inputDialog.title = '';
      inputDialog.placeholder = '';
      inputDialog.confirmText = '确认';
      inputDialog.value = '';
      inputDialog.mode = '';
      inputDialog.item = null;
    },
    immediate
  );
}

function closeConfirmDialog(immediate = false) {
  playLeave(
    confirmDialog,
    () => {
      confirmDialog.title = '确认操作';
      confirmDialog.message = '';
      confirmDialog.confirmText = '确认';
      confirmDialog.danger = false;
      confirmDialog.item = null;
      confirmDialog.mode = '';
    },
    immediate
  );
}

async function submitInputDialog() {
  const value = String(inputDialog.value || '').trim();

  if (!value) {
    showToast(inputDialog.placeholder || '请输入内容');
    return;
  }

  try {
    if (inputDialog.mode === 'create-file') {
      await touchFile({
        daemonId: daemonId.value,
        uuid: uuid.value,
        target: joinPath(fileState.target, value),
      });
    }

    if (inputDialog.mode === 'create-folder') {
      await createFolder({
        daemonId: daemonId.value,
        uuid: uuid.value,
        target: joinPath(fileState.target, value),
      });
    }

    if (inputDialog.mode === 'rename') {
      const item = inputDialog.item;

      if (!item || value === item.name) {
        closeInputDialog();
        return;
      }

      const targetPath = joinPath(getParentPath(item.fullPath), value);

      await moveFiles({
        daemonId: daemonId.value,
        uuid: uuid.value,
        targets: [[item.fullPath, targetPath]],
      });

      if (filePreview.target === item.fullPath) {
        filePreview.target = targetPath;
      }
    }

    closeInputDialog();
    await loadFiles(false);
  } catch (error) {
    console.error('提交文件弹窗操作失败', error);
  }
}

async function submitConfirmDialog() {
  if (confirmDialog.mode !== 'delete' || !confirmDialog.item) {
    closeConfirmDialog();
    return;
  }

  const item = confirmDialog.item;

  try {
    await deleteFiles({
      daemonId: daemonId.value,
      uuid: uuid.value,
      targets: [item.fullPath],
    });

    if (filePreview.target === item.fullPath) {
      closePreview();
    }

    closeConfirmDialog();
    await loadFiles(false);
  } catch (error) {
    console.error('删除文件失败', error);
  }
}

async function handleEntryMenuAction(action) {
  const item = entryMenu.item;

  if (!item) {
    closeEntryMenu();
    return;
  }

  closeEntryMenu();

  if (action === 'open') {
    await openDirectory(item);
    return;
  }

  if (action === 'preview') {
    await handleFileItemClick(item);
    return;
  }

  if (action === 'rename') {
    handleRenameEntry(item);
    return;
  }

  if (action === 'delete') {
    handleDeleteEntry(item);
  }
}

function getPreviewKind(item) {
  if (item.isDirectory) {
    return 'directory';
  }

  const extension = getFileExtension(item);

  if (imageExtensionSet.has(extension)) {
    return 'image';
  }

  if (textExtensionSet.has(extension)) {
    return 'text';
  }

  return 'unsupported';
}

function getFileExtension(item) {
  const normalizedName = String(item?.name || item?.filename || item?.fileName || '').trim();
  const fallbackPath = String(item?.fullPath || item?.path || item?.target || '').trim();
  const sourceName = normalizedName || fallbackPath;
  const filename = sourceName.split(/[\\/]/).filter(Boolean).pop() || sourceName;
  const extension = filename.includes('.') ? filename.split('.').pop() : '';

  return String(extension || '').toLowerCase();
}

async function previewImageFile(item) {
  try {
    const response = await fetchDownloadAddress({
      daemonId: daemonId.value,
      uuid: uuid.value,
      fileName: item.fullPath,
    });
    const previewCandidates = buildOfficialImagePreviewCandidates(item, response);

    if (!previewCandidates.length) {
      throw new Error('Missing image preview address');
    }

    filePreview.closing = false;
    filePreview.entered = false;
    filePreview.visible = true;
    filePreview.target = item.fullPath;
    filePreview.kind = 'image';
    filePreview.content = '';
    filePreview.error = '';
    filePreview.imageCandidates = previewCandidates;
    filePreview.imageCandidateIndex = -1;
    filePreview.imageSrc = '';
    const resolvedImageSrc = await resolvePreviewImageCandidate(previewCandidates);
    await nextTick();
    filePreview.entered = true;

    if (resolvedImageSrc) {
      filePreview.imageSrc = resolvedImageSrc;
      return;
    }

    filePreview.error = '当前图片暂时无法加载，请稍后再试';
  } catch (error) {
    console.error('预览图片失败', error);
    showToast('图片预览失败');
  }
}

function getBaseScheme() {
  return String(configStore.state.baseUrl || '').startsWith('https://') ? 'https' : 'http';
}

function handlePreviewImageError() {
  if (advancePreviewImageCandidate()) {
    return;
  }

  filePreview.error = '当前图片暂时无法加载，请稍后再试';
}

function handlePreviewImageLoad() {
  filePreview.error = '';
}

function resolvePreviewImageCandidate(candidates = []) {
  if (!Array.isArray(candidates) || !candidates.length) {
    return Promise.resolve('');
  }

  if (typeof Image === 'undefined') {
    return Promise.resolve(candidates[0] || '');
  }

  let currentIndex = 0;

  return new Promise((resolve) => {
    const tryNext = () => {
      if (currentIndex >= candidates.length) {
        resolve('');
        return;
      }

      const currentUrl = candidates[currentIndex];
      const tester = new Image();

      tester.onload = () => {
        filePreview.imageCandidateIndex = currentIndex;
        resolve(currentUrl);
      };

      tester.onerror = () => {
        currentIndex += 1;
        tryNext();
      };

      tester.src = currentUrl;
    };

    tryNext();
  });
}

function buildOfficialImagePreviewCandidates(item, response) {
  const addr = resolveDownloadBaseAddr(response);
  const rawAddr = String(response?.data?.addr || response?.addr || '').trim();
  const password = String(response?.data?.password || response?.password || '').trim();
  const fileName = item.fullPath.split(/[\\/]/).filter(Boolean).pop() || item.name || 'preview';
  const fullTarget = item.fullPath;
  const candidates = [];

  if (!addr || !password) {
    return candidates;
  }

  const addCandidate = (value) => {
    const normalizedValue = String(value || '').trim();

    if (!normalizedValue || candidates.includes(normalizedValue)) {
      return;
    }

    candidates.push(normalizedValue);
  };

  const addDownloadVariants = (baseAddr) => {
    const normalizedBase = String(baseAddr || '').trim().replace(/\/+$/, '');

    if (!normalizedBase) {
      return;
    }

    addCandidate(`${normalizedBase}/download/${password}`);
    addCandidate(`${normalizedBase}/download/${password}/${fileName}`);
    addCandidate(`${normalizedBase}/download/${password}/${encodeURIComponent(fileName)}`);
    addCandidate(`${normalizedBase}/download/${password}/${fullTarget}`);
    addCandidate(`${normalizedBase}/download/${password}/${encodeURIComponent(fullTarget)}`);
    addCandidate(`${normalizedBase}/download/${password}?name=${encodeURIComponent(fileName)}`);
    addCandidate(`${normalizedBase}/download/${password}?name=${encodeURIComponent(fullTarget)}`);
    addCandidate(`${normalizedBase}/download/${password}?target=${encodeURIComponent(fullTarget)}`);
  };

  addDownloadVariants(addr);
  addDownloadVariants(parseForwardAddress(rawAddr, 'http'));
  addDownloadVariants(configStore.state.baseUrl);

  return candidates;
}

function resolveDownloadBaseAddr(response) {
  const remoteMappings = Array.isArray(response?.data?.remoteMappings)
    ? response.data.remoteMappings
    : Array.isArray(response?.remoteMappings)
      ? response.remoteMappings
      : [];
  const rawAddr = String(response?.data?.addr || response?.addr || '').trim();
  const mapped = mapDaemonAddress(remoteMappings);
  const baseAddr = mapped?.addr ? `${mapped.addr}${mapped.prefix || ''}` : rawAddr;

  return parseForwardAddress(baseAddr, 'http').replace(/\/+$/, '');
}

function mapDaemonAddress(remoteMappings = []) {
  const panelLocation = getPanelLocationInfo();

  if (!panelLocation || !Array.isArray(remoteMappings) || !remoteMappings.length) {
    return undefined;
  }

  return remoteMappings.find((entry) => {
    const fromAddr = String(entry?.from?.addr || '');
    const fromPrefix = removeTrail(String(entry?.from?.prefix || ''), '/');
    return fromAddr === panelLocation.hostWithDefaultPort && fromPrefix === panelLocation.pathPrefix;
  })?.to;
}

function parseForwardAddress(addr, requireProtocol = 'http') {
  const normalized = deleteProtocolHeader(String(addr || '').trim());
  const panelLocation = getPanelLocationInfo();
  const protocolString = panelLocation?.protocolWithSlashes || `${getBaseScheme()}://`;
  let protocol = protocolString;
  const lowerAddr = String(addr || '').toLowerCase();

  if (requireProtocol === 'http') {
    if (lowerAddr.startsWith('ws://')) {
      protocol = 'http://';
    } else if (lowerAddr.startsWith('wss://')) {
      protocol = 'https://';
    } else if (lowerAddr.startsWith('http://')) {
      protocol = 'http://';
    } else if (lowerAddr.startsWith('https://')) {
      protocol = 'https://';
    } else if (protocolString !== 'https://') {
      protocol = 'http://';
    }
  }

  const slashIndex = normalized.indexOf('/');
  const hostPort = slashIndex >= 0 ? normalized.slice(0, slashIndex) : normalized;
  const path = slashIndex >= 0 ? normalized.slice(slashIndex) : '';
  const [host, ...portRest] = hostPort.split(':');
  const port = portRest.join(':');
  const loweredHost = String(host || '').toLowerCase();
  const safeHost = (loweredHost === 'localhost' || loweredHost.startsWith('127.0.0.'))
    ? panelLocation?.hostname || host
    : host;

  return `${protocol}${safeHost}${port ? `:${port}` : ''}${path}`;
}

function deleteProtocolHeader(addr) {
  return String(addr || '')
    .replace(/^https?:\/\//i, '')
    .replace(/^wss?:\/\//i, '');
}

function removeTrail(value, char = '/') {
  return String(value || '').replace(char === '/' ? /\/+$/ : new RegExp(`${char}+$`), '');
}

function getPanelLocationInfo() {
  const rawBaseUrl = String(configStore.state.baseUrl || '').trim();

  if (rawBaseUrl) {
    try {
      const parsed = new URL(rawBaseUrl);
      const defaultPort = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');

      return {
        hostname: parsed.hostname,
        protocolWithSlashes: `${parsed.protocol}//`,
        hostWithDefaultPort: `${parsed.hostname}:${defaultPort}`,
        pathPrefix: removeTrail(parsed.pathname || '', '/'),
      };
    } catch (_) {
    }
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const { location } = window;
  const defaultPort = location.port || (location.protocol === 'https:' ? '443' : '80');

  return {
    hostname: location.hostname,
    protocolWithSlashes: `${location.protocol}//`,
    hostWithDefaultPort: `${location.hostname}:${defaultPort}`,
    pathPrefix: removeTrail(location.pathname || '', '/'),
  };
}

function advancePreviewImageCandidate() {
  if (!Array.isArray(filePreview.imageCandidates) || !filePreview.imageCandidates.length) {
    return false;
  }

  const nextIndex = filePreview.imageCandidateIndex + 1;

  if (nextIndex >= filePreview.imageCandidates.length) {
    filePreview.imageSrc = '';
    return false;
  }

  filePreview.imageCandidateIndex = nextIndex;
  filePreview.imageSrc = filePreview.imageCandidates[nextIndex];
  return true;
}

const entryMenuActions = computed(() => {
  const item = entryMenu.item;

  if (!item) {
    return [];
  }

  return item.isDirectory
    ? [
      { key: 'open', label: '打开', desc: '进入这个文件夹' },
      { key: 'rename', label: '重命名', desc: '修改当前名称' },
      { key: 'delete', label: '删除', desc: '移除这个文件夹', danger: true },
    ]
    : [
      { key: 'preview', label: '预览', desc: '打开文本或图片预览' },
      { key: 'rename', label: '重命名', desc: '修改当前名称' },
      { key: 'delete', label: '删除', desc: '移除这个文件', danger: true },
    ];
});

const createMenuActions = [
  { key: 'file', label: '新建文件', desc: '创建一个空文件' },
  { key: 'folder', label: '新建文件夹', desc: '创建一个新目录' },
];

function handleCreateMenuAction(action) {
  closeCreateMenu();

  if (action === 'file') {
    handleCreateFile();
    return;
  }

  if (action === 'folder') {
    handleCreateFolder();
  }
}

function getPreviewDisplayType(item) {
  const kind = getPreviewKind(item);
  return kind === 'image' ? '图片' : kind === 'text' ? '文本' : '文件';
}

function closeAllFileMenus() {
  closeCreateMenu(true);
  closeEntryMenu(true);
  closeInputDialog(true);
  closeConfirmDialog(true);
}

// 关闭文件管理弹层。
function closeFileManager(immediate = false) {
  playLeave(fileModal, null, immediate);
  closePreview();
  closeAllFileMenus();
}

function playLeave(target, onAfterLeave, immediate = false, delay = 240) {
  if (!target?.visible) {
    if (typeof onAfterLeave === 'function') {
      onAfterLeave();
    }
    return;
  }

  if (immediate) {
    target.visible = false;
    target.closing = false;
    if ('entered' in target) {
      target.entered = false;
    }
    if (typeof onAfterLeave === 'function') {
      onAfterLeave();
    }
    return;
  }

  target.closing = true;
  if ('entered' in target) {
    target.entered = false;
  }

  setTimeout(() => {
    target.visible = false;
    target.closing = false;
    if ('entered' in target) {
      target.entered = false;
    }
    if (typeof onAfterLeave === 'function') {
      onAfterLeave();
    }
  }, delay);
}

function getOverlayMotionStyle(target) {
  return {
    opacity: target?.entered && !target?.closing ? 1 : 0,
  };
}

function getSheetMotionStyle(target) {
  return {
    opacity: target?.entered && !target?.closing ? 1 : 0,
    transform: target?.entered && !target?.closing ? 'translateY(0) scale(1)' : 'translateY(24rpx) scale(0.986)',
  };
}

function getPreviewDrawerMotionStyle(target) {
  return {
    opacity: target?.entered && !target?.closing ? 1 : 0,
    transform: target?.entered && !target?.closing ? 'translateY(0) scale(1)' : 'translateY(26rpx) scale(0.985)',
  };
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
  const name = getItemDisplayName(item);
  const fullPath = joinPath(fileState.target, name);
  const isDirectory = Number(item.type) === 0;

  return {
    ...item,
    name,
    key: `${fullPath}:${item.time}:${item.size}`,
    fullPath,
    isDirectory,
    typeText: isDirectory ? '文件夹' : '文件',
    badgeText: getFileBadgeText(item, isDirectory),
    sizeText: isDirectory ? '-' : formatBytes(item.size),
  };
}

function getItemDisplayName(item) {
  const candidates = [
    item?.name,
    item?.filename,
    item?.fileName,
    item?.path,
    item?.target,
    item?.fullPath,
  ];

  for (const candidate of candidates) {
    const rawValue = String(candidate || '').trim();

    if (!rawValue) {
      continue;
    }

    const segments = rawValue.split(/[\\/]/).filter(Boolean);
    return segments.pop() || rawValue;
  }

  return '未命名文件';
}

function getFileBadgeText(item, isDirectory) {
  if (isDirectory) {
    return 'DIR';
  }

  const extension = getFileExtension(item);

  if (!extension) {
    return 'FILE';
  }

  return extension.slice(0, 5).toUpperCase();
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

function resolveDetailMemory(raw) {
  for (const source of [raw?.info, raw?.processInfo, raw]) {
    const resolved = extractMemoryValue(source);
    if (resolved !== undefined) {
      return resolved;
    }
  }

  return 0;
}

function resolveDetailCpu(raw) {
  const candidates = [
    raw?.info?.cpuUsage,
    raw?.processInfo?.cpuUsage,
    raw?.processInfo?.cpu,
    raw?.cpuUsage,
    raw?.cpu,
  ];

  for (const value of candidates) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (typeof value === 'string' && value.includes('%')) {
      const percentValue = Number.parseFloat(value.replace('%', ''));
      if (Number.isFinite(percentValue)) {
        return percentValue / 100;
      }
    }

    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  return 0;
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
.detail-page-root {
  min-height: 100vh;
}

.detail-shell {
  position: relative;
  transform-origin: center top;
}

.detail-shell-enter {
  animation: detail-shell-enter 0.32s ease;
}

.detail-shell-leave {
  animation: detail-shell-leave 0.22s ease forwards;
}

.detail-nav-row {
  display: flex;
  align-items: center;
}

.detail-back-button {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  min-height: 76rpx;
  padding: 0 24rpx 0 20rpx;
  border-radius: 999rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.54), rgba(255, 255, 255, 0.18)),
    rgba(255, 255, 255, 0.16);
  border: 1rpx solid rgba(255, 255, 255, 0.48);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.58),
    0 14rpx 28rpx rgba(77, 102, 140, 0.1);
  backdrop-filter: blur(26rpx) saturate(145%);
}

.detail-back-button::before {
  content: '';
  position: absolute;
  inset: 1rpx;
  border-radius: inherit;
  background:
    radial-gradient(circle at 14% 10%, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0) 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.detail-back-icon {
  position: relative;
  width: 24rpx;
  height: 24rpx;
}

.detail-back-icon::before {
  content: '';
  position: absolute;
  left: 5rpx;
  top: 4rpx;
  width: 12rpx;
  height: 12rpx;
  border-left: 4rpx solid #334155;
  border-bottom: 4rpx solid #334155;
  transform: rotate(45deg);
}

.detail-back-label {
  font-size: 26rpx;
  font-weight: 700;
  color: #334155;
}

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
  background: var(--app-surface-soft);
  border: 1rpx solid var(--app-border-strong);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.58),
    0 12rpx 28rpx rgba(77, 102, 140, 0.08);
  backdrop-filter: blur(24rpx) saturate(138%);
}

.detail-back-button:active {
  transform: scale(0.988);
}

@keyframes detail-shell-enter {
  from {
    opacity: 0.78;
    transform: translateY(44rpx) scale(0.988);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes detail-shell-leave {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  to {
    opacity: 0;
    transform: translateY(24rpx) scale(0.988);
  }
}

@keyframes detail-overlay-enter {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes detail-sheet-enter {
  from {
    opacity: 0.74;
    transform: translateY(34rpx) scale(0.986);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes glass-sheet-enter {
  from {
    opacity: 0.72;
    transform: translateY(24rpx) scale(0.988);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes detail-overlay-leave {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@keyframes detail-sheet-leave {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  to {
    opacity: 0;
    transform: translateY(24rpx) scale(0.986);
  }
}

@keyframes preview-drawer-leave {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  to {
    opacity: 0;
    transform: translateY(26rpx) scale(0.985);
  }
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
  border: 1rpx solid rgba(255, 255, 255, 0.46);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.54), rgba(255, 255, 255, 0.18)),
    rgba(255, 255, 255, 0.16);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.56),
    0 10rpx 24rpx rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(24rpx) saturate(140%);
  box-sizing: border-box;
}

.action-pill-button.primary {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.34);
  background: linear-gradient(135deg, rgba(52, 131, 250, 0.92), rgba(35, 183, 255, 0.82));
}

.action-pill-button.neutral {
  color: #111827;
}

.action-pill-button.danger-outline {
  color: #ef4444;
  border-color: rgba(255, 183, 194, 0.72);
  background: rgba(255, 255, 255, 0.24);
}

.action-pill-button.danger-fill {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.28);
  background: linear-gradient(135deg, rgba(251, 113, 133, 0.92), rgba(239, 68, 68, 0.82));
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
  background: linear-gradient(180deg, rgba(10, 18, 34, 0), rgba(10, 18, 34, 0.86));
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
  background: linear-gradient(135deg, rgba(52, 131, 250, 0.92), rgba(35, 183, 255, 0.82));
  border: 1rpx solid rgba(255, 255, 255, 0.34);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.42),
    0 14rpx 28rpx rgba(37, 99, 235, 0.2);
  backdrop-filter: blur(24rpx) saturate(145%);
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
  background: var(--app-surface-soft);
  border: 1rpx solid var(--app-border);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.56),
    0 12rpx 28rpx rgba(77, 102, 140, 0.08);
  backdrop-filter: blur(24rpx) saturate(138%);
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
  background: var(--app-surface-soft);
  border: 1rpx solid var(--app-border-strong);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(24rpx) saturate(130%);
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
  background: rgba(10, 18, 34, 0.24);
  backdrop-filter: blur(28rpx) saturate(135%);
  z-index: 90;
  box-sizing: border-box;
  opacity: 1;
  transition: opacity 0.24s ease;
  animation: detail-overlay-enter 0.22s ease;
}

.modal-mask.overlay-leave,
.preview-overlay.overlay-leave,
.glass-overlay.overlay-leave {
  opacity: 0;
}

.modal-sheet {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100vh - 56rpx);
  max-height: calc(100vh - 56rpx);
  min-height: 0;
  padding: 18rpx 20rpx 28rpx;
  border-radius: 36rpx 36rpx 24rpx 24rpx;
  background: rgba(248, 250, 252, 0.96);
  border: 1rpx solid rgba(255, 255, 255, 0.78);
  box-shadow:
    0 30rpx 80rpx rgba(15, 23, 42, 0.14),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.82);
  box-sizing: border-box;
  opacity: 1;
  transform: translateY(0) scale(1);
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
  animation: detail-sheet-enter 0.28s ease;
}

.modal-top {
  flex-shrink: 0;
}

.modal-sheet.sheet-leave,
.glass-sheet.sheet-leave {
  opacity: 0;
  transform: translateY(24rpx) scale(0.986);
}

.modal-sheet::before,
.path-action::before,
.path-chip-box::before,
.file-card::before,
.preview-drawer::before,
.glass-sheet::before,
.modal-close::before,
.preview-close::before {
  content: '';
  position: absolute;
  inset: 1rpx;
  border-radius: inherit;
  background:
    radial-gradient(circle at 14% 10%, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0) 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0));
  pointer-events: none;
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
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 92rpx;
  min-height: 78rpx;
  padding: 14rpx 20rpx;
  border-radius: 18rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.22)),
    rgba(255, 255, 255, 0.28);
  border: 1rpx solid rgba(255, 255, 255, 0.58);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.7),
    0 10rpx 24rpx rgba(15, 23, 42, 0.08);
  font-size: 24rpx;
  font-weight: 600;
  color: #334155;
  text-align: center;
  box-sizing: border-box;
  backdrop-filter: blur(18rpx) saturate(135%);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
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
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid rgba(226, 232, 240, 0.86);
  box-shadow: 0 8rpx 22rpx rgba(15, 23, 42, 0.06);
}

.path-action.disabled {
  opacity: 0.45;
}

.path-action-primary {
  background: linear-gradient(135deg, rgba(52, 131, 250, 0.92), rgba(35, 183, 255, 0.82));
  border: 1rpx solid rgba(255, 255, 255, 0.34);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.42),
    0 12rpx 26rpx rgba(37, 99, 235, 0.2);
}

.path-chip-box {
  position: relative;
  overflow: hidden;
  min-width: 0;
  padding: 14rpx 18rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.94);
  border: 1rpx solid rgba(226, 232, 240, 0.88);
  box-shadow: 0 8rpx 22rpx rgba(15, 23, 42, 0.05);
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
  background: rgba(255, 255, 255, 0.94);
  border: 1rpx solid rgba(226, 232, 240, 0.88);
  box-shadow: 0 8rpx 22rpx rgba(15, 23, 42, 0.05);
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

.preview-head-copy {
  flex: 1;
  min-width: 0;
}

.preview-head-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.preview-close {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 76rpx;
  min-height: 72rpx;
  padding: 10rpx 16rpx;
  border-radius: 16rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.22)),
    rgba(255, 255, 255, 0.28);
  border: 1rpx solid rgba(255, 255, 255, 0.56);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.68),
    0 8rpx 20rpx rgba(15, 23, 42, 0.07);
  font-size: 22rpx;
  font-weight: 600;
  color: #475569;
  text-align: center;
  box-sizing: border-box;
  backdrop-filter: blur(18rpx) saturate(130%);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.preview-save {
  color: #ffffff;
  background: linear-gradient(135deg, rgba(52, 131, 250, 0.92), rgba(35, 183, 255, 0.82));
  border-color: rgba(255, 255, 255, 0.28);
}

.preview-image-wrap {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360rpx;
  max-height: 60vh;
  padding: 20rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.94);
  border: 1rpx solid rgba(226, 232, 240, 0.88);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.56);
  box-sizing: border-box;
}

.preview-image-native {
  display: block;
  max-width: 100%;
  width: auto;
  height: auto;
  max-height: calc(60vh - 40rpx);
  object-fit: contain;
  border-radius: 18rpx;
}

.preview-image-empty {
  font-size: 24rpx;
  line-height: 1.6;
  color: #64748b;
  text-align: center;
}

.editor-box {
  width: 100%;
  min-height: 420rpx;
  height: 56vh;
  margin-top: 16rpx;
  padding: 20rpx;
  border-radius: 24rpx;
  background: rgba(9, 16, 30, 0.78);
  color: #eff6ff;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.06);
  box-sizing: border-box;
  font-size: 24rpx;
  line-height: 1.65;
}

.glass-overlay {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: flex;
  justify-content: center;
  padding: 24rpx 12rpx;
  background: rgba(10, 18, 34, 0.18);
  backdrop-filter: blur(20rpx) saturate(130%);
  opacity: 1;
  transition: opacity 0.24s ease;
  animation: detail-overlay-enter 0.2s ease;
}

.menu-overlay {
  align-items: flex-end;
}

.dialog-overlay {
  align-items: center;
}

.glass-sheet {
  position: relative;
  overflow: hidden;
  width: 100%;
  padding: 22rpx;
  border-radius: 28rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0.22)),
    rgba(255, 255, 255, 0.18);
  border: 1rpx solid rgba(255, 255, 255, 0.52);
  box-shadow:
    0 18rpx 40rpx rgba(15, 23, 42, 0.12),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.56);
  box-sizing: border-box;
  opacity: 1;
  transform: translateY(0) scale(1);
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
  animation: glass-sheet-enter 0.24s ease;
}

.preview-drawer-leave {
  opacity: 0;
  transform: translateY(26rpx) scale(0.985);
}

.action-sheet {
  max-width: 680rpx;
}

.dialog-sheet {
  max-width: 640rpx;
}

.glass-sheet-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #0f172a;
}

.glass-sheet-subtitle {
  margin-top: 8rpx;
  font-size: 23rpx;
  line-height: 1.6;
  color: #64748b;
}

.glass-action-list {
  margin-top: 18rpx;
}

.glass-action-list > * + * {
  margin-top: 14rpx;
}

.glass-action-item {
  position: relative;
  overflow: hidden;
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.28);
  border: 1rpx solid rgba(255, 255, 255, 0.46);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.54);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.glass-action-item::before,
.glass-dialog-button::before {
  content: '';
  position: absolute;
  inset: 1rpx;
  border-radius: inherit;
  background:
    radial-gradient(circle at 14% 10%, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.glass-action-item.danger .glass-action-label {
  color: #cb3a5d;
}

.glass-action-label {
  font-size: 27rpx;
  font-weight: 700;
  color: #0f172a;
}

.glass-action-desc {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #64748b;
}

.glass-dialog-input {
  margin-top: 18rpx;
}

.glass-dialog-actions {
  display: flex;
  gap: 14rpx;
  margin-top: 18rpx;
}

.glass-dialog-button {
  position: relative;
  overflow: hidden;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 82rpx;
  border-radius: 22rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.18)),
    rgba(255, 255, 255, 0.2);
  border: 1rpx solid rgba(255, 255, 255, 0.44);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.54);
  font-size: 26rpx;
  font-weight: 700;
  color: #334155;
}

.glass-dialog-button.primary {
  color: #ffffff;
  background: linear-gradient(135deg, rgba(52, 131, 250, 0.92), rgba(35, 183, 255, 0.82));
  border-color: rgba(255, 255, 255, 0.3);
}

.glass-dialog-button.danger {
  color: #ffffff;
  background: linear-gradient(135deg, rgba(251, 113, 133, 0.92), rgba(239, 68, 68, 0.82));
  border-color: rgba(255, 255, 255, 0.28);
}

.file-list-scroll {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 20rpx;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  contain: layout paint;
  transform: translateZ(0);
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.file-list-scroll-with-preview {
  min-height: 220rpx;
  box-sizing: border-box;
}

.file-list {
  padding: 4rpx 0 28rpx;
  box-sizing: border-box;
}

.file-list > * + * {
  margin-top: 16rpx;
}

.file-card {
  position: relative;
  overflow: hidden;
  transform: translateZ(0);
  padding: 20rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.96);
  border: 1rpx solid rgba(226, 232, 240, 0.9);
  box-shadow:
    0 12rpx 24rpx rgba(15, 23, 42, 0.06);
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
  background: linear-gradient(180deg, rgba(72, 140, 255, 0.26), rgba(255, 255, 255, 0.24));
  color: #1d4ed8;
  font-size: 22rpx;
  font-weight: 700;
  border: 1rpx solid rgba(255, 255, 255, 0.48);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.54);
}

.file-icon.directory {
  background: linear-gradient(180deg, rgba(74, 222, 128, 0.2), rgba(255, 255, 255, 0.24));
  color: #0284c7;
}

.file-meta {
  flex: 1;
  min-width: 0;
}

.file-more-button {
  position: relative;
  overflow: hidden;
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
  background: rgba(255, 255, 255, 0.96);
  border: 1rpx solid rgba(226, 232, 240, 0.88);
  box-shadow: 0 8rpx 18rpx rgba(15, 23, 42, 0.05);
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

.file-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  z-index: 7;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  background: rgba(10, 18, 34, 0.18);
  backdrop-filter: blur(18rpx) saturate(125%);
  opacity: 1;
  transition: opacity 0.24s ease;
  animation: detail-overlay-enter 0.2s ease;
}

.preview-drawer {
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 820rpx;
  max-height: calc(100vh - 180rpx);
  padding: 24rpx;
  border-radius: 34rpx;
  background: rgba(248, 250, 252, 0.98);
  box-shadow:
    0 20rpx 50rpx rgba(15, 23, 42, 0.12),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.7);
  border: 1rpx solid rgba(226, 232, 240, 0.92);
  box-sizing: border-box;
  opacity: 1;
  transform: translateY(0) scale(1);
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
  animation: glass-sheet-enter 0.24s ease;
}

.modal-close:active,
.path-action:active,
.preview-close:active,
.glass-action-item:active,
.glass-dialog-button:active,
.file-card:active,
.file-more-button:active {
  transform: scale(0.988);
}

.modal-close:hover,
.preview-close:hover {
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.74),
    0 14rpx 28rpx rgba(15, 23, 42, 0.1);
}
</style>
