// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 首页（收藏）内容区：本地收藏列表，未登录可用，操作栏仅「复制链接」「移除收藏」。

import { Copy, Star, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFavoriteStore } from '@/store/useFavoriteStore'
import type { IFavoriteItem } from '@/store/useFavoriteStore'
import { copyText, getTextContent, goUrl } from '@/lib/utils'
import { WebIcon } from './ui'
import { toast } from '@/store/toast'

export default function Favorites() {
  const list = useFavoriteStore((s) => s.list)

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <Star size={30} className="text-zinc-300 dark:text-zinc-600" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">还没有收藏</p>
        <p className="text-xs text-zinc-400">把鼠标移到网站卡片上，点右侧星标即可收藏</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs text-zinc-400">
        <span>我的收藏</span>
        <span>·</span>
        <span>共 {list.length} 个</span>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((item) => (
          <FavoriteCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

function FavoriteCard({ item }: { item: IFavoriteItem }) {
  const remove = useFavoriteStore((s) => s.remove)
  const navigate = useNavigate()

  const stop = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }

  return (
    <div
      className="nav-card group flex items-center gap-3 px-3.5 py-3"
      title={getTextContent(item.desc) || item.name}
      onClick={(e) => {
        e.stopPropagation()
        goUrl(item.url, navigate)
      }}
    >
      <WebIcon src={item.icon} name={item.name} size={36} />

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{item.name}</div>
        {item.desc && (
          <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {getTextContent(item.desc)}
          </div>
        )}
      </div>

      {/* hover 操作区：仅复制链接 / 移除收藏 */}
      <div className="absolute inset-y-0 right-2 hidden items-center gap-1 rounded-lg bg-white/95 px-1.5 group-hover:flex dark:bg-zinc-800/95">
        <button
          className="cursor-pointer rounded p-1 text-zinc-400 hover:text-primary"
          title="复制链接"
          onClick={async (e) => {
            stop(e)
            const ok = await copyText(item.url)
            if (!ok) toast.error('复制失败')
          }}
        >
          <Copy size={13} />
        </button>
        <button
          className="cursor-pointer rounded p-1 text-zinc-400 hover:text-red-500"
          title="移除收藏"
          onClick={(e) => {
            stop(e)
            remove(item.id)
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
