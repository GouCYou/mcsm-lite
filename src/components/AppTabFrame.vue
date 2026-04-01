<template>
  <view
    class="tab-frame"
    :class="frameClassList"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchcancel="resetTouchState"
    @animationend="handleAnimationEnd"
  >
    <AppPageScroll :refreshing="refreshing" tab-page @refresh="handleRefresh">
      <slot />
    </AppPageScroll>
    <AppTabbar :current="current" :animating="transitioning" @navigate="handleTabNavigate" />
    <AppMessageHost />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import AppMessageHost from './AppMessageHost.vue';
import AppPageScroll from './AppPageScroll.vue';
import AppTabbar from './AppTabbar.vue';
import { buildTabPageUrl, getAdjacentTabPage, getTabNavigationDirection } from '../utils/tab-navigation';

const props = defineProps({
  current: {
    type: String,
    required: true,
  },
  refreshing: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['refresh']);

const transitioning = ref(false);
const transitionPhase = ref('');
const transitionDirection = ref('');
const touchStartX = ref(0);
const touchStartY = ref(0);

const pages = getCurrentPages();
const currentPage = pages[pages.length - 1];
const initialDirection = currentPage?.options?.navDirection || '';
const enterDirection = ref(initialDirection === 'forward' || initialDirection === 'backward' ? initialDirection : '');

const frameClassList = computed(() => ({
  [`tab-frame-enter-${enterDirection.value}`]: Boolean(enterDirection.value),
  [`tab-frame-leave-${transitionDirection.value}`]: transitioning.value && transitionPhase.value === 'leave' && Boolean(transitionDirection.value),
}));

function handleRefresh() {
  emit('refresh');
}

function handleTabNavigate(targetKey) {
  const direction = getTabNavigationDirection(props.current, targetKey);

  if (!direction) {
    return;
  }

  startTransition(targetKey, direction);
}

function startTransition(targetKey, direction) {
  if (transitioning.value) {
    return;
  }

  const targetUrl = buildTabPageUrl(targetKey, direction);

  if (!targetUrl) {
    return;
  }

  transitioning.value = true;
  transitionPhase.value = 'leave';
  transitionDirection.value = direction;

  setTimeout(() => {
    uni.redirectTo({
      url: targetUrl,
    });
  }, 240);
}

function handleTouchStart(event) {
  if (transitioning.value) {
    return;
  }

  const touch = event.touches?.[0];

  if (!touch) {
    return;
  }

  touchStartX.value = touch.clientX;
  touchStartY.value = touch.clientY;
}

function handleTouchEnd(event) {
  if (transitioning.value) {
    return;
  }

  const touch = event.changedTouches?.[0];

  if (!touch) {
    return;
  }

  const deltaX = touch.clientX - touchStartX.value;
  const deltaY = touch.clientY - touchStartY.value;

  resetTouchState();

  if (Math.abs(deltaX) < 70 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) {
    return;
  }

  if (deltaX < 0) {
    const nextPage = getAdjacentTabPage(props.current, 1);

    if (nextPage) {
      startTransition(nextPage.key, 'forward');
    }

    return;
  }

  const prevPage = getAdjacentTabPage(props.current, -1);

  if (prevPage) {
    startTransition(prevPage.key, 'backward');
  }
}

function resetTouchState() {
  touchStartX.value = 0;
  touchStartY.value = 0;
}

function handleAnimationEnd() {
  if (enterDirection.value) {
    enterDirection.value = '';
  }
}
</script>

<style scoped>
.tab-frame {
  position: relative;
  min-height: 100vh;
  background: transparent;
  will-change: transform, opacity;
  overflow: hidden;
}

.tab-frame::before,
.tab-frame::after {
  content: '';
  position: fixed;
  pointer-events: none;
  z-index: 0;
  border-radius: 50%;
  filter: blur(42rpx);
  opacity: 0.82;
}

.tab-frame::before {
  right: -80rpx;
  top: 160rpx;
  width: 260rpx;
  height: 260rpx;
  background: radial-gradient(circle, rgba(117, 204, 255, 0.28), rgba(117, 204, 255, 0));
}

.tab-frame::after {
  left: -90rpx;
  bottom: 140rpx;
  width: 280rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0));
}

.tab-frame-enter-forward {
  animation: tab-frame-enter-forward 0.28s ease;
}

.tab-frame-enter-backward {
  animation: tab-frame-enter-backward 0.28s ease;
}

.tab-frame-leave-forward {
  animation: tab-frame-leave-forward 0.24s ease-in forwards;
}

.tab-frame-leave-backward {
  animation: tab-frame-leave-backward 0.24s ease-in forwards;
}

@keyframes tab-frame-enter-forward {
  from {
    opacity: 0.86;
    transform: translateX(72rpx);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes tab-frame-enter-backward {
  from {
    opacity: 0.86;
    transform: translateX(-72rpx);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes tab-frame-leave-forward {
  from {
    opacity: 1;
    transform: translateX(0);
  }

  to {
    opacity: 0.92;
    transform: translateX(-72rpx);
  }
}

@keyframes tab-frame-leave-backward {
  from {
    opacity: 1;
    transform: translateX(0);
  }

  to {
    opacity: 0.92;
    transform: translateX(72rpx);
  }
}
</style>
