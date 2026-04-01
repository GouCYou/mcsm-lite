<template>
  <view class="login-page" :class="{ 'login-page-enter': loginEnterAnimated, 'login-page-leave': loginLeaving }">
    <view class="app-card app-hero-card form-card">
      <view class="login-brand">MCSManager Lite</view>
      <view class="app-page-title">连接你的面板</view>
      <view class="app-page-desc">
        输入目标地址和 API Key，连接成功后会直接进入控制台。
      </view>

      <view class="app-field">
        <text class="app-label">目标地址</text>
        <input
          v-model.trim="form.baseUrl"
          class="app-input"
          type="text"
          placeholder="例如：192.168.1.6 或 192.168.1.6:23333"
        />
      </view>

      <view class="app-field">
        <text class="app-label">apikey</text>
        <input
          v-model.trim="form.apikey"
          class="app-input"
          type="text"
          password
          placeholder="请输入 MCSManager API Key"
        />
      </view>

      <view
        class="login-submit-pill"
        :class="{ disabled: submitting }"
        @click="handleConnect"
      >
        <view class="login-submit-icon icon-connect" />
        <text class="login-submit-label">{{ submitting ? '连接中' : '连接面板' }}</text>
      </view>
    </view>
    <AppMessageHost />
  </view>
</template>

<script setup>
// 登录页负责保存连接信息，并通过 overview 接口校验可用性。
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AppMessageHost from '../../components/AppMessageHost.vue';
import { useConfigStore } from '../../stores/config';
import { hideLoading, showLoading, showToast } from '../../utils/message';
import { buildRequestUrl } from '../../utils/url';
import { buildBaseUrlCandidates, getBaseUrlDisplayValue } from '../../utils/url';

// 获取共享配置仓库。
const configStore = useConfigStore();

// 页面表单状态。
const form = reactive({
  baseUrl: '',
  apikey: '',
});

// 防止重复提交。
const submitting = ref(false);
const loginEnterAnimated = ref(false);
const loginLeaving = ref(false);

// 页面打开时自动回填本地配置。
onLoad((options) => {
  configStore.initialize();
  form.baseUrl = getBaseUrlDisplayValue(configStore.state.baseUrl);
  form.apikey = configStore.state.apikey;

  if (String(options?.nav || '') === 'logout') {
    loginEnterAnimated.value = true;
    setTimeout(() => {
      loginEnterAnimated.value = false;
    }, 320);
  }
});

// 校验表单。
function validateForm() {
  if (!form.baseUrl) {
    showToast('请输入目标地址');
    return false;
  }

  if (!form.apikey) {
    showToast('请输入 apikey');
    return false;
  }

  return true;
}

// 登录前逐个探测候选地址，未显式填写协议时自动判断 https/http。
function requestOverviewByBaseUrl(baseUrl, apikey) {
  const requestUrl = buildRequestUrl(baseUrl, '/api/overview', {
    apikey,
  });

  return new Promise((resolve, reject) => {
    uni.request({
      url: requestUrl,
      method: 'GET',
      timeout: 10000,
      header: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      success: (response) => {
        const { statusCode, data } = response;

        if (statusCode < 200 || statusCode >= 300) {
          reject(new Error(`HTTP ${statusCode}`));
          return;
        }

        if (!data || data.status !== 200) {
          reject(new Error(data?.message || data?.msg || '接口返回异常'));
          return;
        }

        resolve(data);
      },
      fail: (error) => {
        reject(error);
      },
    });
  });
}

async function resolveConnectionConfig(baseUrlInput, apikey) {
  const candidates = buildBaseUrlCandidates(baseUrlInput);

  if (!candidates.length) {
    throw new Error('请输入目标地址');
  }

  let lastError = null;

  for (const candidate of candidates) {
    try {
      const data = await requestOverviewByBaseUrl(candidate, apikey);
      return {
        baseUrl: candidate,
        overview: data.data,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('网络请求失败，请检查地址或服务是否可用');
}

// 保存连接信息并测试 overview 接口。
async function handleConnect() {
  if (submitting.value || loginLeaving.value || !validateForm()) {
    return;
  }

  submitting.value = true;

  try {
    showLoading('正在连接面板...');

    const { baseUrl, overview } = await resolveConnectionConfig(form.baseUrl, form.apikey);

    configStore.setConnectionConfig({
      baseUrl,
      apikey: form.apikey,
    });

    configStore.setOverview(overview);
    showToast('连接成功', 'success');

    loginLeaving.value = true;

    setTimeout(() => {
      uni.redirectTo({
        url: '/src/pages/dashboard/index?navDirection=forward&nav=login',
      });
    }, 220);
  } catch (error) {
    console.error('连接面板失败', error);
    showToast('连接失败，请检查地址、端口、协议或 apikey');
  } finally {
    hideLoading();
    submitting.value = false;
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32rpx 24rpx;
  box-sizing: border-box;
  overflow: hidden;
  transform-origin: center center;
}

.login-page-enter {
  animation: login-page-enter 0.32s ease;
}

.login-page-leave {
  animation: login-page-leave 0.22s ease forwards;
}

.form-card {
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 720rpx;
  padding-top: 34rpx;
}

.form-card::after {
  content: '';
  position: absolute;
  right: -72rpx;
  top: -88rpx;
  width: 240rpx;
  height: 240rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.login-brand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 64rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.56), rgba(255, 255, 255, 0.18)),
    var(--app-brand-soft);
  color: var(--app-brand-strong);
  font-size: 30rpx;
  font-weight: 800;
  box-sizing: border-box;
  border: 1rpx solid rgba(255, 255, 255, 0.46);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.58),
    0 14rpx 30rpx rgba(64, 93, 140, 0.1);
  backdrop-filter: blur(22rpx) saturate(145%);
  letter-spacing: 0.5rpx;
}

.login-submit-pill {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  min-height: 82rpx;
  margin-top: 28rpx;
  border-radius: 22rpx;
  background:
    linear-gradient(135deg, rgba(52, 131, 250, 0.92), rgba(35, 183, 255, 0.82)),
    rgba(255, 255, 255, 0.18);
  border: 1rpx solid rgba(255, 255, 255, 0.34);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.46),
    0 18rpx 34rpx rgba(52, 131, 250, 0.24);
  backdrop-filter: blur(26rpx) saturate(148%);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.login-submit-pill::before {
  content: '';
  position: absolute;
  inset: 1rpx;
  border-radius: inherit;
  background:
    radial-gradient(circle at 16% 10%, rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0) 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.login-submit-pill.disabled {
  opacity: 0.64;
}

.login-submit-pill:active {
  transform: scale(0.988);
}

@keyframes login-page-enter {
  from {
    opacity: 0.72;
    transform: translateY(34rpx) scale(0.988);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes login-page-leave {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  to {
    opacity: 0;
    transform: translateY(-20rpx) scale(1.01);
  }
}

.login-submit-icon {
  position: relative;
  width: 24rpx;
  height: 24rpx;
}

.login-submit-label {
  font-size: 28rpx;
  font-weight: 700;
  color: #ffffff;
}

.icon-connect::before {
  content: '';
  position: absolute;
  left: 6rpx;
  top: 2rpx;
  width: 0;
  height: 0;
  border-top: 10rpx solid transparent;
  border-bottom: 10rpx solid transparent;
  border-left: 16rpx solid #ffffff;
}

</style>
