<template>
  <view class="instances-page">
    <AppPageScroll :refreshing="refreshing" tab-page @refresh="handlePageRefresh">
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
          <picker mode="selector" :range="daemonOptions" range-key="label" :value="daemonIndex" @change="handleDaemonChange">
            <view class="instance-node-picker">
              <text class="instance-node-label">当前节点</text>
              <text class="instance-node-value">{{ currentDaemonLabel }}</text>
              <view v-if="query.instanceName" class="instance-filter-clear-inline" @click.stop="resetSearch">清空</view>
              <view class="instance-node-arrow" />
            </view>
          </picker>

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
    </AppPageScroll>
    <AppTabbar current="instances" />
  </view>
</template>

<script setup>
// 实例页负责节点筛选、实例搜索、分页和基础实例操作。
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { fetchOverview } from '../../api/dashboard';
import { fetchInstanceList, killInstance, restartInstance, startInstance, stopInstance } from '../../api/instances';
import AppPageScroll from '../../components/AppPageScroll.vue';
import AppTabbar from '../../components/AppTabbar.vue';
import { useConfigStore } from '../../stores/config';
import { formatBytes, getInstanceStatusText } from '../../utils/format';
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

// 暴露给滚动容器的刷新状态。
const refreshing = computed(() => isRefreshing.value);

// 节点选择器选项来自 overview 接口。
const daemonOptions = computed(() =>
  (configStore.state.overview?.remote || []).map((item) => ({
    label: item.remarks || item.ip || item.uuid,
    value: item.uuid,
  }))
);

// 当前节点下标。
const daemonIndex = computed(() => {
  const index = daemonOptions.value.findIndex((item) => item.value === query.daemonId);
  return index >= 0 ? index : 0;
});

// 当前节点文案。
const currentDaemonLabel = computed(() => {
  if (!daemonOptions.value.length) {
    return '暂无可用节点';
  }

  return daemonOptions.value[daemonIndex.value]?.label || daemonOptions.value[0]?.label || '请选择节点';
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
    memoryText: formatBytes(processInfo.memory),
    startedText: Number(item.started || 0),
    playersText: currentPlayers >= 0 && maxPlayers >= 0 ? `${currentPlayers}/${maxPlayers}` : '暂无数据',
  };
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
    instanceList.value = (data.data || []).map(mapInstanceItem);
  } catch (error) {
    console.error('加载实例列表失败', error);
    pageInfo.total = 0;
    instanceList.value = [];
  } finally {
    loading.value = false;
  }
}

// 节点切换时刷新列表。
async function handleDaemonChange(event) {
  const index = Number(event.detail.value || 0);
  const target = daemonOptions.value[index];

  if (!target) {
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
    url: `/src/pages/instance-detail/index?daemonId=${encodeURIComponent(query.daemonId)}&uuid=${encodeURIComponent(item.instanceUuid)}`,
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
  background: rgba(255, 255, 255, 0.62);
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
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(248, 250, 252, 0.9);
  border: 1rpx solid rgba(203, 213, 225, 0.68);
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
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(203, 213, 225, 0.78);
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

.instance-search-input {
  flex: 1;
  height: 88rpx;
  padding: 0 24rpx;
  border-radius: 22rpx;
  background: rgba(248, 250, 252, 0.9);
  border: 1rpx solid rgba(203, 213, 225, 0.68);
  font-size: 28rpx;
  color: #0f172a;
  box-sizing: border-box;
}

.instance-search-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 14rpx 28rpx rgba(37, 99, 235, 0.24);
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  min-height: 76rpx;
  padding: 0 14rpx;
  border-radius: 18rpx;
  border: 1rpx solid rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8rpx 20rpx rgba(15, 23, 42, 0.05);
  box-sizing: border-box;
}

.instance-action-pill.primary {
  color: #ffffff;
  border: none;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.instance-action-pill.neutral {
  color: #111827;
}

.instance-action-pill.danger-fill {
  color: #ffffff;
  border: none;
  background: linear-gradient(135deg, #fb7185, #ef4444);
}

.instance-action-pill.danger-outline {
  color: #ef4444;
  border-color: rgba(248, 113, 113, 0.9);
  background: rgba(255, 255, 255, 0.98);
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
  min-width: 132rpx;
  padding: 16rpx 22rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(203, 213, 225, 0.86);
  background: rgba(248, 250, 252, 0.92);
  box-sizing: border-box;
  text-align: center;
  font-size: 24rpx;
  font-weight: 600;
  color: #334155;
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
</style>
