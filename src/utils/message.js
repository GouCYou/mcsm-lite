// 统一封装提示方法，后续切换为自定义轻提示时只需要改这里。
export function showToast(title, icon = 'none', duration = 2000) {
  uni.showToast({
    title,
    icon,
    duration,
  });
}

// 显示全局加载中提示。
export function showLoading(title = '加载中...') {
  uni.showLoading({
    title,
    mask: true,
  });
}

// 关闭全局加载中提示。
export function hideLoading() {
  uni.hideLoading();
}
