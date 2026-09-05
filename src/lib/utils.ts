// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 通用工具：跳转前缀、复制、模糊搜索、样式合并。移植自 navbin/src/utils。

import { SearchType } from '@/types/nav'
import type { IWebProps } from '@/types/nav'

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

/** desc 首字符 '!' 表示原始 HTML */
export const CODE_SYMBOL = '!'
export const SELF_SYMBOL = '^'
export const ROUTER_SYMBOL = '@'

export function isCodeDesc(desc = ''): boolean {
  return desc[0] === CODE_SYMBOL
}

/** 过滤掉搜索高亮标签取纯文字 */
export function getTextContent(value = ''): string {
  if (!value) return ''
  return value.replace(/<b>|<\/b>/g, '')
}

/**
 * 统一跳转（对齐原 JumpService.goUrl）：
 * - '@apply'  → 打开网站提交弹窗（由调用方处理，返回 'apply'）
 * - '@xxx'    → 站内路由
 * - '^xxx'    → 本窗口打开
 * - 其他      → 新窗口打开
 */
export function goUrl(
  url: string | null | undefined,
  navigate?: (path: string) => void,
): void {
  if (typeof url !== 'string' || !url) return
  const first = url[0]
  if (first === CODE_SYMBOL) return
  if (url === '@apply') return
  if (first === ROUTER_SYMBOL) {
    navigate?.(url.slice(1))
    return
  }
  if (first === SELF_SYMBOL) {
    window.open(url.slice(1), '_self')
    return
  }
  window.open(url)
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 降级方案
    try {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      return true
    } catch {
      return false
    }
  }
}

/** 同级排序权重，缺省 100000 */
export const DEFAULT_SORT_INDEX = 100000

export function sortByIndex(a: any, b: any): number {
  const ia = isNumber(a.index) ? Number(a.index) : DEFAULT_SORT_INDEX
  const ib = isNumber(b.index) ? Number(b.index) : DEFAULT_SORT_INDEX
  return ia - ib
}

export function isNumber(v: any): boolean {
  if (v === '' || v == null) return false
  return !isNaN(v)
}

export function removeTrailingSlashes(url: string | null | undefined): string {
  if (!url) return ''
  return url.replace(/\/+$/, '')
}

/**
 * 站内模糊搜索（对齐原 fuzzySearch）。
 * 返回扁平网站列表，不做高亮标记（高亮由组件按 keyword 计算）。
 * - Current 类型：由调用方传入当前分类子树作为 navList
 * - Class 类型：仅命中分类名，收录该分类下所有网站
 */
export function fuzzySearch(
  navList: any[],
  keyword: string,
  type: SearchType = SearchType.All,
): IWebProps[] {
  if (!keyword.trim()) return []
  keyword = keyword.toLowerCase()

  const result: IWebProps[] = []
  const seen = new Set<number>()
  const add = (web: IWebProps) => {
    if (!seen.has(web.id)) {
      seen.add(web.id)
      result.push(web)
    }
  }

  function matchWeb(web: IWebProps): boolean {
    if (isCodeDesc(web.desc)) return false
    const name = getTextContent(web.name).toLowerCase()
    const desc = getTextContent(web.desc).toLowerCase()
    const url = (web.url || '').toLowerCase()
    switch (type) {
      case SearchType.Title:
        return name.includes(keyword)
      case SearchType.Desc:
        return desc.includes(keyword)
      case SearchType.Url:
        return url.includes(keyword)
      case SearchType.Id:
        return String(web.id) === keyword
      case SearchType.Quick:
        return !!web.top && name.includes(keyword)
      default:
        return name.includes(keyword) || desc.includes(keyword) || url.includes(keyword)
    }
  }

  function f(arr: any[]): void {
    for (const item of arr) {
      if (Array.isArray(item.nav)) {
        // 分类节点：分类名（或 id）命中且包含网站时，收录其下所有网站
        if (item.title && item.nav[0]?.name) {
          const hit =
            item.title.toLowerCase().includes(keyword) || String(item.id) === keyword
          if (hit) {
            for (const web of item.nav as IWebProps[]) add(web)
            if (type === SearchType.Class) continue
          }
        }
        f(item.nav)
      } else if (item.name && type !== SearchType.Class) {
        if (matchWeb(item)) add(item)
      }
    }
  }

  f(navList)
  return result
}

/** 默认搜索引擎记忆 */
export function getDefaultEngine<T>(list: T[]): T | undefined {
  try {
    const engine = window.localStorage.getItem('engine')
    if (engine) {
      const local = JSON.parse(engine)
      return list.find((item: any) => item.name === local.name)
    }
  } catch {
    /* ignore */
  }
  return list[0]
}

export function setDefaultEngine(engine: unknown) {
  window.localStorage.setItem('engine', JSON.stringify(engine))
}
