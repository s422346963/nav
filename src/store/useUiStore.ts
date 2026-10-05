// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 前台布局 UI 状态：桌面端侧栏展开 / 收起、已展开的分类。
// 必须放在 store：首页 / 搜索 / 分类是三个路由，切换路由会卸载重建页面（含 AppLayout / Sidebar），
// 局部 state 会被重置成默认值——表现为点「首页」或二级菜单后侧栏自己弹开、手动的分类展开丢失。

import { create } from 'zustand'

interface UiState {
  /** 桌面端侧栏是否展开（移动端抽屉另有局部 state） */
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  /** 侧栏已展开的一级分类 id */
  expandedOneIds: number[]
  setExpandedOneIds: (ids: number[]) => void
  /** 追加展开（已在列表中则不变），供「当前分类默认展开」使用 */
  expandOne: (id: number) => void
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarOpen: true,
  toggleSidebar() {
    set({ sidebarOpen: !get().sidebarOpen })
  },
  setSidebarOpen(open) {
    set({ sidebarOpen: open })
  },
  expandedOneIds: [],
  setExpandedOneIds(ids) {
    // 内容相同则不更新，避免无意义的重渲染
    const cur = get().expandedOneIds
    if (cur.length === ids.length && cur.every((v, i) => v === ids[i])) return
    set({ expandedOneIds: ids })
  },
  expandOne(id) {
    const ids = get().expandedOneIds
    if (!ids.includes(id)) set({ expandedOneIds: [...ids, id] })
  },
}))
