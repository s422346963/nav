// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 三级分类横向 tab（对应原 class-tabs，粘性顶栏 + 锚点滚动）。

import { Plus } from 'lucide-react'
import type { INavThreeProp } from '@/types/nav'
import { cn } from '@/lib/utils'

export default function ClassTabs({
  groups,
  isLogin,
  onAdd,
}: {
  groups: INavThreeProp[]
  isLogin?: boolean
  onAdd?: () => void
}) {
  if (groups.length === 0) return null
  return (
    <div className="sticky top-16 z-10 -mx-1 overflow-x-auto bg-zinc-100/90 px-1 py-1.5 backdrop-blur dark:bg-zinc-900/90">
      <div className="flex gap-1.5">
        {groups.map((g) => (
          <button
            key={g.id}
            className={cn(
              'shrink-0 cursor-pointer rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 transition-colors hover:border-primary hover:text-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
            )}
            onClick={() => {
              document
                .getElementById(`group-${g.id}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            {g.title}
          </button>
        ))}
        {isLogin && (
          <button
            type="button"
            title="新增分类"
            className="inline-flex shrink-0 cursor-pointer items-center gap-0.5 rounded-full border border-dashed border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-500 transition-colors hover:border-primary hover:text-primary dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-primary dark:hover:text-primary"
            onClick={onAdd}
          >
            <Plus size={13} /> 
          </button>
        )}
      </div>
    </div>
  )
}
