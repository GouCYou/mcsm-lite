<template>
  <view class="login-page">
    <view class="app-card app-hero-card form-card">
      <view class="app-chip">MCSManager Lite</view>
      <view class="app-page-title">连接你的面板</view>
      <view class="app-page-desc">
        输入目标地址和 API Key，连接成功后会直接进入控制台。
      </view>

      <view class="app-section-head">
        <view class="app-section-title">连接信息</view>
      </view>

      <view class="app-field">
        <text class="app-label">目标地址</text>
        <input
          v-model.trim="form.baseUrl"
          class="app-input"
          type="text"
          placeholder="例如：192.168.1.6 或 192.168.1.6:23333"
          @blur="handleBaseUrlBlur"
        />
        <view class="baseurl-tip">可直接填写 IP；未填写协议时默认 http://，未填写端口时默认 23333。</view>
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
  </view>
</template>

<script setup>
// 登录页负责保存连接信息，并通过 overview 接口校验可用性。
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { fetchOverview } from '../../api/dashboard';
import { useConfigStore } from '../../stores/config';
import { showToast } from '../../utils/message';
import { completeBaseUrlInput, normalizeBaseUrl } from '../../utils/url';

// 获取共享配置仓库。
const configStore = useConfigStore();

// 页面表单状态。
const form = reactive({
  baseUrl: '',
  apikey: '',
});

// 防止重复提交。
const submitting = ref(false);

// 页面打开时自动回填本地配置。
onLoad(() => {
  configStore.initialize();
  form.baseUrl = configStore.state.baseUrl;
  form.apikey = configStore.state.apikey;
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

// 输入框失焦时自动补全协议和默认端口。
function handleBaseUrlBlur() {
  if (!form.baseUrl) {
    return;
  }

  const normalizedBefore = normalizeBaseUrl(String(form.baseUrl || '').trim());
  const completedBaseUrl = completeBaseUrlInput(form.baseUrl);
  const usedDefaultPort = !/:\d+$/.test(normalizedBefore.replace(/^https?:\/\//i, ''));

  form.baseUrl = completedBaseUrl;

  if (usedDefaultPort) {
    showToast('已默认补全 23333 端口');
  }
}

// 保存连接信息并测试 overview 接口。
async function handleConnect() {
  if (submitting.value || !validateForm()) {
    return;
  }

  submitting.value = true;

  try {
    const completedBaseUrl = completeBaseUrlInput(form.baseUrl);
    const normalizedInput = normalizeBaseUrl(String(form.baseUrl || '').trim());
    const usedDefaultPort = !/:\d+$/.test(normalizedInput.replace(/^https?:\/\//i, ''));

    form.baseUrl = completedBaseUrl;

    configStore.setConnectionConfig({
      baseUrl: completedBaseUrl,
      apikey: form.apikey,
    });

    if (usedDefaultPort) {
      showToast('未填写端口，已默认使用 23333');
    }

    const response = await fetchOverview({
      loading: true,
      loadingText: '正在连接面板...',
    });

    configStore.setOverview(response.data);
    showToast('连接成功', 'success');

    uni.redirectTo({
      url: '/src/pages/dashboard/index',
    });
  } catch (error) {
    console.error('连接面板失败', error);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32rpx 24rpx;
  box-sizing: border-box;
}

.form-card {
  width: 100%;
  max-width: 720rpx;
  padding-top: 34rpx;
}

.login-submit-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  min-height: 82rpx;
  margin-top: 28rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 16rpx 32rpx rgba(37, 99, 235, 0.22);
}

.login-submit-pill.disabled {
  opacity: 0.64;
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

.baseurl-tip {
  margin-top: 12rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: #64748b;
}
</style>
