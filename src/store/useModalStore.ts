// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 编辑弹窗全局状态（替代原 mitt 事件总线触发的 create-web/edit-class/move-web/delete-modal）。

import { create } from 'zustand'
import type { IWebProps } from '@/types/nav'

export interface ClassEditPayload {
  cls: Record<string, any> | null // null = 新增
  level: 1 | 2 | 3
  parentId?: number
}

interface ModalState {
  editWeb: { open: boolean; web: IWebProps | null; parentId?: number }
  editClass: { open: boolean; payload: ClassEditPayload | null }
  moveIds: number[] | null
  openEditWeb: (web?: IWebProps, parentId?: number) => void
  openEditClass: (payload: ClassEditPayload) => void
  openMove: (ids: number[]) => void
  closeAll: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  editWeb: { open: false, web: null },
  editClass: { open: false, payload: null },
  moveIds: null,
  openEditWeb(web, parentId) {
    set({ editWeb: { open: true, web: web ?? null, parentId } })
  },
  openEditClass(payload) {
    set({ editClass: { open: true, payload } })
  },
  openMove(ids) {
    set({ moveIds: ids })
  },
  closeAll() {
    set({
      editWeb: { open: false, web: null },
      editClass: { open: false, payload: null },
      moveIds: null,
    })
  },
}))
