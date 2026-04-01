<template>
  <AppTabFrame current="instances" :refreshing="refreshing" @refresh="handlePageRefresh">
    <view class="instances-page">
      <view class="app-page app-tab-page app-stack">
        <view class="app-card app-hero-card">
          <view class="app-page-title">实例总览</view>
          <view class="app-page-desc">
            按节点查看实例、搜索名称、切页浏览，并直接执行开启、关闭、重启、终止等基础操作。
          </view>

          <view class="hero-meta">
            <view class="meta-item">
              <text class="meta-label">当前节点</text>
              <text class="meta-value">{{ currentDaemonLabel }}</text>
            </view>
            <view class="meta-item">
              <text class="meta-label">当前节点实例总数</text>
              <text class="meta-value">{{ currentDaemonTotal }} 条</text>
            </view>
          </view>
        </view>

        <view class="app-card">
          <view class="instance-node-picker" @click="openDaemonMenu">
            <text class="instance-node-label">当前节点</text>
            <text class="instance-node-value">{{ currentDaemonLabel }}</text>
            <view v-if="query.instanceName" class="instance-filter-clear-inline" @click.stop="resetSearch">清空</view>
            <view class="instance-node-arrow" />
          </view>

          <view class="instance-search-bar">
            <input
              v-model.trim="query.instanceName"
              class="instance-search-input"
              type="text"
              placeholder="搜索实例名称"
              confirm-type="search"
              @confirm="handleSearch"
            />
            <view class="instance-search-submit" @click="handleSearch">
              <view class="instance-search-icon" />
            </view>
          </view>
        </view>

        <view
          v-if="daemonMenu.visible"
          class="daemon-overlay"
          :class="{ 'daemon-overlay-leave': daemonMenu.closing }"
          @click="closeDaemonMenu"
        >
          <view class="daemon-sheet" :class="{ 'daemon-sheet-leave': daemonMenu.closing }" @click.stop>
            <view class="daemon-sheet-title">选择节点</view>
            <view class="daemon-sheet-subtitle">切换后会立刻刷新当前节点的实例列表</view>

            <view v-if="daemonOptions.length" class="daemon-option-list">
              <view
                v-for="item in daemonOptions"
                :key="item.value"
                class="daemon-option-item"
                :class="{ active: item.value === query.daemonId }"
                @click="handleDaemonSelect(item)"
              >
                <view class="daemon-option-main">
                  <view class="daemon-option-label">{{ item.label }}</view>
                  <view class="daemon-option-desc">{{ item.value }}</view>
                </view>
                <view v-if="item.value === query.daemonId" class="daemon-option-check" />
              </view>
            </view>

            <view v-else class="app-empty">暂无可用节点</view>
          </view>
        </view>

        <view v-if="loading" class="app-card">
          <view class="app-empty">正在加载实例列表...</view>
        </view>

        <view v-else-if="!instanceList.length" class="app-card">
          <view class="app-empty">当前节点暂无实例数据，或者筛选条件没有命中结果。</view>
        </view>

        <view v-else class="instance-list">
          <view v-for="item in instanceList" :key="item.instanceUuid" class="app-card instance-card" @click="openDetail(item)">
            <view class="instance-head">
              <view>
                <view class="instance-title">{{ item.nickname }}</view>
                <view class="app-muted">{{ item.instanceUuid }}</view>
              </view>
              <view class="app-pill" :class="item.statusVariant">{{ item.statusText }}</view>
            </view>

            <view class="info-grid">
              <view class="info-item">
                <text class="info-label">目录</text>
                <text class="info-value">{{ item.cwdText }}</text>
              </view>
              <view class="info-item">
                <text class="info-label">内存</text>
                <text class="info-value">{{ item.memoryText }}</text>
              </view>
              <view class="info-item">
                <text class="info-label">启动次数</text>
                <text class="info-value">{{ item.startedText }}</text>
              </view>
              <view class="info-item">
                <text class="info-label">玩家</text>
                <text class="info-value">{{ item.playersText }}</text>
              </view>
            </view>

            <view class="instance-action-row" @click.stop>
              <view
                class="instance-action-pill"
                :class="[getPrimaryAction(item).variant, { disabled: getPrimaryAction(item).disabled, loading: isActionLoading(getPrimaryAction(item).key, item) }]"
                @click.stop="handlePrimaryInstanceAction(item)"
              >
                <view class="instance-action-icon" :class="getPrimaryAction(item).iconClass" />
                <text class="instance-action-label">{{ getPrimaryAction(item).label }}</text>
              </view>

              <view
                class="instance-action-pill neutral"
                :class="{ disabled: isActionDisabled('restart', item), loading: isActionLoading('restart', item) }"
                @click.stop="handleInstanceAction('restart', item)"
              >
                <view class="instance-action-icon icon-restart" />
                <text class="instance-action-label">重启</text>
              </view>

              <view
                class="instance-action-pill danger-outline"
                :class="{ disabled: isActionDisabled('kill', item), loading: isActionLoading('kill', item) }"
                @click.stop="handleInstanceAction('kill', item)"
              >
                <view class="instance-action-icon icon-close" />
                <text class="instance-action-label">终止</text>
              </view>
            </view>
          </view>

          <view v-if="pageInfo.maxPage > 1" class="instance-pager-card app-card">
            <view class="instance-pager">
              <view class="instance-page-button" :class="{ disabled: query.page <= 1 }" @click="goPrevPage">
                上一页
              </view>
              <view class="instance-page-indicator">
                <text class="instance-page-current">{{ query.page }}</text>
                <text class="instance-page-divider">/</text>
                <text class="instance-page-total">{{ pageInfo.maxPage }}</text>
              </view>
              <view class="instance-page-button" :class="{ disabled: query.page >= pageInfo.maxPage }" @click="goNextPage">
                下一页
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </AppTabFrame>
</template>

<script setup>
// 实例页负责节点筛选、实例搜索、分页和基础实例操作。
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { fetchOverview } from '../../api/dashboard';
import { fetchInstanceDetail, fetchInstanceList, killInstance, restartInstance, startInstance, stopInstance } from '../../api/instances';
import AppTabFrame from '../../components/AppTabFrame.vue';
import { useConfigStore } from '../../stores/config';
import { extractMemoryValue, formatBytes, getInstanceStatusText, parseBytesValue } from '../../utils/format';
import { showToast } from '../../utils/message';

// 获取共享配置仓库。
const configStore = useConfigStore();

// 列表查询条件。
const query = reactive({
  daemonId: '',
  page: 1,
  pageSize: 5,
  instanceName: '',
  status: '',
});

// 分页元信息。
const pageInfo = reactive({
  maxPage: 1,
  total: 0,
});

// 实例列表数据。
const instanceList = ref([]);

// 控制列表加载状态。
const loading = ref(false);

// 控制页面下拉刷新状态。
const isRefreshing = ref(false);

// 记录当前执行中的操作。
const currentActionKey = ref('');

const daemonMenu = reactive({
  visible: false,
  closing: false,
});

// 暴露给滚动容器的刷新状态。
const refreshing = computed(() => isRefreshing.value);

// 节点选择器选项来自 overview 接口。
const daemonOptions = computed(() =>
  (configStore.state.overview?.remote || []).map((item) => ({
    label: item.remarks || item.ip || item.uuid,
    value: item.uuid,
  }))
);

// 当前节点文案。
const currentDaemonLabel = computed(() => {
  if (!daemonOptions.value.length) {
    return '暂无可用节点';
  }

  const currentItem = daemonOptions.value.find((item) => item.value === query.daemonId);
  return currentItem?.label || daemonOptions.value[0]?.label || '请选择节点';
});

// 当前已选节点的实例总数优先从 overview 读取，避免分页接口缺少 total 字段。
const currentDaemonTotal = computed(() => {
  const remoteItem = (configStore.state.overview?.remote || []).find((item) => item.uuid === query.daemonId);

  if (!remoteItem) {
    return pageInfo.total;
  }

  return Math.max(
    0,
    Number(
      remoteItem.instance?.total
      ?? remoteItem.instance?.count
      ?? pageInfo.total
      ?? 0
    )
  );
});

// 页面显示时确保有 overview 数据，再拉取实例列表。
onShow(async () => {
  await ensureOverview();
  syncCurrentDaemon();
  await loadInstances(false);
});

// 支持页面下拉刷新，统一替代顶部刷新按钮。
async function handlePageRefresh() {
  if (isRefreshing.value) {
    return;
  }

  isRefreshing.value = true;

  try {
    await ensureOverview();
    syncCurrentDaemon();
    await loadInstances(false);
  } finally {
    isRefreshing.value = false;
  }
}

// 确保已经拿到节点列表。
async function ensureOverview() {
  const hasRemoteList = (configStore.state.overview?.remote || []).length > 0;

  if (hasRemoteList) {
    return;
  }

  try {
    const response = await fetchOverview({
      loading: true,
      loadingText: '正在加载节点列表...',
    });

    configStore.setOverview(response.data);
  } catch (error) {
    console.error('加载节点列表失败', error);
  }
}

// 把全局已选节点同步到当前页查询条件。
function syncCurrentDaemon() {
  const fallbackDaemonId = daemonOptions.value[0]?.value || '';
  query.daemonId = configStore.state.selectedDaemonId || fallbackDaemonId;

  if (query.daemonId) {
    configStore.setSelectedDaemonId(query.daemonId);
  }
}

// 将实例状态映射为统一的标签样式。
function getStatusVariant(status) {
  const value = Number(status);

  if (value === 3) {
    return 'success';
  }

  if (value === 2 || value === 1 || value === -1) {
    return 'warn';
  }

  return '';
}

// 把接口原始结构转换为页面展示结构。
function mapInstanceItem(item) {
  const config = item.config || {};
  const info = item.info || {};
  const processInfo = item.processInfo || {};
  const currentPlayers = Number(info.currentPlayers);
  const maxPlayers = Number(info.maxPlayers);

  return {
    ...item,
    nickname: config.nickname || item.instanceUuid,
    statusText: getInstanceStatusText(item.status),
    statusVariant: getStatusVariant(item.status),
    cwdText: config.cwd || '-',
    memoryText: formatBytes(resolveInstanceMemory(item)),
    startedText: Number(item.started || 0),
    playersText: currentPlayers >= 0 && maxPlayers >= 0 ? `${currentPlayers}/${maxPlayers}` : '暂无数据',
  };
}

function resolveInstanceMemory(item) {
  for (const source of [item?.info, item?.processInfo, item]) {
    const resolved = extractMemoryValue(source);
    if (resolved !== undefined) {
      return resolved;
    }
  }

  return 0;
}

function shouldHydrateRuntimeDetail(item) {
  const memoryBytes = parseBytesValue(resolveInstanceMemory(item));
  const status = Number(item?.status ?? 0);

  return status === 3 && memoryBytes < 1024 * 1024;
}

async function hydrateInstanceRuntimeDetails(items = []) {
  const hydrated = await Promise.all(
    items.map(async (item) => {
      if (!shouldHydrateRuntimeDetail(item)) {
        return item;
      }

      try {
        const response = await fetchInstanceDetail(
          {
            daemonId: query.daemonId,
            uuid: item.instanceUuid,
          },
          false
        );
        const detailData = response?.data || {};

        return {
          ...item,
          ...detailData,
          info: {
            ...(item?.info || {}),
            ...(detailData?.info || {}),
          },
          processInfo: {
            ...(item?.processInfo || {}),
            ...(detailData?.processInfo || {}),
          },
        };
      } catch (error) {
        console.error('补充实例运行态信息失败', item?.instanceUuid, error);
        return item;
      }
    })
  );

  return hydrated;
}

// 加载实例列表。
async function loadInstances(showLoading = true) {
  if (!query.daemonId) {
    instanceList.value = [];
    showToast('暂无可用节点');
    return;
  }

  loading.value = true;

  try {
    const response = await fetchInstanceList({
      daemonId: query.daemonId,
      page: query.page,
      pageSize: query.pageSize,
      instanceName: query.instanceName,
      status: query.status,
      loading: showLoading,
    });

    const data = response.data || {};
    pageInfo.maxPage = Math.max(1, Number(data.maxPage || 1));
    pageInfo.total = Math.max(
      0,
      Number(
        data.total
        ?? data.count
        ?? data.instance?.total
        ?? pageInfo.total
        ?? 0
      )
    );
    const rawItems = data.data || [];
    const hydratedItems = await hydrateInstanceRuntimeDetails(rawItems);
    instanceList.value = hydratedItems.map(mapInstanceItem);
  } catch (error) {
    console.error('加载实例列表失败', error);
    pageInfo.total = 0;
    instanceList.value = [];
  } finally {
    loading.value = false;
  }
}

function openDaemonMenu() {
  if (!daemonOptions.value.length) {
    showToast('暂无可用节点');
    return;
  }

  daemonMenu.closing = false;
  daemonMenu.visible = true;
}

function closeDaemonMenu(immediate = false) {
  if (!daemonMenu.visible) {
    return;
  }

  if (immediate) {
    daemonMenu.visible = false;
    daemonMenu.closing = false;
    return;
  }

  daemonMenu.closing = true;

  setTimeout(() => {
    daemonMenu.visible = false;
    daemonMenu.closing = false;
  }, 180);
}

// 节点切换时刷新列表。
async function handleDaemonSelect(target) {
  if (!target) {
    closeDaemonMenu();
    return;
  }

  closeDaemonMenu();

  if (target.value === query.daemonId) {
    return;
  }

  query.daemonId = target.value;
  query.page = 1;
  configStore.setSelectedDaemonId(target.value);
  await loadInstances(true);
}

// 按名称搜索。
async function handleSearch() {
  query.page = 1;
  await loadInstances(true);
}

// 清空搜索词。
async function resetSearch() {
  query.instanceName = '';
  query.page = 1;
  await loadInstances(true);
}

// 手动刷新当前页。
async function refreshList() {
  await loadInstances(true);
}

// 分页上一页。
async function goPrevPage() {
  if (query.page <= 1) {
    return;
  }

  query.page -= 1;
  await loadInstances(true);
}

// 分页下一页。
async function goNextPage() {
  if (query.page >= pageInfo.maxPage) {
    return;
  }

  query.page += 1;
  await loadInstances(true);
}

// 打开详情页。
function openDetail(item) {
  uni.navigateTo({
    url: `/src/pages/instance-detail/index?daemonId=${encodeURIComponent(query.daemonId)}&uuid=${encodeURIComponent(item.instanceUuid)}&nav=forward`,
  });
}

// 构造操作唯一键，避免多实例同时误触。
function buildActionKey(action, item) {
  return `${action}:${item.instanceUuid}`;
}

// 判断按钮是否正在执行中。
function isActionLoading(action, item) {
  return currentActionKey.value === buildActionKey(action, item);
}

// 基于当前状态禁用无效按钮。
function isActionDisabled(action, item) {
  if (currentActionKey.value) {
    return currentActionKey.value !== buildActionKey(action, item);
  }

  const status = Number(item.status);

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

// 根据实例当前状态生成主操作按钮。
function getPrimaryAction(item) {
  const status = Number(item.status);

  if (status === 3) {
    return {
      key: 'stop',
      label: '关闭',
      variant: 'danger-fill',
      iconClass: 'icon-stop',
      disabled: isActionDisabled('stop', item),
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
    disabled: isActionDisabled('start', item),
  };
}

// 统一处理卡片里的主操作按钮。
async function handlePrimaryInstanceAction(item) {
  const action = getPrimaryAction(item);

  if (action.disabled) {
    return;
  }

  await handleInstanceAction(action.key, item);
}

// 执行实例操作并在成功后刷新列表。
async function handleInstanceAction(action, item) {
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

  currentActionKey.value = buildActionKey(action, item);

  try {
    await actionFn({
      uuid: item.instanceUuid,
      daemonId: query.daemonId,
    });

    await loadInstances(false);
  } catch (error) {
    console.error(`执行实例操作失败: ${action}`, error);
  } finally {
    currentActionKey.value = '';
  }
}
</script>

<style scoped>
.instances-page {
  min-height: 100vh;
}

.hero-meta {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 24rpx;
}

.meta-item {
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: var(--app-surface-soft);
  border: 1rpx solid var(--app-border-strong);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.58),
    0 12rpx 28rpx rgba(77, 102, 140, 0.08);
  backdrop-filter: blur(24rpx) saturate(138%);
}

.meta-label {
  display: block;
  font-size: 22rpx;
  color: #64748b;
}

.meta-value {
  display: block;
  margin-top: 10rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #0f172a;
  word-break: break-all;
}

.instance-node-picker {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: var(--app-surface-soft);
  border: 1rpx solid var(--app-border-strong);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(24rpx) saturate(140%);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.instance-node-picker::after,
.instance-search-submit::before,
.instance-card::before,
.instance-page-button::before {
  content: '';
  position: absolute;
  inset: 1rpx;
  border-radius: inherit;
  background:
    radial-gradient(circle at 14% 10%, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0) 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.instance-node-label {
  flex-shrink: 0;
  font-size: 22rpx;
  color: #64748b;
}

.instance-node-value {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.instance-filter-clear-inline {
  flex-shrink: 0;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.28);
  border: 1rpx solid rgba(255, 255, 255, 0.48);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.54);
  backdrop-filter: blur(20rpx) saturate(138%);
  font-size: 22rpx;
  font-weight: 600;
  color: #64748b;
}

.instance-node-arrow {
  position: relative;
  flex-shrink: 0;
  width: 18rpx;
  height: 18rpx;
}

.instance-node-arrow::before,
.instance-node-arrow::after {
  content: '';
  position: absolute;
  top: 7rpx;
  width: 10rpx;
  height: 3rpx;
  border-radius: 999rpx;
  background: #94a3b8;
}

.instance-node-arrow::before {
  left: 0;
  transform: rotate(45deg);
}

.instance-node-arrow::after {
  right: 0;
  transform: rotate(-45deg);
}

.instance-search-bar {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 14rpx;
}

.daemon-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx 20rpx;
  background: rgba(10, 18, 34, 0.18);
  backdrop-filter: blur(22rpx) saturate(135%);
  box-sizing: border-box;
  animation: daemon-overlay-enter 0.22s ease;
}

.daemon-overlay-leave {
  animation: daemon-overlay-leave 0.18s ease forwards;
}

.daemon-sheet {
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 720rpx;
  max-height: 72vh;
  padding: 24rpx;
  border-radius: 30rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0.22)),
    rgba(255, 255, 255, 0.18);
  border: 1rpx solid rgba(255, 255, 255, 0.52);
  box-shadow:
    0 20rpx 48rpx rgba(15, 23, 42, 0.12),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.56);
  backdrop-filter: blur(30rpx) saturate(145%);
  box-sizing: border-box;
  animation: daemon-sheet-enter 0.26s ease;
}

.daemon-sheet-leave {
  animation: daemon-sheet-leave 0.18s ease forwards;
}

.daemon-sheet::before,
.daemon-option-item::before {
  content: '';
  position: absolute;
  inset: 1rpx;
  border-radius: inherit;
  background:
    radial-gradient(circle at 14% 10%, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0) 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.daemon-sheet-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #0f172a;
}

.daemon-sheet-subtitle {
  margin-top: 8rpx;
  font-size: 23rpx;
  line-height: 1.6;
  color: #64748b;
}

.daemon-option-list {
  margin-top: 18rpx;
  max-height: 54vh;
  overflow-y: auto;
}

.daemon-option-list > * + * {
  margin-top: 14rpx;
}

.daemon-option-item {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.28);
  border: 1rpx solid rgba(255, 255, 255, 0.46);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.54);
  backdrop-filter: blur(22rpx) saturate(140%);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.daemon-option-item.active {
  background:
    linear-gradient(135deg, rgba(82, 153, 255, 0.18), rgba(148, 210, 255, 0.1)),
    rgba(255, 255, 255, 0.22);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.56),
    0 14rpx 28rpx rgba(61, 122, 214, 0.1);
}

.daemon-option-main {
  flex: 1;
  min-width: 0;
}

.daemon-option-label {
  font-size: 28rpx;
  font-weight: 700;
  color: #0f172a;
  word-break: break-all;
}

.daemon-option-desc {
  margin-top: 6rpx;
  font-size: 22rpx;
  line-height: 1.55;
  color: #64748b;
  word-break: break-all;
}

.daemon-option-check {
  position: relative;
  width: 40rpx;
  min-width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(52, 131, 250, 0.92), rgba(35, 183, 255, 0.82));
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.48),
    0 10rpx 22rpx rgba(37, 99, 235, 0.18);
}

.daemon-option-check::before {
  content: '';
  position: absolute;
  left: 12rpx;
  top: 10rpx;
  width: 12rpx;
  height: 7rpx;
  border-left: 4rpx solid #ffffff;
  border-bottom: 4rpx solid #ffffff;
  transform: rotate(-45deg);
}

.instance-search-input {
  flex: 1;
  height: 88rpx;
  padding: 0 24rpx;
  border-radius: 22rpx;
  background: var(--app-surface-soft);
  border: 1rpx solid var(--app-border-strong);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.56);
  backdrop-filter: blur(24rpx) saturate(140%);
  font-size: 28rpx;
  color: #0f172a;
  box-sizing: border-box;
}

.instance-search-submit {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, rgba(52, 131, 250, 0.92), rgba(35, 183, 255, 0.82));
  border: 1rpx solid rgba(255, 255, 255, 0.34);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.44),
    0 14rpx 28rpx rgba(37, 99, 235, 0.2);
  backdrop-filter: blur(24rpx) saturate(145%);
}

.instance-search-icon {
  position: relative;
  width: 28rpx;
  height: 28rpx;
}

.instance-search-icon::before {
  content: '';
  position: absolute;
  left: 1rpx;
  top: 1rpx;
  width: 16rpx;
  height: 16rpx;
  border: 4rpx solid #ffffff;
  border-radius: 50%;
}

.instance-search-icon::after {
  content: '';
  position: absolute;
  right: 1rpx;
  bottom: 1rpx;
  width: 12rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: #ffffff;
  transform: rotate(45deg);
  transform-origin: center;
}

.instance-list > * + * {
  margin-top: 20rpx;
}

.instance-card {
  position: relative;
  overflow: hidden;
  padding: 26rpx;
}

.instance-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.instance-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #0f172a;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 20rpx;
}

.info-item {
  padding: 18rpx;
  border-radius: 20rpx;
  background: var(--app-surface-soft);
  border: 1rpx solid var(--app-border);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.54);
  backdrop-filter: blur(22rpx) saturate(138%);
}

.info-label {
  display: block;
  font-size: 22rpx;
  color: #64748b;
}

.info-value {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  line-height: 1.55;
  color: #0f172a;
  word-break: break-all;
}

.instance-action-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 20rpx;
}

.instance-action-pill {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  min-height: 76rpx;
  padding: 0 14rpx;
  border-radius: 18rpx;
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

.instance-action-pill::before {
  content: '';
  position: absolute;
  inset: 1rpx;
  border-radius: inherit;
  background:
    radial-gradient(circle at 14% 10%, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0) 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.instance-action-pill.primary {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.34);
  background: linear-gradient(135deg, rgba(52, 131, 250, 0.92), rgba(35, 183, 255, 0.82));
}

.instance-action-pill.neutral {
  color: #111827;
}

.instance-action-pill.danger-fill {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.28);
  background: linear-gradient(135deg, rgba(251, 113, 133, 0.92), rgba(239, 68, 68, 0.82));
}

.instance-action-pill.danger-outline {
  color: #ef4444;
  border-color: rgba(255, 183, 194, 0.72);
  background: rgba(255, 255, 255, 0.24);
}

.instance-action-pill.disabled {
  opacity: 0.55;
}

.instance-action-label {
  font-size: 26rpx;
  font-weight: 600;
}

.instance-action-icon {
  position: relative;
  width: 24rpx;
  height: 24rpx;
}

.icon-play::before {
  content: '';
  position: absolute;
  left: 5rpx;
  top: 2rpx;
  width: 0;
  height: 0;
  border-top: 10rpx solid transparent;
  border-bottom: 10rpx solid transparent;
  border-left: 16rpx solid currentColor;
}

.icon-stop::before,
.icon-stop::after {
  content: '';
  position: absolute;
  top: 2rpx;
  width: 4rpx;
  height: 20rpx;
  border-radius: 4rpx;
  background: currentColor;
}

.icon-stop::before {
  left: 5rpx;
}

.icon-stop::after {
  right: 5rpx;
}

.icon-close::before,
.icon-close::after {
  content: '';
  position: absolute;
  left: 10rpx;
  top: 1rpx;
  width: 4rpx;
  height: 22rpx;
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
  left: 3rpx;
  top: 3rpx;
  width: 16rpx;
  height: 16rpx;
  border: 3rpx solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
}

.icon-restart::after {
  right: 0;
  top: 1rpx;
  width: 0;
  height: 0;
  border-left: 8rpx solid currentColor;
  border-top: 5rpx solid transparent;
  border-bottom: 5rpx solid transparent;
  transform: rotate(18deg);
}

.instance-pager-card {
  padding: 20rpx 24rpx;
}

.instance-pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.instance-page-button {
  position: relative;
  overflow: hidden;
  min-width: 132rpx;
  padding: 16rpx 22rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.46);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.52), rgba(255, 255, 255, 0.18)),
    rgba(255, 255, 255, 0.18);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.56);
  backdrop-filter: blur(24rpx) saturate(138%);
  box-sizing: border-box;
  text-align: center;
  font-size: 24rpx;
  font-weight: 600;
  color: #334155;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.instance-page-button.disabled {
  opacity: 0.42;
}

.instance-page-indicator {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  gap: 8rpx;
  min-width: 120rpx;
  color: #0f172a;
}

.instance-page-current,
.instance-page-total {
  font-size: 32rpx;
  font-weight: 700;
}

.instance-page-divider {
  font-size: 24rpx;
  color: #94a3b8;
}

.instance-search-submit:active,
.instance-node-picker:active,
.daemon-option-item:active,
.instance-action-pill:active,
.instance-page-button:active {
  transform: scale(0.986);
}

@keyframes daemon-overlay-enter {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes daemon-overlay-leave {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@keyframes daemon-sheet-enter {
  from {
    opacity: 0.72;
    transform: translateY(28rpx) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes daemon-sheet-leave {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  to {
    opacity: 0;
    transform: translateY(24rpx) scale(0.986);
  }
}
</style>
