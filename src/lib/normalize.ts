// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 移植自 navbin/src/utils/dataNormalizer.ts：运行时数据规范化（纯函数）。

import { dfsNavs } from './dfs'
import type { INavProps, ISettings, IWebProps, ISearchProps } from '@/types/nav'

export const DEFAULT_SORT_INDEX = 100000

let maxId = 0

function getMaxWebId(navs: any[]): void {
  dfsNavs({
    navs,
    callback(item: INavProps) {
      if (item.id > maxId) maxId = item.id
      if (item.rId && item.rId > maxId) maxId = item.rId
    },
    webCallback(web: IWebProps) {
      if (web.id > maxId) maxId = web.id
      if (web.rId && web.rId > maxId) maxId = web.rId
    },
  })
}

function incrementId(id: number | string): number {
  id = Number.parseInt(id as string)
  if (!id || id < 0) {
    return ++maxId
  }
  return id
}

export function replaceJsdelivrCDN(url = '', settings?: Partial<ISettings>): string {
  const cdn = settings?.gitHubCDN
  if (!cdn || !url) return url
  url = url.replace('cdn.jsdelivr.net', cdn)
  url = url.replace('testingcf.jsdelivr.net', cdn)
  url = url.replace('img.jsdmirror.com', cdn)
  url = url.replace('gcore.jsdelivr.net', cdn)
  return url
}

/** 规范化导航树：补齐 id/rId、CDN 替换、默认值。不删除用户自定义字段。 */
export function normalizeNavs(
  navs: INavProps[],
  settings: Partial<ISettings>,
): INavProps[] {
  if (!Array.isArray(navs)) return []

  maxId = 0
  getMaxWebId(navs)

  function handleAdapter(item: any): void {
    item.id = incrementId(item.id)
    if (item.rId < 0) {
      item.rId = incrementId(item.rId)
    }
    item.icon = replaceJsdelivrCDN(item.icon, settings)
    item.nav ||= []
  }

  return dfsNavs({
    navs,
    callback(item: INavProps) {
      handleAdapter(item)
    },
    webCallback(webItem: IWebProps) {
      webItem.id = incrementId(webItem.id)
      if (webItem.rId) {
        webItem.rId = incrementId(webItem.rId)
      }
      webItem.tags ||= []
      webItem.rate ??= 5
      webItem.top ??= false
      webItem.ownVisible ??= false
      webItem.url ||= ''
      webItem.name ||= ''
      webItem.desc ||= ''
      webItem.icon ||= ''
      webItem.icon = replaceJsdelivrCDN(webItem.icon, settings)
      if (webItem.img) {
        webItem.img = replaceJsdelivrCDN(webItem.img, settings)
      }
    },
  }) as INavProps[]
}

/** settings 规范化：白名单式补齐默认值，丢弃历史遗留的无效字段 */
export function normalizeSettings(s: Partial<ISettings> = {}): ISettings {
  return {
    favicon: s.favicon || '',
    title: s.title || '路标导航',
    showGithub: s.showGithub ?? false,
    showThemeToggle: s.showThemeToggle ?? false,
    createWebKey: s.createWebKey || 'E',
    sideLogo: s.sideLogo || '',
    gitHubCDN: s.gitHubCDN || 'gcore.jsdelivr.net',
    gitRepoUrl: s.gitRepoUrl || '',
    imageRepoUrl: s.imageRepoUrl || '',
    branch: s.branch || 'main',
    imageBranch: s.imageBranch || 'main',
    apiUrl: s.apiUrl || 'https://api-qiangbin.vercel.app',
    sideTitle: s.sideTitle || '',
    sideCollapsed: s.sideCollapsed ?? false,
    sideThemeImages: (s.sideThemeImages || []).map((item: any) => ({
      ...item,
      src: replaceJsdelivrCDN(item.src, s),
    })),
    sideThemeHeight: s.sideThemeHeight ?? 0,
    sideThemeAutoplay: s.sideThemeAutoplay ?? true,
  }
}

/** 补齐三个内置标签 -1/-2/-3 */
/** search.json 默认值补齐 */
export function normalizeSearch(search: any, settings: Partial<ISettings>): ISearchProps {
  let s: any = JSON.parse(JSON.stringify(search || {}))
  if (Array.isArray(s)) {
    s = { list: s }
  }
  if (!s.list || !s.list.length) {
    s.list = [
      {
        name: '站内',
        icon: settings.favicon || '',
        placeholder: '站内搜索',
        blocked: false,
        isInner: true,
      },
      {
        name: 'Baidu',
        url: 'https://www.baidu.com/s?wd=',
        icon: 'https://www.baidu.com/favicon.ico',
        blocked: false,
        isInner: false,
      },
      {
        name: 'Google',
        url: 'https://www.google.com/search?q=',
        icon: 'https://www.google.com/favicon.ico',
        blocked: false,
        isInner: false,
      },
    ]
  }
  // 站内搜索引擎的图标强制跟随 settings.favicon，与侧边栏品牌 logo 保持一致
  s.list = s.list.map((item: any) =>
    item.isInner ? { ...item, icon: settings.favicon || item.icon } : item,
  )
  s.logo ||= ''
  s.darkLogo ||= ''
  s.height ||= 80
  return s as ISearchProps
}
