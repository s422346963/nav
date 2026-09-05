// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 树结构辅助：拍平分类列表（供下拉选择父级/移动目标）。

import type { INavProps } from '@/types/nav'

export interface FlatClass {
  id: number
  title: string
  level: 1 | 2 | 3
  path: string
  webCount: number
}

export function flattenClasses(navs: INavProps[]): FlatClass[] {
  const result: FlatClass[] = []
  for (const one of navs) {
    result.push({
      id: one.id,
      title: one.title,
      level: 1,
      path: one.title,
      webCount: countWebs(one.nav),
    })
    for (const two of one.nav || []) {
      result.push({
        id: two.id,
        title: two.title,
        level: 2,
        path: `${one.title} / ${two.title}`,
        webCount: countWebs(two.nav),
      })
      for (const three of two.nav || []) {
        result.push({
          id: three.id,
          title: three.title,
          level: 3,
          path: `${one.title} / ${two.title} / ${three.title}`,
          webCount: (three.nav || []).length,
        })
      }
    }
  }
  return result
}

function countWebs(list: any): number {
  if (!Array.isArray(list)) return 0
  let count = 0
  for (const item of list) {
    if (item.url) count += 1
    else count += countWebs(item.nav)
  }
  return count
}
