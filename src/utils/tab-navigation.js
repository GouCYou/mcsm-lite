export const TAB_PAGES = [
  {
    key: 'dashboard',
    path: '/src/pages/dashboard/index',
  },
  {
    key: 'instances',
    path: '/src/pages/instances/index',
  },
  {
    key: 'settings',
    path: '/src/pages/settings/index',
  },
];

export function getTabPageIndex(key) {
  return TAB_PAGES.findIndex((item) => item.key === key);
}

export function getTabPageByKey(key) {
  return TAB_PAGES.find((item) => item.key === key) || null;
}

export function getAdjacentTabPage(key, offset) {
  const currentIndex = getTabPageIndex(key);

  if (currentIndex < 0) {
    return null;
  }

  return TAB_PAGES[currentIndex + offset] || null;
}

export function getTabNavigationDirection(currentKey, targetKey) {
  const currentIndex = getTabPageIndex(currentKey);
  const targetIndex = getTabPageIndex(targetKey);

  if (currentIndex < 0 || targetIndex < 0 || currentIndex === targetIndex) {
    return '';
  }

  return targetIndex > currentIndex ? 'forward' : 'backward';
}

export function buildTabPageUrl(targetKey, direction = '') {
  const targetPage = getTabPageByKey(targetKey);

  if (!targetPage) {
    return '';
  }

  const query = direction ? `?navDirection=${direction}&navTs=${Date.now()}` : '';
  return `${targetPage.path}${query}`;
}
