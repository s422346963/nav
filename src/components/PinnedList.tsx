// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 置顶网站区（top + topTypes 含 Side），对齐原 web-list 非搜索模式。

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNavStore } from '@/store/useNavStore'
import { TopType } from '@/types/nav'
import type { IWebProps } from '@/types/nav'
import { goUrl } from '@/lib/utils'
import { WebIcon } from './ui'

export default function PinnedList() {
  const navs = useNavStore((s) => s.navs)
  const navigate = useNavigate()

  const pinned = useMemo<IWebProps[]>(() => {
    const list: IWebProps[] = []
    const stack = [...navs]
    while (stack.length) {
      const item: any = stack.pop()
      if (!item) continue
      if (Array.isArray(item.nav)) stack.push(...item.nav)
      if (item.url && item.top) {
        const isMatch = (item.topTypes || []).some((v: number) => v === TopType.Side)
        if (isMatch) list.push(item)
      }
    }
    return list.reverse() // 栈遍历为逆序，还原树序
  }, [navs])

  if (pinned.length === 0) return null

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-3">
      {pinned.map((web) => (
        <div
          key={web.id}
          className="group flex cursor-pointer items-center gap-2"
          title={web.name}
          onClick={(e) => {
            e.stopPropagation()
            goUrl(web.url, navigate)
          }}
        >
          <span className="transition-transform group-hover:scale-110">
            <WebIcon src={web.icon} name={web.name} size={32} />
          </span>
          <span className="max-w-24 truncate text-xs text-zinc-600 dark:text-zinc-300">
            {web.name}
          </span>
        </div>
      ))}
    </div>
  )
}
