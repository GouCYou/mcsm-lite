<template>
  <view class="tabbar-shell">
    <view class="tabbar-panel">
      <view
        v-for="item in navItems"
        :key="item.key"
        class="tabbar-item"
        :class="{ active: current === item.key }"
        @click="navigate(item)"
      >
        <view class="tabbar-icon-wrap">
          <image
            class="tabbar-icon"
            :src="current === item.key ? item.activeIcon : item.icon"
            mode="aspectFit"
          />
        </view>
        <text class="tabbar-label">{{ item.label }}</text>
      </view>
    </view>
    <view class="tabbar-safe" />
  </view>
</template>

<script setup>
// 自定义底部导航，替代原生 tabBar，方便控制位置、圆角和安全区。
const props = defineProps({
  current: {
    type: String,
    default: 'dashboard',
  },
});

// 主导航配置放在组件内部统一维护。
const navItems = [
  {
    key: 'dashboard',
    label: '控制台',
    path: '/src/pages/dashboard/index',
    icon: '/static/tabbar/dashboard.png',
    activeIcon: '/static/tabbar/dashboard-active.png',
  },
  {
    key: 'instances',
    label: '实例',
    path: '/src/pages/instances/index',
    icon: '/static/tabbar/instances.png',
    activeIcon: '/static/tabbar/instances-active.png',
  },
  {
    key: 'settings',
    label: '设置',
    path: '/src/pages/settings/index',
    icon: '/static/tabbar/settings.png',
    activeIcon: '/static/tabbar/settings-active.png',
  },
];

// 在三个一级页面之间切换时使用 redirectTo，避免页面栈不断累积。
function navigate(item) {
  if (item.key === props.current) {
    return;
  }

  uni.redirectTo({
    url: item.path,
  });
}
</script>

<style scoped>
.tabbar-shell {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  bottom: 0;
  z-index: 999;
}

.tabbar-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  border-radius: 36rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(248, 250, 252, 0.92));
  box-shadow: 0 20rpx 44rpx rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(24rpx);
}

.tabbar-item {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  min-height: 88rpx;
  padding: 10rpx 6rpx;
  border-radius: 28rpx;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.tabbar-item.active {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(14, 165, 233, 0.08));
}

.tabbar-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.74);
}

.tabbar-item.active .tabbar-icon-wrap {
  background: rgba(255, 255, 255, 0.92);
}

.tabbar-icon {
  width: 38rpx;
  height: 38rpx;
}

.tabbar-label {
  font-size: 22rpx;
  font-weight: 600;
  color: #64748b;
}

.tabbar-item.active .tabbar-label {
  color: #1d4ed8;
}

.tabbar-safe {
  height: 20rpx;
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .tabbar-safe {
    height: calc(20rpx + env(safe-area-inset-bottom));
  }
}
</style>
