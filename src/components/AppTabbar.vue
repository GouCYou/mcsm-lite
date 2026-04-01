<template>
  <view class="tabbar-shell">
    <view class="tabbar-panel">
      <view
        v-for="item in navItems"
        :key="item.key"
        class="tabbar-item"
        :class="{ active: current === item.key, disabled: animating }"
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
  animating: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['navigate']);

// 主导航配置放在组件内部统一维护。
const navItems = [
  {
    key: 'dashboard',
    label: '控制台',
    icon: '/static/tabbar/dashboard.png',
    activeIcon: '/static/tabbar/dashboard-active.png',
  },
  {
    key: 'instances',
    label: '实例',
    icon: '/static/tabbar/instances.png',
    activeIcon: '/static/tabbar/instances-active.png',
  },
  {
    key: 'settings',
    label: '设置',
    icon: '/static/tabbar/settings.png',
    activeIcon: '/static/tabbar/settings-active.png',
  },
];

// 点击导航项时由外层容器统一决定动画方向和跳转时机。
function navigate(item) {
  if (props.animating || item.key === props.current) {
    return;
  }

  emit('navigate', item.key);
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
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.62);
  border-radius: 36rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0.18)),
    rgba(255, 255, 255, 0.16);
  box-shadow:
    0 20rpx 44rpx rgba(15, 23, 42, 0.12),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(32rpx) saturate(145%);
}

.tabbar-panel::before {
  content: '';
  position: absolute;
  inset: 1rpx;
  border-radius: inherit;
  background:
    radial-gradient(circle at 12% 0%, rgba(255, 255, 255, 0.36), rgba(255, 255, 255, 0) 28%),
    radial-gradient(circle at 88% 10%, rgba(142, 206, 255, 0.2), rgba(142, 206, 255, 0) 24%);
  pointer-events: none;
}

.tabbar-item {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  min-height: 88rpx;
  padding: 10rpx 6rpx;
  border-radius: 28rpx;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
  box-sizing: border-box;
}

.tabbar-item.active {
  background:
    linear-gradient(135deg, rgba(82, 153, 255, 0.22), rgba(148, 210, 255, 0.12)),
    rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.54),
    0 14rpx 28rpx rgba(61, 122, 214, 0.12);
}

.tabbar-item.active::before {
  content: '';
  position: absolute;
  inset: 6rpx;
  border-radius: 24rpx;
  background:
    radial-gradient(circle at 18% 10%, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.tabbar-item.disabled {
  pointer-events: none;
}

.tabbar-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.28);
  border: 1rpx solid rgba(255, 255, 255, 0.36);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(22rpx) saturate(140%);
}

.tabbar-item.active .tabbar-icon-wrap {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.52), rgba(255, 255, 255, 0.2)),
    rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.58),
    0 10rpx 22rpx rgba(61, 122, 214, 0.12);
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

.tabbar-item:active {
  transform: scale(0.985);
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
