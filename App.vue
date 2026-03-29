<script setup>
// 在应用启动阶段恢复本地连接信息，保证页面进入时能自动回填。
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app';
import { useConfigStore } from './src/stores/config';

// 获取全局轻量配置仓库。
const configStore = useConfigStore();

// 应用启动时初始化本地缓存。
onLaunch(() => {
  configStore.initialize();
});

// 保留基础生命周期日志，便于调试真机问题。
onShow(() => {
  console.log('App Show');
});

// 保留基础生命周期日志，便于调试真机问题。
onHide(() => {
  console.log('App Hide');
});
</script>

<style>
:root,
page {
  --app-bg: #eff3f8;
  --app-bg-soft: #f7f9fc;
  --app-surface: rgba(255, 255, 255, 0.92);
  --app-surface-strong: #ffffff;
  --app-border: rgba(148, 163, 184, 0.18);
  --app-text: #0f172a;
  --app-text-soft: #475569;
  --app-text-muted: #64748b;
  --app-brand: #2563eb;
  --app-brand-soft: #dbeafe;
  --app-brand-strong: #1d4ed8;
  --app-success: #16a34a;
  --app-success-soft: rgba(34, 197, 94, 0.14);
  --app-warn: #d97706;
  --app-warn-soft: rgba(245, 158, 11, 0.16);
  --app-danger: #dc2626;
  --app-danger-soft: rgba(239, 68, 68, 0.14);
  --app-shadow: 0 18rpx 40rpx rgba(15, 23, 42, 0.08);
  --app-radius-xl: 32rpx;
  --app-radius-lg: 24rpx;
  --app-radius-md: 18rpx;
}

page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.96), transparent 32%),
    linear-gradient(180deg, #f9fbfe 0%, var(--app-bg) 100%);
  color: var(--app-text);
  font-family:
    'Segoe UI',
    'PingFang SC',
    'Hiragino Sans GB',
    'Microsoft YaHei',
    sans-serif;
}

button {
  min-height: 80rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  line-height: 80rpx;
  color: var(--app-text-soft);
  background: rgba(255, 255, 255, 0.86);
  border: 1rpx solid rgba(148, 163, 184, 0.18);
}

button::after {
  border: none;
}

button[type='primary'] {
  color: #ffffff;
  background: linear-gradient(135deg, var(--app-brand), #0ea5e9);
  border: none;
}

button[size='mini'] {
  min-height: 64rpx;
  padding: 0 22rpx;
  border-radius: 18rpx;
  font-size: 24rpx;
  line-height: 64rpx;
}

button[disabled] {
  color: #94a3b8;
  background: rgba(226, 232, 240, 0.72);
  border-color: rgba(203, 213, 225, 0.8);
}

.app-page {
  min-height: 100vh;
  padding: 28rpx 24rpx 40rpx;
  box-sizing: border-box;
}

.app-tab-page {
  padding-bottom: 196rpx;
}

.app-stack > * + * {
  margin-top: 24rpx;
}

.app-card {
  padding: 28rpx;
  border: 1rpx solid var(--app-border);
  border-radius: var(--app-radius-xl);
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
  box-sizing: border-box;
  backdrop-filter: blur(18rpx);
}

.app-hero-card {
  position: relative;
  overflow: hidden;
  padding: 34rpx 30rpx;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.46), transparent 32%),
    linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(14, 165, 233, 0.12)),
    rgba(255, 255, 255, 0.94);
}

.app-hero-card::before {
  content: '';
  position: absolute;
  right: -36rpx;
  top: -52rpx;
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
}

.app-card-title {
  position: relative;
  z-index: 1;
  font-size: 34rpx;
  font-weight: 700;
  color: var(--app-text);
}

.app-card-subtitle {
  position: relative;
  z-index: 1;
  margin-top: 10rpx;
  font-size: 25rpx;
  line-height: 1.7;
  color: var(--app-text-muted);
}

.app-page-title {
  font-size: 52rpx;
  font-weight: 700;
  line-height: 1.18;
  color: var(--app-text);
}

.app-page-desc {
  margin-top: 14rpx;
  font-size: 27rpx;
  line-height: 1.75;
  color: var(--app-text-muted);
}

.app-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: var(--app-brand-soft);
  color: var(--app-brand-strong);
  font-size: 22rpx;
  font-weight: 700;
  box-sizing: border-box;
}

.app-text {
  margin-top: 10rpx;
  font-size: 27rpx;
  line-height: 1.7;
  color: var(--app-text-soft);
  word-break: break-all;
}

.app-muted {
  margin-top: 10rpx;
  font-size: 25rpx;
  line-height: 1.7;
  color: var(--app-text-muted);
}

.app-empty {
  font-size: 27rpx;
  line-height: 1.7;
  color: var(--app-text-muted);
}

.app-header-row,
.app-row-between {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.app-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 22rpx;
}

.app-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.app-stat-card {
  padding: 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(148, 163, 184, 0.14);
  box-sizing: border-box;
}

.app-stat-label {
  font-size: 24rpx;
  color: var(--app-text-muted);
}

.app-stat-value {
  margin-top: 16rpx;
  font-size: 40rpx;
  font-weight: 700;
  color: var(--app-text);
}

.app-field + .app-field {
  margin-top: 22rpx;
}

.app-label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--app-text-soft);
}

.app-input,
.app-picker,
.app-textarea {
  width: 100%;
  min-height: 92rpx;
  padding: 22rpx 24rpx;
  border-radius: 22rpx;
  border: 1rpx solid rgba(148, 163, 184, 0.2);
  background: rgba(248, 250, 252, 0.88);
  box-sizing: border-box;
  font-size: 28rpx;
  color: var(--app-text);
}

.app-picker {
  display: flex;
  align-items: center;
}

.app-textarea {
  min-height: 320rpx;
  line-height: 1.65;
}

.app-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 18rpx;
}

.app-section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--app-text);
}

.app-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
  background: rgba(148, 163, 184, 0.14);
  color: var(--app-text-muted);
  box-sizing: border-box;
}

.app-pill.success {
  background: var(--app-success-soft);
  color: var(--app-success);
}

.app-pill.warn {
  background: var(--app-warn-soft);
  color: var(--app-warn);
}

.app-pill.danger {
  background: var(--app-danger-soft);
  color: var(--app-danger);
}

.app-divider {
  height: 1rpx;
  margin: 20rpx 0;
  background: rgba(148, 163, 184, 0.16);
}

.app-code-box {
  width: 100%;
  min-height: 320rpx;
  padding: 20rpx;
  border-radius: 24rpx;
  background: #0f172a;
  box-sizing: border-box;
  color: #e2e8f0;
}

.app-code-text {
  font-size: 24rpx;
  line-height: 1.65;
  color: #e2e8f0;
  word-break: break-all;
}

.app-safe-bottom {
  height: 12rpx;
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .app-tab-page {
    padding-bottom: calc(196rpx + env(safe-area-inset-bottom));
  }

  .app-safe-bottom {
    height: env(safe-area-inset-bottom);
  }
}
</style>
