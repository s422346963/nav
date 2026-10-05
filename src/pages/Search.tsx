// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 搜索结果页（`#/search?q=xxx`，可带 `&id=` 保留来源分类、`&type=` 指定搜索范围）。

import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useNavStore } from '@/store/useNavStore'
import { useCurrentClass } from '@/lib/currentClass'
import { fuzzySearch } from '@/lib/utils'
import { SearchType } from '@/types/nav'
import type { IWebProps } from '@/types/nav'
import AppLayout from '@/components/AppLayout'
import Card from '@/components/Card'

export default function Search() {
  const [params] = useSearchParams()
  const navs = useNavStore((s) => s.navs)
  const { currentOne, currentTwo, inCategory } = useCurrentClass()

  const q = params.get('q') || ''
  const sType = (Number(params.get('type')) || SearchType.All) as SearchType

  const results = useMemo(() => {
    if (!q) return []
    // 「当前」：仅在当前二级分类内搜索
    if (sType === SearchType.Current) {
      return fuzzySearch(currentTwo?.nav || [], q, SearchType.All)
    }
    return fuzzySearch(navs, q, sType)
  }, [q, sType, navs, currentTwo])

  return (
    <AppLayout
      currentOneId={inCategory ? currentOne?.id : undefined}
      currentTwoId={inCategory ? currentTwo?.id : undefined}
      homeActive={!inCategory}
      defaultParentId={currentTwo?.nav?.[0]?.id}
    >
      {q ? (
        <SearchResults results={results} keyword={q} />
      ) : (
        <div className="py-16 text-center text-sm text-zinc-400">
          输入关键词后按回车开始搜索
        </div>
      )}
    </AppLayout>
  )
}

function SearchResults({
  results,
  keyword,
}: {
  results: IWebProps[]
  keyword: string
}) {
  if (results.length === 0) {
    return <div className="py-16 text-center text-sm text-zinc-400">未找到「{keyword}」相关网站</div>
  }
  return (
    <div>
      <div className="mb-2 text-xs text-zinc-400">
        共 {results.length} 条与「{keyword}」相关的结果
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {results.map((web) => (
          <Card key={web.id} web={web} keyword={keyword} />
        ))}
      </div>
    </div>
  )
}
