// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 移植自 navbin/src/utils/pureUtils.ts：通用遍历器 + 登录过滤 + 回写清洗。

import type { INavProps, IWebProps } from '@/types/nav'

type DFSProps = {
  navs: any[]
  breadcrumb?: boolean
  sort?: (a: any, b: any) => number
  filter?: (data: any) => boolean
  /** 分类节点回调（item.title 存在），返回 true 中断 */
  callback?: (data: INavProps) => boolean | void
  /** 网站节点回调（item.url 存在），返回 true 中断 */
  webCallback?: (data: IWebProps, props: { breadcrumb?: string[] }) => boolean | void
}

/**
 * 深拷贝遍历三级树：filter 过滤、sort 排序、callback/webCallback 处理分类与网站节点。
 * 始终返回克隆后的新树（非破坏）。
 */
export function dfsNavs(props: DFSProps): any[] {
  let cloneNavs = JSON.parse(JSON.stringify(props.navs)) as any[]
  if (props.filter) {
    cloneNavs = cloneNavs.filter(props.filter)
  }
  const breadcrumbMap = new Map<any, string[]>()
  if (props.breadcrumb) {
    cloneNavs.forEach((item) => {
      breadcrumbMap.set(item, [item.title])
    })
  }
  let stack = [...cloneNavs]
  while (stack.length > 0) {
    const item = stack.pop()
    if (!item) continue
    if (item.nav && Array.isArray(item.nav)) {
      if (props.filter) {
        item.nav = item.nav.filter(props.filter)
      }
      if (props.sort) {
        item.nav.sort(props.sort)
      }
      if (props.breadcrumb) {
        item.nav.forEach((navItem: any) => {
          const currentBreadcrumb = breadcrumbMap.get(item) || []
          const newBreadcrumb = [...currentBreadcrumb]
          if (navItem.title) {
            newBreadcrumb.push(navItem.title)
          }
          breadcrumbMap.set(navItem, newBreadcrumb)
        })
      }
      stack.push(...item.nav)
    }
    if (item.title) {
      const isBreak = props.callback?.(item)
      if (isBreak) break
    } else if (item.url) {
      const breadcrumb = breadcrumbMap.get(item)
      const isBreak = props.webCallback?.(item, { breadcrumb })
      if (isBreak) break
    }
  }
  return cloneNavs
}

/** 未登录时过滤 ownVisible 节点，并为网站补 breadcrumb/tags */
export function filterLoginData(navs: any[], isLogin: boolean): INavProps[] {
  function filterOwn(item: INavProps) {
    if (item.ownVisible && !isLogin) {
      return false
    }
    return true
  }
  return dfsNavs({
    navs,
    breadcrumb: true,
    filter: filterOwn,
    webCallback(web: IWebProps, props) {
      web.tags ||= []
      web.breadcrumb = props.breadcrumb
    },
  }) as INavProps[]
}

/** 回写前清洗：删除运行时字段，避免污染 db.json */
export function cleanWebAttrs(navs: any): any[] {
  return dfsNavs({
    navs,
    webCallback(web: IWebProps) {
      const removeKeys = ['breadcrumb', '__name__', '__desc__']
      for (const k in web) {
        if (removeKeys.includes(k)) {
          delete web[k]
        }
      }
      if (web.tags?.length === 0) {
        delete web.tags
      }
    },
  })
}

/** 按分类 id 查找下标与面包屑（对齐原 getClassById） */
export function getClassById(
  navsData: any[],
  id: unknown,
): { parentId: number; oneIndex: number; twoIndex: number; threeIndex: number; breadcrumb: string[] } {
  id = Number(id)
  let oneIndex = 0
  let twoIndex = 0
  let threeIndex = 0
  let parentId = -1
  const breadcrumb: string[] = []

  outerLoop: for (let i = 0; i < navsData.length; i++) {
    const item = navsData[i]
    if (item.id === id) {
      oneIndex = i
      breadcrumb.push(item.title)
      break
    }
    if (!Array.isArray(item.nav)) continue
    for (let j = 0; j < item.nav.length; j++) {
      const twoItem = item.nav[j]
      if (twoItem.id === id) {
        parentId = item.id
        oneIndex = i
        twoIndex = j
        breadcrumb.push(item.title, twoItem.title)
        break outerLoop
      }
      if (!Array.isArray(twoItem.nav)) continue
      for (let k = 0; k < twoItem.nav.length; k++) {
        const threeItem = twoItem.nav[k]
        if (threeItem.id === id) {
          parentId = twoItem.id
          oneIndex = i
          twoIndex = j
          threeIndex = k
          breadcrumb.push(item.title, twoItem.title, threeItem.title)
          break outerLoop
        }
      }
    }
  }
  return { parentId, oneIndex, twoIndex, threeIndex, breadcrumb }
}

/** 按 id 在三级树中查找节点（深搜），未找到返回 undefined */
export function findNodeById(navs: any[], id: number): any | undefined {
  for (const item of navs) {
    if (item.id === id) return item
    if (Array.isArray(item.nav)) {
      const found = findNodeById(item.nav, id)
      if (found) return found
    }
  }
  return undefined
}

/** 当前选中二级分类下的三级分组列表（对齐原 matchCurrentList） */
export function matchCurrentList(navsData: any[], id: unknown, isLogin: boolean): any[] {
  const { oneIndex, twoIndex } = getClassById(navsData, id)
  let data: any[] = []
  try {
    if (
      navsData[oneIndex] &&
      navsData[oneIndex]?.nav?.length > 0 &&
      (isLogin || !navsData[oneIndex].nav[twoIndex].ownVisible)
    ) {
      data = navsData[oneIndex].nav[twoIndex].nav
    }
  } catch {
    data = []
  }
  return data
}
