// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 全局数据 store：JSON 初始化 + localStorage 缓存 + 缓存失效 + CRUD。
// 对齐原 navbin：getNavs/setNavs（web.ts）、datetime 缓存失效、filterLoginData。

import { create } from 'zustand'
import type {
  INavProps,
  ISettings,
  ISearchProps,
  IWebProps,
} from '@/types/nav'
import { dfsNavs, filterLoginData, cleanWebAttrs, getClassById } from '@/lib/dfs'
import {
  normalizeNavs,
  normalizeSettings,
  normalizeSearch,
  DEFAULT_SORT_INDEX,
} from '@/lib/normalize'
import { parseRepoUrl } from '@/lib/github'
import { sortByIndex } from '@/lib/utils'
import { toast } from './toast'

const DB_KEY = 'WEBSITE_DB'
const DATE_TIME_KEY = 's_url'
const TOKEN_KEY = 'token'
const SETTINGS_KEY = 'SETTINGS_DB'

export const STORAGE_KEY_MAP = {
  TOKEN: TOKEN_KEY,
  DATE_TIME: DATE_TIME_KEY,
  WEBSITE: DB_KEY,
  SETTINGS: SETTINGS_KEY,
}

export interface GithubConfig {
  owner: string
  repo: string
  branch: string
}

function getGithubConfig(): GithubConfig {
  try {
    const raw = localStorage.getItem('GITHUB_CONFIG')
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return { owner: '', repo: '', branch: 'main' }
}

function saveGithubConfig(cfg: GithubConfig) {
  localStorage.setItem('GITHUB_CONFIG', JSON.stringify(cfg))
}

interface NavState {
  navs: INavProps[]
  settings: ISettings
  search: ISearchProps
  loaded: boolean
  token: string
  isLogin: boolean
  githubConfig: GithubConfig
  saveGithubConfig: (cfg: GithubConfig) => void

  init: () => Promise<void>
  login: (token: string) => Promise<boolean>
  logout: () => void

  /** 前台权限（对齐原 getPermissions） */
  permissions: () => { create: boolean; edit: boolean; del: boolean; ok: boolean }

  updateWeb: (oldId: number, newData: Partial<IWebProps>) => void
  updateClass: (oldId: number, newData: Record<string, any>) => void
  pushData: (parentId: number, data: any) => void
  pushRootData: (data: any) => void
  /** 整体替换导航树（书签导入等场景） */
  replaceNavs: (navsData: INavProps[]) => void
  deleteByIds: (ids: number[], isDelRid?: boolean) => boolean
  moveNodes: (ids: number[], targetId: number) => boolean
  nextId: () => number

  setSettings: (patch: Partial<ISettings>) => void
}

function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

async function fetchJson(path: string): Promise<any> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${path}`)
  if (!res.ok) throw new Error(`加载 ${path} 失败: ${res.status}`)
  return res.json()
}

/** 持久化导航树到 localStorage（回写前清洗运行时字段） */
function persistNavs(navsData: INavProps[]) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(cleanWebAttrs(navsData)))
  } catch (e) {
    console.error('持久化失败', e)
  }
}

function persistSettings(settings: ISettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error(e)
  }
}

export const useNavStore = create<NavState>((set, get) => ({
  navs: [],
  settings: normalizeSettings(),
  search: normalizeSearch({}, {}),
  loaded: false,
  token: getToken(),
  isLogin: !!getToken(),
  githubConfig: getGithubConfig(),
  saveGithubConfig(cfg) {
    saveGithubConfig(cfg)
    set({ githubConfig: cfg })
  },

  async init() {
    // 1. 拉取基础数据
    const [rawNavs, rawSettings, rawSearch] = await Promise.all([
      fetchJson('db.json'),
      fetchJson('settings.json'),
      fetchJson('search.json'),
    ])

    // 2. 规范化
    const settings = normalizeSettings(rawSettings)
    const search = normalizeSearch(rawSearch, settings)
    let navsData = normalizeNavs(rawNavs, settings)

    // 3. 缓存失效：构建版本变化时清除本地编辑缓存（对齐原 getNavs 逻辑）
    const token = getToken()
    const isLogin = !!token
    const storageDate = localStorage.getItem(DATE_TIME_KEY)
    if (storageDate !== __BUILD_DATETIME__) {
      localStorage.setItem(DATE_TIME_KEY, __BUILD_DATETIME__)
      if (isLogin && localStorage.getItem(DB_KEY)) {
        localStorage.removeItem(DB_KEY)
        setTimeout(() => {
          toast.success(`检测到网站更新，本地缓存已刷新（${__BUILD_DATETIME__}）`)
        }, 800)
      }
    }

    // 4. 本地编辑缓存优先（仅登录用户）
    let navs = navsData
    if (isLogin) {
      try {
        const cached = localStorage.getItem(DB_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) {
            navs = parsed
          }
        }
      } catch {
        /* ignore */
      }
      navs = normalizeNavs(navs, settings)
    }
    const rawSettingsDb = localStorage.getItem(SETTINGS_KEY)
    let finalSettings = settings
    if (isLogin && rawSettingsDb) {
      try {
        finalSettings = normalizeSettings(JSON.parse(rawSettingsDb))
      } catch {
        /* ignore */
      }
    }

    // 5. 未登录过滤 ownVisible，并补 breadcrumb/tags
    const display = filterLoginData(navs, isLogin)

    // 6. 仓库配置：settings.json 里的 gitRepoUrl/branch 优先于 localStorage 手动配置
    const ghConfig = (() => {
      const repo = parseRepoUrl(finalSettings.gitRepoUrl)
      if (repo) {
        return {
          owner: repo.owner,
          repo: repo.repo,
          branch: finalSettings.branch || 'main',
        }
      }
      return getGithubConfig()
    })()

    set({
      navs: display,
      settings: finalSettings,
      search,
      loaded: true,
      token,
      isLogin,
      githubConfig: ghConfig,
    })
    document.title = finalSettings.title
  },

  async login(accessToken) {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${accessToken.trim()}` },
      })
      if (!res.ok) {
        toast.error('Token 校验失败，请检查 Token 是否有效')
        return false
      }
      localStorage.setItem(TOKEN_KEY, accessToken.trim())
      // 先标记登录成功，让 Login 页能立刻 navigate；ownVisible 数据在后台异步补齐，
      // 不要在这里把 loaded 置 false——那会卸载 HashRouter，导致跳转失效。
      set({ token: accessToken.trim(), isLogin: true })
      void get()
        .init()
        .catch((e) => console.error(e))
      return true
    } catch (e: any) {
      toast.error(`Token 校验失败：${e.message}`)
      return false
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(DB_KEY)
    localStorage.removeItem(SETTINGS_KEY)
  },

  permissions() {
    // 访客完全只读，登录用户拥有全部写权限
    const ok = get().isLogin
    return { create: ok, edit: ok, del: ok, ok }
  },

  updateWeb(oldId, newData) {
    const keys = Object.keys(newData)
    const navsData = dfsNavs({
      navs: get().navs,
      webCallback(item) {
        if (item.id === oldId) {
          for (const k of keys) {
            item[k] = (newData as any)[k]
          }
          return true
        }
        return false
      },
    })
    set({ navs: navsData })
    persistNavs(navsData)
  },

  updateClass(oldId, newData) {
    const keys = Object.keys(newData)
    const navsData = dfsNavs({
      navs: get().navs,
      callback(item) {
        if (item.id === oldId) {
          for (const k of keys) {
            item[k] = newData[k]
          }
          return true
        }
        return false
      },
    })
    set({ navs: navsData })
    persistNavs(navsData)
  },

  pushData(parentId, data) {
    const navsData = dfsNavs({
      navs: get().navs,
      callback(item) {
        if (item.id === parentId) {
          item.nav.unshift(data)
          item.nav.sort(sortByIndex)
          return true
        }
        return false
      },
    })
    set({ navs: navsData })
    persistNavs(navsData)
  },

  pushRootData(data) {
    const navsData = [...get().navs, data]
    navsData.sort(sortByIndex)
    set({ navs: navsData })
    persistNavs(navsData)
  },

  replaceNavs(navsData) {
    set({ navs: navsData })
    persistNavs(navsData)
  },

  deleteByIds(ids, isDelRid = false) {
    let hasDelete = false
    const navsData = dfsNavs({
      navs: get().navs,
      filter(w) {
        if (ids.includes(isDelRid ? (w.rId as number) : w.id)) {
          hasDelete = true
          return false
        }
        return true
      },
    })
    if (hasDelete) {
      set({ navs: navsData })
      persistNavs(navsData)
    }
    return hasDelete
  },

  moveNodes(ids, targetId) {
    const removed: any[] = []
    const navsData: any[] = JSON.parse(JSON.stringify(get().navs))

    // 递归摘除节点（网站或分类）
    function remove(arr: any[], parent: any): void {
      for (let i = arr.length - 1; i >= 0; i--) {
        const item = arr[i]
        if (ids.includes(item.id)) {
          removed.push(...arr.splice(i, 1))
          continue
        }
        if (Array.isArray(item.nav)) remove(item.nav, item)
      }
      void parent
    }
    remove(navsData, null)

    // 找目标分类，插入头部并重排。
    // 注意：dfsNavs 内部会深拷贝并返回新树，必须使用其返回值
    let ok = false
    const updated = dfsNavs({
      navs: navsData,
      callback(item) {
        if (item.id === targetId) {
          for (const node of removed) {
            delete node.collapsed
            item.nav.unshift(node)
          }
          item.nav.sort(sortByIndex)
          ok = true
          return true
        }
        return false
      },
    })

    if (ok) {
      set({ navs: updated })
      persistNavs(updated)
    } else {
      toast.error('未找到目标分类')
    }
    return ok
  },

  nextId() {
    let maxId = 0
    dfsNavs({
      navs: get().navs,
      callback(item) {
        if (item.id > maxId) maxId = item.id
        if (item.rId && item.rId > maxId) maxId = item.rId
      },
      webCallback(web) {
        if (web.id > maxId) maxId = web.id
        if (web.rId && web.rId > maxId) maxId = web.rId
      },
    })
    return maxId + 1
  },

  setSettings(patch) {
    const next = { ...get().settings, ...patch }
    set({ settings: next })
    if (get().isLogin) {
      persistSettings(next)
    }
    document.title = next.title
  },
}))

export { getClassById, DEFAULT_SORT_INDEX }
