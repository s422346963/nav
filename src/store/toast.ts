// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 极简全局消息提示（替代原 ng-zorro message/notification）。

import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: number
  type: ToastType
  content: string
  duration: number
}

interface ToastState {
  toasts: ToastItem[]
  show: (type: ToastType, content: string, duration?: number) => void
  remove: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show(type, content, duration = 3000) {
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts, { id, type, content, duration }] }))
    setTimeout(() => get().remove(id), duration)
  },
  remove(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))

export const toast = {
  success: (msg: string) => useToastStore.getState().show('success', msg),
  error: (msg: string) => useToastStore.getState().show('error', msg, 5000),
  info: (msg: string) => useToastStore.getState().show('info', msg),
  warning: (msg: string) => useToastStore.getState().show('warning', msg),
}
