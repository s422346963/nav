// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 当前分类解析（首页 / 搜索 / 分类三个页面共用）：
// URL ?id= → localStorage 记忆 → 第一个分类；仅在显式 ?id= 时更新记忆。

import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useNavStore } from '@/store/useNavStore'
import { getClassById } from '@/lib/dfs'

export function useCurrentClass() {
  const [params] = useSearchParams()
  const navs = useNavStore((s) => s.navs)

  const id = useMemo(() => {
    const paramId = params.get('id')
    if (paramId && getClassById(navs, paramId).breadcrumb.length) {
      return Number(paramId)
    }
    try {
      const loc = localStorage.getItem('location')
      if (loc) {
        const localId = JSON.parse(loc)?.id
        if (localId && getClassById(navs, localId).breadcrumb.length) return localId
      }
    } catch {
      /* ignore */
    }
    return navs[0]?.nav?.[0]?.id ?? navs[0]?.id
  }, [params, navs])

  // 仅记忆显式选中的分类（URL 带 ?id=），避免首页浏览 / 搜索时覆盖上次选择
  useEffect(() => {
    if (params.get('id') && id != null) {
      localStorage.setItem('location', JSON.stringify({ id }))
    }
  }, [id, params])

  const { oneIndex, twoIndex } = getClassById(navs, id)

  return {
    /** 解析后的分类 id（可能是兜底的记忆值 / 第一个分类） */
    id,
    /** URL 是否显式带 ?id=：侧栏高亮与「当前」搜索范围都以它为准 */
    inCategory: !!params.get('id'),
    currentOne: navs[oneIndex],
    currentTwo: navs[oneIndex]?.nav?.[twoIndex],
  }
}
