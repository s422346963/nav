// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 本地收藏 store：只存 localStorage，未登录也能使用，与云端 nav 数据完全解耦。
// 收藏保存的是网站快照（名称/链接/图标/描述），分类被删、未登录过滤后收藏依然可用。

import { create } from 'zustand'
import type { IWebProps } from '@/types/nav'

export const FAVORITES_KEY = 'FAVORITES'

export interface IFavoriteItem {
  id: number
  name: string
  url: string
  icon: string
  desc?: string
  /** 收藏时间戳（毫秒）；列表按收藏先后排列，新收藏追加在末尾 */
  at: number
}

function readFavorites(): IFavoriteItem[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (it: any) => it && typeof it.id === 'number' && typeof it.url === 'string',
    )
  } catch {
    return []
  }
}

function writeFavorites(list: IFavoriteItem[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('收藏持久化失败', e)
  }
}

interface FavoriteState {
  list: IFavoriteItem[]
  /** 收藏 / 取消收藏，返回操作后是否已收藏 */
  toggle: (web: IWebProps) => boolean
  remove: (id: number) => void
  /** 置顶：移到列表最前 */
  moveTop: (id: number) => void
  /** 置底：移到列表最后 */
  moveBottom: (id: number) => void
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  list: readFavorites(),

  toggle(web) {
    const existed = get().list.some((it) => it.id === web.id)
    const list = existed
      ? get().list.filter((it) => it.id !== web.id)
      : [
          ...get().list,
          {
            id: web.id,
            name: web.name,
            url: web.url,
            icon: web.icon || '',
            desc: web.desc || '',
            at: Date.now(),
          },
        ]
    set({ list })
    writeFavorites(list)
    return !existed
  },

  remove(id) {
    const list = get().list.filter((it) => it.id !== id)
    set({ list })
    writeFavorites(list)
  },

  moveTop(id) {
    const list = get().list
    const item = list.find((it) => it.id === id)
    if (!item || list[0]?.id === id) return
    const next = [item, ...list.filter((it) => it.id !== id)]
    set({ list: next })
    writeFavorites(next)
  },

  moveBottom(id) {
    const list = get().list
    const item = list.find((it) => it.id === id)
    if (!item || list[list.length - 1]?.id === id) return
    const next = [...list.filter((it) => it.id !== id), item]
    set({ list: next })
    writeFavorites(next)
  },
}))
