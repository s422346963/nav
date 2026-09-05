// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 移植自 navbin/src/types/index.ts，仅保留 Side 主题所需模型。

export type OverType = 'overflow' | 'ellipsis'

/** 置顶主题，Side = 1 */
export enum TopType {
  Side = 1,
}

/** 三级分类节点公共字段 */
export interface BaseNavItem {
  id: number
  title: string
  icon: string
  collapsed?: boolean
  ownVisible?: boolean
}

export interface IWebTag {
  id: number | string
  url: string
}

export interface IWebProps {
  id: number
  name: string
  desc: string
  url: string
  icon: string
  breadcrumb?: string[]
  tags?: IWebTag[]
  img?: string
  rId?: number
  rate?: number // 0-5
  top?: boolean
  topTypes?: number[]
  index?: number | string
  ownVisible?: boolean
  ok?: boolean
  [key: string]: any
}

export interface INavThreeProp extends BaseNavItem {
  nav: IWebProps[]
  rId?: number
  [key: string]: any
}

export interface INavTwoProp extends BaseNavItem {
  nav: INavThreeProp[]
  rId?: number
  [key: string]: any
}

export interface INavProps extends BaseNavItem {
  nav: INavTwoProp[]
  [key: string]: any
}

export interface ImageProps {
  url: string
  src: string
}

export interface ISearchItemProps {
  name: string
  icon: string
  url?: string
  placeholder?: string
  blocked: boolean
  isInner: boolean
}

export interface ISearchProps {
  logo: string
  darkLogo: string
  height: number
  list: ISearchItemProps[]
}

export interface ISettings {
  favicon: string
  title: string
  showGithub: boolean
  showCopy?: boolean
  showThemeToggle: boolean
  createWebKey: string
  /** 侧边栏品牌 logo，留空回退 favicon */
  sideLogo: string
  gitHubCDN: string
  /** 数据仓库地址（GitHub URL），后台可改，优先于 localStorage 配置 */
  gitRepoUrl: string
  /** 图床仓库地址（GitHub URL），留空则使用数据仓库 _upload/ 目录 */
  imageRepoUrl: string
  /** 数据仓库分支 */
  branch: string
  /** 图床仓库分支，留空回退 branch */
  imageBranch: string
  /** 网站信息抓取 API 服务地址 */
  apiUrl: string

  sideTitle: string
  sideCollapsed: boolean
  sideThemeImages: ImageProps[]
  sideThemeHeight: number
  sideThemeAutoplay: boolean

  [key: string]: any
}

/** 搜索类型（对齐原 SearchType） */
export enum SearchType {
  All = 1,
  Title = 2,
  Desc = 3,
  Url = 4,
  Current = 5,
  Quick = 6,
  Id = 7,
  Tag = 8,
  Class = 9,
}
