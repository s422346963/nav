// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 书签导入 / 导出（对齐原 src/utils/bookmark.ts：DOMParser 解析 + 增量合并）。

import type { INavProps, INavThreeProp, INavTwoProp, IWebProps } from '@/types/nav'
import { removeTrailingSlashes } from './utils'

let tempId = 0
export function initTempId(maxId: number) {
  tempId = maxId
}

const getTitle = (node: Element): string => (node.textContent || '').trim()
const getUrl = (node: Element): string => (node.getAttribute('href') || '').trim()
const getIcon = (node: Element): string => (node.getAttribute('icon') || '').trim()

function makeWeb(a: Element): IWebProps {
  return {
    name: getTitle(a),
    icon: getIcon(a),
    url: getUrl(a),
    tags: [],
    desc: '',
    rate: 5,
    top: false,
    id: (tempId += 1),
  }
}

/** 收集某层未归入文件夹的散链 */
function findUnclassifiedData(rootDL: Element): IWebProps[] {
  const data: IWebProps[] = []
  Array.from(rootDL.children).forEach((item) => {
    if (item.nodeName === 'DT') {
      const a = item.firstElementChild
      if (a?.nodeName === 'A') {
        data.push(makeWeb(a))
      }
    }
  })
  return data
}

function uniqueTitle(list: { title?: string }[], title: string, index: number): string {
  return list.some((e) => e.title === title) ? title + index : title
}

export function parseBookmark(htmlStr: string, currentNavs: INavProps[]): INavProps[] {
  const data: INavProps[] = []
  const doc = new DOMParser().parseFromString(htmlStr, 'text/html')
  const selector = htmlStr.includes('PERSONAL_TOOLBAR_FOLDER="true"')
    ? 'body dl dl'
    : 'body dl'
  const rootDL = doc.querySelector(selector)

  if (!rootDL) {
    throw new Error('未找到书签节点（dl）')
  }

  function processWebsiteLevel(DL3: Element, parentData: INavThreeProp) {
    Array.from(DL3.children).forEach((wItem) => {
      if (wItem.nodeName === 'DT') {
        const a = wItem.querySelector('a')
        if (a) parentData.nav.push(makeWeb(a))
      }
    })
  }

  function processThreeLevel(DL3: Element, parentNav: INavTwoProp) {
    Array.from(DL3.children).forEach((kItem, index) => {
      if (kItem.nodeName !== 'DT') return
      const titleEl = kItem.querySelector('h3')
      if (!titleEl) return
      const threeLevel: INavThreeProp = {
        id: (tempId += 1),
        title: uniqueTitle(parentNav.nav, getTitle(titleEl), index),
        nav: [],
        icon: '',
      }
      parentNav.nav.push(threeLevel)
      const websiteDL = kItem.querySelector('dl')
      if (websiteDL) processWebsiteLevel(websiteDL, threeLevel)
    })
  }

  function processTwoLevel(DL: Element, parentData: INavProps) {
    Array.from(DL.children).forEach((jItem, index) => {
      if (jItem.nodeName !== 'DT') return
      const titleEl = jItem.querySelector('h3')
      if (!titleEl) return
      const title = uniqueTitle(parentData.nav, getTitle(titleEl), index)
      const twoLevel: INavTwoProp = {
        id: (tempId += 1),
        title,
        icon: getIcon(titleEl),
        nav: [],
      }
      parentData.nav.push(twoLevel)

      const DL3 = jItem.querySelector('dl')
      if (!DL3) return
      const unclassified = findUnclassifiedData(DL3)
      if (unclassified.length > 0) {
        twoLevel.nav.push({
          id: (tempId += 1),
          title,
          icon: '',
          nav: unclassified,
        })
      }
      processThreeLevel(DL3, twoLevel)
    })
  }

  // 一级
  Array.from(rootDL.children).forEach((iItem, index) => {
    if (iItem.nodeName !== 'DT') return
    const titleEl = iItem.querySelector('h3')
    if (!titleEl) return
    const oneLevel: INavProps = {
      id: (tempId += 1),
      title: uniqueTitle(data, getTitle(titleEl), index),
      icon: getIcon(titleEl),
      nav: [],
    }
    data.push(oneLevel)

    const DL = iItem.querySelector('dl')
    if (!DL) return
    const unclassified = findUnclassifiedData(DL)
    if (unclassified.length > 0) {
      oneLevel.nav.push({
        id: (tempId += 1),
        title: oneLevel.title,
        icon: '',
        nav: [
          { id: (tempId += 1), title: oneLevel.title, icon: '', nav: unclassified },
        ],
      })
    }
    processTwoLevel(DL, oneLevel)
  })

  // 根级散链兜底「未分类」
  const unclassified = findUnclassifiedData(rootDL)
  if (unclassified.length > 0) {
    data.push({
      id: (tempId += 1),
      title: '未分类',
      icon: '',
      nav: [
        {
          id: (tempId += 1),
          title: '未分类',
          icon: '',
          nav: [
            { id: (tempId += 1), title: '未分类', icon: '', nav: unclassified },
          ],
        },
      ],
    })
  }

  // 增量合并（不覆盖现有数据）：分类按 title、网站按去尾斜杠 url 比重
  function merge(dataArr: any[], list: any[]) {
    for (const item of dataArr) {
      const title = (item.title || removeTrailingSlashes(item.url)).trim()
      const idx = list.findIndex(
        (e) => (e.title || removeTrailingSlashes(e.url)).trim() === title,
      )
      if (idx !== -1) {
        if (Array.isArray(item.nav)) merge(item.nav, list[idx].nav)
        continue
      }
      const url = removeTrailingSlashes((item.url || '').trim())
      if (item.url) {
        if (list.some((e) => removeTrailingSlashes(e.url).trim() === url)) continue
        list.push(item)
        continue
      }
      if (item.title) {
        if (list.some((e) => (e.title || '').trim() === title)) continue
        list.push(item)
      }
    }
  }
  const merged = JSON.parse(JSON.stringify(currentNavs))
  merge(data, merged)
  return merged
}

/** 导出为 Netscape 书签 HTML */
export function exportBookmark(navs: INavProps[]): string {
  const esc = (s: string) =>
    (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const lines: string[] = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<!-- This is an automatically generated file. -->',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>',
  ]
  function walk(list: any[], indent: string) {
    for (const item of list) {
      if (item.url) {
        lines.push(
          `${indent}<DT><A HREF="${esc(item.url)}" ADD_DATE="${Math.floor(Date.now() / 1000)}">${esc(item.name)}</A>`,
        )
      } else if (item.title) {
        lines.push(`${indent}<DT><H3>${esc(item.title)}</H3>`)
        lines.push(`${indent}<DL><p>`)
        walk(item.nav || [], indent + '    ')
        lines.push(`${indent}</DL><p>`)
      }
    }
  }
  walk(navs, '    ')
  lines.push('</DL><p>')
  return lines.join('\n')
}

export function downloadFile(filename: string, content: string, type = 'text/html') {
  const blob = new Blob([content], { type: `${type};charset=utf-8` })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
