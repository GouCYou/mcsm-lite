<template>
  <view class="message-host">
    <view
      v-if="toast.visible"
      class="message-toast-wrap"
      :class="{ 'message-toast-wrap-leave': toast.closing }"
    >
      <view class="message-toast" :class="[toast.type, { 'message-toast-leave': toast.closing }]">
        <view class="message-toast-dot" />
        <text class="message-toast-text">{{ toast.title }}</text>
      </view>
    </view>

    <view
      v-if="loading.visible"
      class="message-loading-mask"
      :class="{ 'message-loading-mask-leave': loading.closing }"
    >
      <view class="message-loading-card" :class="{ 'message-loading-card-leave': loading.closing }">
        <view class="message-loading-spinner" />
        <view class="message-loading-title">{{ loading.title }}</view>
        <view class="message-loading-desc">请稍候，正在完成当前操作</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { useUiStore } from '../stores/ui';

const uiStore = useUiStore();

const toast = computed(() => uiStore.state.toast);
const loading = computed(() => uiStore.state.loading);
</script>

<style scoped>
.message-host {
  pointer-events: none;
}

.message-toast-wrap {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  top: 36rpx;
  z-index: 1600;
  display: flex;
  justify-content: center;
  animation: message-toast-wrap-enter 0.22s ease;
}

.message-toast-wrap-leave {
  animation: message-toast-wrap-leave 0.18s ease forwards;
}

.message-toast {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 14rpx;
  max-width: 680rpx;
  min-height: 80rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.24)),
    rgba(255, 255, 255, 0.18);
  border: 1rpx solid rgba(255, 255, 255, 0.58);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.68),
    0 20rpx 44rpx rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(30rpx) saturate(148%);
  box-sizing: border-box;
}

.message-toast::before,
.message-loading-card::before {
  content: '';
  position: absolute;
  inset: 1rpx;
  border-radius: inherit;
  background:
    radial-gradient(circle at 14% 10%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0) 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.message-toast.success {
  color: #0f7a42;
}

.message-toast.error {
  color: #c73556;
}

.message-toast.info {
  color: #334155;
}

.message-toast-dot {
  position: relative;
  z-index: 1;
  width: 14rpx;
  min-width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 8rpx rgba(255, 255, 255, 0.26);
}

.message-toast-text {
  position: relative;
  z-index: 1;
  font-size: 25rpx;
  font-weight: 700;
  line-height: 1.4;
}

.message-loading-mask {
  position: fixed;
  inset: 0;
  z-index: 1700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  background: rgba(10, 18, 34, 0.18);
  backdrop-filter: blur(18rpx) saturate(130%);
  pointer-events: auto;
  box-sizing: border-box;
  animation: message-loading-mask-enter 0.2s ease;
}

.message-loading-mask-leave {
  animation: message-loading-mask-leave 0.18s ease forwards;
}

.message-loading-card {
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 420rpx;
  padding: 34rpx 28rpx 30rpx;
  border-radius: 34rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.24)),
    rgba(255, 255, 255, 0.2);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.7),
    0 28rpx 60rpx rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(32rpx) saturate(150%);
  box-sizing: border-box;
  text-align: center;
  animation: message-loading-card-enter 0.24s ease;
}

.message-loading-card-leave {
  animation: message-loading-card-leave 0.18s ease forwards;
}

.message-loading-spinner {
  position: relative;
  z-index: 1;
  width: 68rpx;
  height: 68rpx;
  margin: 0 auto;
  border-radius: 50%;
  border: 6rpx solid rgba(52, 131, 250, 0.16);
  border-top-color: rgba(52, 131, 250, 0.92);
  border-right-color: rgba(35, 183, 255, 0.82);
  animation: message-spinner-rotate 0.82s linear infinite;
}

.message-loading-title {
  position: relative;
  z-index: 1;
  margin-top: 22rpx;
  font-size: 30rpx;
  font-weight: 800;
  color: #0f172a;
}

.message-loading-desc {
  position: relative;
  z-index: 1;
  margin-top: 10rpx;
  font-size: 23rpx;
  line-height: 1.6;
  color: #64748b;
}

@keyframes message-toast-wrap-enter {
  from {
    opacity: 0;
    transform: translateY(-18rpx);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes message-toast-wrap-leave {
  from {
    opacity: 1;
    transform: translateY(0);
  }

  to {
    opacity: 0;
    transform: translateY(-16rpx);
  }
}

@keyframes message-loading-mask-enter {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes message-loading-mask-leave {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@keyframes message-loading-card-enter {
  from {
    opacity: 0;
    transform: translateY(28rpx) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes message-loading-card-leave {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  to {
    opacity: 0;
    transform: translateY(18rpx) scale(0.985);
  }
}

@keyframes message-spinner-rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
