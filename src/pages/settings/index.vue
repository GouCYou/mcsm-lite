<template>
  <AppTabFrame current="settings" :refreshing="refreshing" @refresh="handlePageRefresh">
    <view class="settings-page" :class="{ 'settings-page-leave': loggingOut }">
      <view class="app-page app-tab-page app-stack">
        <view class="app-card app-hero-card">
          <view class="app-page-title">连接与偏好</view>
          <view class="app-page-desc">
            这里集中管理面板连接信息、当前节点选择，以及重新连接入口，方便移动端快速切换。
          </view>
        </view>

        <view class="app-card">
          <view class="app-section-head">
            <view class="app-section-title">当前连接</view>
            <view class="app-pill success">已保存</view>
          </view>

          <view class="info-grid">
            <view class="info-item info-item-wide">
              <text class="info-label">面板地址</text>
              <text class="info-value">{{ configStore.state.baseUrl || '未设置' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">API Key</text>
              <text class="info-value">{{ maskedApikey }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">当前节点</text>
              <text class="info-value">{{ selectedDaemonLabel }}</text>
            </view>
          </view>

          <view class="settings-action-row">
            <view class="settings-action-pill danger-fill" @click="handleLogout">
              <view class="settings-action-icon icon-close" />
              <text class="settings-action-label">退出登录</text>
            </view>
          </view>
        </view>

        <view class="app-card">
          <view class="app-section-head">
            <view class="app-section-title">节点摘要</view>
            <view class="app-pill" :class="daemonCount ? 'success' : 'warn'">
              {{ daemonCount ? '已同步' : '暂无数据' }}
            </view>
          </view>

          <view v-if="remoteList.length" class="daemon-list">
            <view v-for="item in remoteList" :key="item.uuid" class="daemon-card">
              <view class="daemon-head">
                <view>
                  <view class="daemon-title">{{ item.remarks || item.ip || item.uuid }}</view>
                  <view class="app-muted">{{ item.uuid }}</view>
                </view>
                <view class="app-pill" :class="item.available ? 'success' : 'warn'">
                  {{ item.available ? '在线' : '离线' }}
                </view>
              </view>

              <view class="app-text">版本：{{ item.version || '未知' }}</view>
              <view class="app-text">实例：{{ item.instance?.running || 0 }}/{{ item.instance?.total || 0 }}</view>
            </view>
          </view>

          <view v-else class="app-empty">还没有节点摘要，下拉页面即可重新同步。</view>
        </view>
      </view>
    </view>
  </AppTabFrame>
</template>

<script setup>
// 设置页负责展示连接配置、节点选择和重新连接入口。
import { computed, ref } from 'vue';
import { fetchOverview } from '../../api/dashboard';
import AppTabFrame from '../../components/AppTabFrame.vue';
import { useConfigStore } from '../../stores/config';
import { showToast } from '../../utils/message';

// 获取共享连接状态。
const configStore = useConfigStore();

// 当前节点列表。
const remoteList = computed(() => configStore.state.overview?.remote || []);

// 当前节点总数。
const daemonCount = computed(() => remoteList.value.length);

// 标记页面内部刷新状态。
const isRefreshing = ref(false);
const loggingOut = ref(false);

// 暴露给滚动容器的刷新状态。
const refreshing = computed(() => isRefreshing.value);

// API Key 做掩码处理，避免直接展示完整内容。
const maskedApikey = computed(() => {
  const apikey = configStore.state.apikey || '';

  if (!apikey) {
    return '未设置';
  }

  if (apikey.length <= 8) {
    return `${apikey.slice(0, 2)}****`;
  }

  return `${apikey.slice(0, 4)}****${apikey.slice(-4)}`;
});

// 当前已选节点名称。
const selectedDaemonLabel = computed(() => {
  const current = remoteList.value.find((item) => item.uuid === configStore.state.selectedDaemonId);
  return current?.remarks || current?.ip || current?.uuid || '未选择';
});

// 设置页也统一支持下拉刷新节点信息。
async function handlePageRefresh() {
  if (isRefreshing.value) {
    return;
  }

  isRefreshing.value = true;

  try {
    await refreshOverview();
  } finally {
    isRefreshing.value = false;
  }
}

// 刷新节点概览。
async function refreshOverview() {
  try {
    const response = await fetchOverview({
      loading: true,
      loadingText: '正在刷新节点信息...',
    });

    configStore.setOverview(response.data);
    showToast('节点信息已刷新', 'success');
  } catch (error) {
    console.error('设置页刷新节点失败', error);
  }
}

// 退出当前登录并回到初始页。
function handleLogout() {
  if (loggingOut.value) {
    return;
  }

  loggingOut.value = true;
  configStore.reset();

  setTimeout(() => {
    uni.reLaunch({
      url: '/src/pages/login/index?nav=logout',
    });
  }, 220);
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  transform-origin: center center;
}

.settings-page-leave {
  animation: settings-page-leave 0.22s ease forwards;
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

.info-item-wide {
  grid-column: span 2;
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
  line-height: 1.55;
  word-break: break-all;
}

.settings-action-row {
  margin-top: 22rpx;
}

.settings-action-pill {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  min-height: 78rpx;
  padding: 0 20rpx;
  border-radius: 20rpx;
  box-sizing: border-box;
}

.settings-action-pill::before,
.daemon-card::before {
  content: '';
  position: absolute;
  inset: 1rpx;
  border-radius: inherit;
  background:
    radial-gradient(circle at 14% 10%, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0) 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.settings-action-pill.danger-fill {
  color: #ffffff;
  background: linear-gradient(135deg, rgba(251, 113, 133, 0.92), rgba(239, 68, 68, 0.82));
  border: 1rpx solid rgba(255, 255, 255, 0.28);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.38),
    0 12rpx 26rpx rgba(239, 68, 68, 0.18);
  backdrop-filter: blur(24rpx) saturate(140%);
}

.settings-action-icon {
  position: relative;
  width: 24rpx;
  height: 24rpx;
}

.settings-action-label {
  font-size: 27rpx;
  font-weight: 600;
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

.daemon-list > * + * {
  margin-top: 18rpx;
}

.daemon-card {
  position: relative;
  overflow: hidden;
  padding: 24rpx;
  border-radius: 24rpx;
  background: var(--app-surface-soft);
  border: 1rpx solid var(--app-border);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.56),
    0 14rpx 32rpx rgba(77, 102, 140, 0.1);
  backdrop-filter: blur(26rpx) saturate(140%);
}

.daemon-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.daemon-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #0f172a;
}

.settings-action-pill:active,
.daemon-card:active {
  transform: scale(0.992);
}

@keyframes settings-page-leave {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  to {
    opacity: 0;
    transform: translateY(-20rpx) scale(1.01);
  }
}
</style>
