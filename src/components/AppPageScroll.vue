<template>
  <scroll-view
    class="page-scroll"
    :class="{ 'page-scroll-tab': tabPage }"
    :scroll-y="scrollEnabled"
    enhanced
    show-scrollbar="false"
    :refresher-enabled="scrollEnabled"
    :refresher-triggered="refreshing"
    refresher-background="transparent"
    @refresherrefresh="handleRefresh"
  >
    <view class="page-scroll-body">
      <slot />
    </view>
  </scroll-view>
</template>

<script setup>
// 统一封装页面滚动容器，提供更接近移动浏览器的下拉刷新体验。
const props = defineProps({
  refreshing: {
    type: Boolean,
    default: false,
  },
  tabPage: {
    type: Boolean,
    default: false,
  },
  scrollEnabled: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['refresh']);

// 把下拉刷新事件抛给页面自己处理数据加载。
function handleRefresh() {
  if (props.refreshing) {
    return;
  }

  emit('refresh');
}
</script>

<style scoped>
.page-scroll {
  height: 100vh;
  background: transparent;
}

.page-scroll-body {
  min-height: 100%;
}

.page-scroll-tab {
  padding-bottom: 0;
}
</style>
