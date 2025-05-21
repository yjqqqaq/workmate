/**
 * 主题管理服务
 */

// 主题设置的localStorage键名
const THEME_KEY = 'theme';

// 主题模式
const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

/**
 * 获取当前主题模式
 * @returns {string} 当前主题模式 ('light', 'dark', 'system')
 */
export function getThemeMode() {
  return localStorage.getItem(THEME_KEY) || THEME_MODES.SYSTEM;
}

/**
 * 设置主题模式
 * @param {string} mode - 主题模式 ('light', 'dark', 'system')
 */
export function setThemeMode(mode) {
  if (Object.values(THEME_MODES).includes(mode)) {
    localStorage.setItem(THEME_KEY, mode);
    applyTheme(mode);
  }
}

/**
 * 应用主题到DOM
 * @param {string} mode - 主题模式 ('light', 'dark', 'system')
 */
export function applyTheme(mode) {
  const isDark = mode === THEME_MODES.DARK || 
    (mode === THEME_MODES.SYSTEM && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  if (isDark) {
    // 暗色主题 - 黑底白字
    document.documentElement.classList.add('dark');
  } else {
    // 亮色主题 - 白底黑字
    document.documentElement.classList.remove('dark');
  }
}

/**
 * 切换主题模式
 * @returns {string} 切换后的主题模式
 */
export function toggleTheme() {
  const currentMode = getThemeMode();
  let newMode;
  
  if (currentMode === THEME_MODES.LIGHT) {
    newMode = THEME_MODES.DARK;
  } else if (currentMode === THEME_MODES.DARK) {
    newMode = THEME_MODES.SYSTEM;
  } else {
    newMode = THEME_MODES.LIGHT;
  }
  
  setThemeMode(newMode);
  return newMode;
}

/**
 * 初始化主题
 */
export function initTheme() {
  const savedMode = getThemeMode();
  applyTheme(savedMode);
  
  // 监听系统主题变化
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (getThemeMode() === THEME_MODES.SYSTEM) {
        applyTheme(THEME_MODES.SYSTEM);
      }
    });
  }
}

export default {
  THEME_MODES,
  getThemeMode,
  setThemeMode,
  applyTheme,
  toggleTheme,
  initTheme
};