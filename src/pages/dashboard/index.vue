<template>
  <view class="dashboard-page">
    <AppPageScroll :refreshing="refreshing" tab-page @refresh="handlePageRefresh">
      <view class="app-page app-tab-page app-stack">
        <view class="app-card app-hero-card">
          <view class="app-page-title">MCSManager 控制台</view>
          <view class="app-page-desc">当前面板 {{ configStore.state.baseUrl || '未设置' }}</view>

          <view class="hero-meta hero-meta-rich">
            <view class="meta-item">
              <text class="meta-label">面板版本</text>
              <text class="meta-value">{{ overview.version || '待获取' }}</text>
            </view>
            <view class="meta-item">
              <text class="meta-label">当前节点</text>
              <text class="meta-value">{{ selectedDaemonLabel }}</text>
            </view>
            <view class="meta-item">
              <text class="meta-label">在线节点</text>
              <text class="meta-value">{{ availableRemoteCount }}/{{ totalRemoteCount }}</text>
            </view>
            <view class="meta-item">
              <text class="meta-label">运行实例</text>
              <text class="meta-value">{{ runningInstanceCount }}/{{ totalInstanceCount }}</text>
            </view>
            <view class="meta-item">
              <text class="meta-label">CPU 占用</text>
              <text class="meta-value">{{ formatPercent(systemInfo.cpu) }}</text>
            </view>
            <view class="meta-item">
              <text class="meta-label">可用内存</text>
              <text class="meta-value">{{ formatBytes(systemInfo.freemem) }}</text>
            </view>
          </view>
        </view>

        <view class="app-card">
          <view class="app-section-head">
            <view class="app-section-title">系统信息</view>
          </view>

          <view class="info-grid">
            <view class="info-item">
              <text class="info-label">主机名</text>
              <text class="info-value">{{ systemInfo.hostname || '-' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">系统平台</text>
              <text class="info-value">{{ systemInfo.platform || '-' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">Node 版本</text>
              <text class="info-value">{{ systemInfo.node || '-' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">运行时长</text>
              <text class="info-value">{{ formatUptime(systemInfo.uptime) }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">总内存</text>
              <text class="info-value">{{ formatBytes(systemInfo.totalmem) }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">架构</text>
              <text class="info-value">{{ systemInfo.arch || '-' }}</text>
            </view>
          </view>
        </view>

        <view class="app-card">
          <view class="app-section-head">
            <view>
              <view class="app-section-title">节点列表</view>
            </view>
            <view class="app-pill" :class="availableRemoteCount ? 'success' : 'warn'">
              {{ availableRemoteCount ? '节点可用' : '节点异常' }}
            </view>
          </view>

          <view v-if="remoteList.length" class="remote-list">
            <view v-for="item in remoteList" :key="item.uuid" class="remote-card">
              <view class="remote-head">
                <view>
                  <view class="remote-title">{{ item.remarks || item.ip || item.uuid }}</view>
                  <view class="app-muted">{{ item.uuid }}</view>
                </view>
                <view class="app-pill" :class="item.available ? 'success' : 'warn'">
                  {{ getAvailabilityText(item.available) }}
                </view>
              </view>

              <view class="remote-grid">
                <view class="remote-meta">
                  <text class="remote-meta-label">版本</text>
                  <text class="remote-meta-value">{{ item.version || '未知' }}</text>
                </view>
                <view class="remote-meta">
                  <text class="remote-meta-label">实例</text>
                  <text class="remote-meta-value">{{ item.instance?.running || 0 }}/{{ item.instance?.total || 0 }}</text>
                </view>
                <view class="remote-meta">
                  <text class="remote-meta-label">主机名</text>
                  <text class="remote-meta-value">{{ item.system?.hostname || '-' }}</text>
                </view>
                <view class="remote-meta">
                  <text class="remote-meta-label">平台</text>
                  <text class="remote-meta-value">{{ item.system?.platform || '-' }}</text>
                </view>
              </view>
            </view>
          </view>

          <view v-else class="app-empty">暂无节点数据，请确认面板和守护进程已正常连接。</view>
        </view>
      </view>
    </AppPageScroll>
    <AppTabbar current="dashboard" />
  </view>
</template>

<script setup>
// 控制台页面负责展示面板概览、系统信息和节点总览。
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { fetchOverview } from '../../api/dashboard';
import AppPageScroll from '../../components/AppPageScroll.vue';
import AppTabbar from '../../components/AppTabbar.vue';
import { useConfigStore } from '../../stores/config';
import { formatBytes, formatPercent, formatUptime, getAvailabilityText } from '../../utils/format';
import { showToast } from '../../utils/message';

// 获取共享配置状态。
const configStore = useConfigStore();

// 从全局缓存中提取概览数据。
const overview = computed(() => configStore.state.overview || {});

// 提取系统信息。
const systemInfo = computed(() => overview.value.system || {});

// 提取远程节点列表。
const remoteList = computed(() => overview.value.remote || []);

// 统计在线节点数量。
const availableRemoteCount = computed(() => remoteList.value.filter((item) => item.available).length);

// 统计节点总数。
const totalRemoteCount = computed(() => remoteList.value.length);

// 汇总运行中的实例数量。
const runningInstanceCount = computed(() =>
  remoteList.value.reduce((total, item) => total + Number(item.instance?.running || 0), 0)
);

// 汇总实例总量。
const totalInstanceCount = computed(() =>
  remoteList.value.reduce((total, item) => total + Number(item.instance?.total || 0), 0)
);

// 标记页面内部下拉刷新状态。
const isRefreshing = ref(false);

// 控制页面下拉刷新动画状态。
const refreshing = computed(() => isRefreshing.value);

// 当前已选节点的显示名称。
const selectedDaemonLabel = computed(() => {
  const current = remoteList.value.find((item) => item.uuid === configStore.state.selectedDaemonId);
  return current?.remarks || current?.ip || current?.uuid || '未选择';
});

// 页面显示时刷新一次概览，保持信息尽量新。
onShow(() => {
  refreshOverview(false);
});

// 控制台页使用下拉刷新概览数据。
async function handlePageRefresh() {
  if (isRefreshing.value) {
    return;
  }

  isRefreshing.value = true;

  try {
    await refreshOverview(false);
  } finally {
    isRefreshing.value = false;
  }
}

// 获取面板概览数据。
async function refreshOverview(showSuccessToast) {
  if (!configStore.state.baseUrl || !configStore.state.apikey) {
    return;
  }

  try {
    const response = await fetchOverview({
      loading: showSuccessToast,
      loadingText: '正在刷新概览...',
    });

    configStore.setOverview(response.data);

    if (showSuccessToast) {
      showToast('概览已刷新', 'success');
    }
  } catch (error) {
    console.error('刷新概览失败', error);
  }
}

</script>

<style scoped>
.dashboard-page {
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

.hero-meta-rich .meta-item {
  min-height: 116rpx;
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

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.info-item {
  padding: 20rpx;
  border-radius: 22rpx;
  background: rgba(248, 250, 252, 0.9);
  border: 1rpx solid rgba(148, 163, 184, 0.14);
}

.info-label {
  display: block;
  font-size: 22rpx;
  color: #64748b;
}

.info-value {
  display: block;
  margin-top: 10rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #0f172a;
  word-break: break-all;
}

.remote-list > * + * {
  margin-top: 18rpx;
}

.remote-card {
  padding: 24rpx;
  border-radius: 24rpx;
  background: rgba(248, 250, 252, 0.86);
  border: 1rpx solid rgba(148, 163, 184, 0.14);
}

.remote-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.remote-title {
  font-size: 31rpx;
  font-weight: 700;
  color: #0f172a;
}

.remote-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 18rpx;
}

.remote-meta {
  padding: 18rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.92);
}

.remote-meta-label {
  display: block;
  font-size: 22rpx;
  color: #64748b;
}

.remote-meta-value {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1.5;
  color: #1e293b;
  word-break: break-all;
}
</style>
