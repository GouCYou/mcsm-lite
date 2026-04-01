<script setup>
// 在应用启动阶段恢复本地连接信息，保证页面进入时能自动回填。
import { onLaunch } from '@dcloudio/uni-app';
import { useConfigStore } from './src/stores/config';

// 获取全局轻量配置仓库。
const configStore = useConfigStore();

// 应用启动时初始化本地缓存。
onLaunch(() => {
  configStore.initialize();
  uni.reLaunch({
    url: '/src/pages/login/index',
  });
});
</script>

<style>
:root,
page {
  --app-bg: #dce8f7;
  --app-bg-soft: #eef4fb;
  --app-surface: rgba(255, 255, 255, 0.24);
  --app-surface-soft: rgba(255, 255, 255, 0.18);
  --app-surface-strong: rgba(255, 255, 255, 0.38);
  --app-border: rgba(255, 255, 255, 0.4);
  --app-border-strong: rgba(255, 255, 255, 0.56);
  --app-text: #0f172a;
  --app-text-soft: #334155;
  --app-text-muted: #526277;
  --app-brand: #3483fa;
  --app-brand-soft: rgba(116, 181, 255, 0.2);
  --app-brand-strong: #1d4ed8;
  --app-success: #169d54;
  --app-success-soft: rgba(80, 223, 143, 0.18);
  --app-warn: #c47a07;
  --app-warn-soft: rgba(255, 202, 87, 0.18);
  --app-danger: #cb3a5d;
  --app-danger-soft: rgba(255, 114, 143, 0.16);
  --app-shadow: 0 26rpx 64rpx rgba(67, 89, 128, 0.16);
  --app-shadow-soft: 0 18rpx 42rpx rgba(67, 89, 128, 0.12);
  --app-glass-highlight: inset 0 1rpx 0 rgba(255, 255, 255, 0.64);
  --app-glass-edge: inset 0 -1rpx 0 rgba(255, 255, 255, 0.22);
  --app-glass-blur: 18rpx;
  --app-glass-saturation: 155%;
  --app-glass-specular:
    radial-gradient(circle at 16% 10%, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0) 32%),
    radial-gradient(circle at 82% 0%, rgba(163, 215, 255, 0.14), rgba(163, 215, 255, 0) 26%);
  --app-radius-xl: 32rpx;
  --app-radius-lg: 24rpx;
  --app-radius-md: 18rpx;
}

page {
  min-height: 100vh;
  position: relative;
  background:
    radial-gradient(circle at 12% 10%, rgba(255, 255, 255, 0.9), transparent 24%),
    radial-gradient(circle at 84% 16%, rgba(120, 204, 255, 0.38), transparent 20%),
    radial-gradient(circle at 76% 74%, rgba(255, 255, 255, 0.72), transparent 24%),
    radial-gradient(circle at 18% 76%, rgba(178, 224, 255, 0.28), transparent 18%),
    linear-gradient(180deg, #eef6ff 0%, #dce8f7 44%, #e8effa 100%);
  color: var(--app-text);
  font-family:
    'Segoe UI',
    'PingFang SC',
    'Hiragino Sans GB',
    'Microsoft YaHei',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

page::before,
page::after {
  content: '';
  position: fixed;
  pointer-events: none;
  z-index: 0;
  filter: blur(34rpx);
}

page::before {
  right: -100rpx;
  top: 100rpx;
  width: 300rpx;
  height: 300rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(58, 170, 255, 0.28), rgba(58, 170, 255, 0));
}

page::after {
  left: -110rpx;
  bottom: 140rpx;
  width: 320rpx;
  height: 320rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0));
}

button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 80rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  line-height: 1.2;
  color: var(--app-text-soft);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.54), rgba(255, 255, 255, 0.16)),
    rgba(255, 255, 255, 0.12);
  border: 1rpx solid var(--app-border);
  box-shadow:
    var(--app-glass-highlight),
    var(--app-glass-edge),
    0 14rpx 32rpx rgba(76, 104, 140, 0.12);
  backdrop-filter: blur(var(--app-glass-blur)) saturate(var(--app-glass-saturation));
  position: relative;
  box-sizing: border-box;
  text-align: center;
  vertical-align: middle;
  isolation: isolate;
  overflow: hidden;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

button::after {
  border: none;
}

button::before {
  content: '';
  position: absolute;
  inset: 1rpx;
  z-index: 0;
  border-radius: inherit;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0)),
    radial-gradient(circle at 18% 10%, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0) 34%);
  pointer-events: none;
}

button text,
button span,
button view,
button .uni-button-text,
button .uni-icons {
  position: relative;
  z-index: 1;
}

button[type='primary'] {
  color: #ffffff;
  background: linear-gradient(135deg, rgba(52, 131, 250, 0.92), rgba(35, 183, 255, 0.82));
  border: 1rpx solid rgba(255, 255, 255, 0.26);
}

button[size='mini'] {
  min-height: 64rpx;
  padding: 0 22rpx;
  border-radius: 18rpx;
  font-size: 24rpx;
  line-height: 1.2;
}

button[disabled] {
  color: #94a3b8;
  background: rgba(226, 232, 240, 0.42);
  border-color: rgba(255, 255, 255, 0.34);
}

.app-page {
  min-height: 100vh;
  padding: 28rpx 24rpx 40rpx;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

.app-tab-page {
  padding-bottom: 196rpx;
}

.app-stack > * + * {
  margin-top: 24rpx;
}

.app-card {
  position: relative;
  overflow: hidden;
  padding: 28rpx;
  border: 1rpx solid var(--app-border);
  border-radius: var(--app-radius-xl);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0.18)),
    var(--app-surface);
  box-sizing: border-box;
  box-shadow:
    var(--app-shadow),
    var(--app-glass-highlight),
    var(--app-glass-edge);
  backdrop-filter: blur(calc(var(--app-glass-blur) - 4rpx)) saturate(138%);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease;
}

.app-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--app-glass-specular);
  opacity: 0.92;
  pointer-events: none;
}

.app-card::after {
  content: '';
  position: absolute;
  inset: 1rpx;
  border-radius: inherit;
  background:
    radial-gradient(circle at 16% 12%, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0) 28%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
  opacity: 0.88;
  pointer-events: none;
}

.app-card > * {
  position: relative;
  z-index: 1;
}

.daemon-sheet,
.daemon-option-item,
.instance-node-picker,
.instance-filter-clear-inline,
.instance-page-button,
.meta-item,
.summary-item,
.info-item,
.file-summary-item,
.modal-sheet,
.path-action,
.path-chip-box,
.file-card,
.file-icon,
.modal-close,
.preview-close,
.preview-drawer,
.glass-sheet,
.glass-action-item,
.glass-dialog-button,
.app-pill,
.app-mini-button,
.detail-back-button,
.action-pill-button,
.instance-action-pill,
.instance-search-submit,
.send-button,
.file-more-button {
  isolation: isolate;
}

.daemon-sheet > *,
.daemon-option-item > *,
.instance-node-picker > *,
.instance-filter-clear-inline > *,
.instance-page-button > *,
.meta-item > *,
.summary-item > *,
.info-item > *,
.file-summary-item > *,
.modal-sheet > *,
.path-action > *,
.path-chip-box > *,
.file-card > *,
.file-icon > *,
.modal-close > *,
.preview-close > *,
.preview-drawer > *,
.glass-sheet > *,
.glass-action-item > *,
.glass-dialog-button > *,
.app-pill > *,
.app-mini-button > *,
.detail-back-button > *,
.action-pill-button > *,
.instance-action-pill > *,
.instance-search-submit > *,
.send-button > *,
.file-more-button > * {
  position: relative;
  z-index: 1;
}

text,
input,
textarea,
.app-page-title,
.app-page-desc,
.app-card-title,
.app-card-subtitle,
.app-section-title,
.app-label,
.app-text,
.app-muted,
.app-empty,
.app-pill,
.meta-label,
.meta-value,
.summary-label,
.summary-value,
.info-label,
.info-value,
.file-summary-label,
.file-summary-value,
.file-title,
.file-subline,
.modal-title,
.modal-subtitle,
.glass-sheet-title,
.glass-sheet-subtitle,
.glass-action-label,
.glass-action-desc {
  backface-visibility: hidden;
}

.app-hero-card {
  position: relative;
  overflow: hidden;
  padding: 34rpx 30rpx;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.56), transparent 28%),
    radial-gradient(circle at 14% 0%, rgba(255, 255, 255, 0.34), transparent 24%),
    linear-gradient(135deg, rgba(87, 159, 255, 0.22), rgba(115, 216, 255, 0.08)),
    rgba(255, 255, 255, 0.22);
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
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.52), rgba(255, 255, 255, 0.2)),
    var(--app-brand-soft);
  color: var(--app-brand-strong);
  font-size: 22rpx;
  font-weight: 700;
  box-sizing: border-box;
  border: 1rpx solid rgba(255, 255, 255, 0.4);
  box-shadow: var(--app-glass-highlight);
  backdrop-filter: blur(20rpx) saturate(145%);
}

.app-chip::after,
.app-pill::after {
  content: '';
  position: absolute;
  inset: 1rpx;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0));
  pointer-events: none;
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
  position: relative;
  overflow: hidden;
  padding: 24rpx;
  border-radius: 24rpx;
  background: var(--app-surface-soft);
  border: 1rpx solid var(--app-border);
  box-shadow:
    var(--app-shadow-soft),
    var(--app-glass-highlight),
    var(--app-glass-edge);
  backdrop-filter: blur(calc(var(--app-glass-blur) - 4rpx)) saturate(145%);
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
  border: 1rpx solid var(--app-border-strong);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.46)),
    rgba(255, 255, 255, 0.5);
  box-shadow:
    var(--app-glass-highlight),
    var(--app-glass-edge),
    0 12rpx 26rpx rgba(77, 102, 140, 0.08);
  box-sizing: border-box;
  position: relative;
  font-size: 28rpx;
  color: var(--app-text);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.app-picker {
  display: flex;
  align-items: center;
}

.app-mini-button {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 64rpx;
  padding: 0 22rpx;
  border-radius: 18rpx;
  border: 1rpx solid var(--app-border-strong);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.38)),
    rgba(255, 255, 255, 0.36);
  box-shadow:
    var(--app-glass-highlight),
    var(--app-glass-edge),
    0 10rpx 24rpx rgba(77, 102, 140, 0.1);
  box-sizing: border-box;
  isolation: isolate;
  text-align: center;
  color: var(--app-text-soft);
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1.2;
}

.app-mini-button::before {
  content: '';
  position: absolute;
  inset: 1rpx;
  z-index: 0;
  border-radius: inherit;
  background:
    radial-gradient(circle at 16% 10%, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0) 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.app-mini-button > * {
  position: relative;
  z-index: 1;
}

.app-mini-button.primary {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.28);
  background: linear-gradient(135deg, rgba(52, 131, 250, 0.92), rgba(35, 183, 255, 0.82));
}

.app-mini-button:active {
  transform: scale(0.986);
}

.app-textarea {
  min-height: 320rpx;
  line-height: 1.65;
}

input::placeholder,
textarea::placeholder {
  color: #94a3b8;
  opacity: 1;
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
  position: relative;
  overflow: hidden;
  font-size: 22rpx;
  font-weight: 700;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.14)),
    rgba(255, 255, 255, 0.12);
  color: var(--app-text-muted);
  box-sizing: border-box;
  border: 1rpx solid rgba(255, 255, 255, 0.38);
  box-shadow:
    var(--app-glass-highlight),
    var(--app-glass-edge);
  backdrop-filter: blur(24rpx) saturate(145%);
}

.app-pill.success {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.12)),
    var(--app-success-soft);
  color: var(--app-success);
}

.app-pill.warn {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.12)),
    var(--app-warn-soft);
  color: var(--app-warn);
}

.app-pill.danger {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.12)),
    var(--app-danger-soft);
  color: var(--app-danger);
}

.app-divider {
  height: 1rpx;
  margin: 20rpx 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.56), rgba(255, 255, 255, 0));
}

.app-code-box {
  width: 100%;
  min-height: 320rpx;
  padding: 20rpx;
  border-radius: 24rpx;
  background:
    linear-gradient(180deg, rgba(16, 25, 44, 0.88), rgba(12, 20, 34, 0.76)),
    rgba(10, 18, 34, 0.78);
  box-sizing: border-box;
  color: #e2e8f0;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.04),
    0 18rpx 38rpx rgba(12, 20, 34, 0.18);
  backdrop-filter: blur(18rpx) saturate(120%);
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

button:active,
.app-card:active,
.app-chip:active,
.app-pill:active,
.app-stat-card:active {
  transform: scale(0.992);
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
