// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 移植自 navbin/src/types/index.ts，仅保留 Side 主题所需模型。

export type ICardType =
  | 'standard'
  | 'column'
  | 'example'
  | 'retro'
  | 'original'
  | 'poster'
  | 'icon'

export type OverType = 'overflow' | 'ellipsis'

/** 前台权限动作 */
export enum ActionType {
  Create = 1,
  Edit = 2,
  Delete = 3,
}

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

export interface ITagPropValues {
  id: number
  name: string
  color: string
  desc: string
  isInner: boolean
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
  language: string
  title: string
  description: string
  keywords: string
  theme: string
  footerContent: string
  headerContent: string
  showGithub: boolean
  showRate: boolean
  showCopy?: boolean
  showThemeToggle: boolean
  openSearch: boolean
  createWebKey: string
  logo: string
  darkLogo: string
  userActions: ActionType[]
  gitHubCDN: string

  sideTitle: string
  sideDocTitle: string
  sideCardStyle: ICardType
  sideFooterHTML: string
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
