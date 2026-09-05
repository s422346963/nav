// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 暗黑模式：Tailwind dark class 切换，记忆 localStorage（原 key isDark）。

import { create } from 'zustand'

function initialDark(): boolean {
  const storageVal = localStorage.getItem('isDark')
  if (storageVal != null) {
    return !!Number(storageVal)
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false
}

interface ThemeState {
  dark: boolean
  toggle: () => void
  set: (dark: boolean) => void
}

function apply(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const dark = initialDark()
  apply(dark)
  return {
    dark,
    toggle() {
      const next = !get().dark
      apply(next)
      localStorage.setItem('isDark', next ? '1' : '0')
      set({ dark: next })
    },
    set(dark) {
      apply(dark)
      localStorage.setItem('isDark', dark ? '1' : '0')
      set({ dark })
    },
  }
})
