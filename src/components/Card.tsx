// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 网站卡片（对应原 card 组件）：图标/名称/描述/评分/标签 + 复制/编辑/删除/移动。

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Pencil, Trash2, FolderInput, Star, Lock } from 'lucide-react'
import { useNavStore, getPermissions } from '@/store/useNavStore'
import { useModalStore } from '@/store/useModalStore'
import { cn, copyText, goUrl, isCodeDesc, getTextContent } from '@/lib/utils'
import type { ICardType, IWebProps } from '@/types/nav'
import { ConfirmModal, WebIcon } from './ui'
import { toast } from '@/store/toast'

/** 关键词高亮（纯文本分段，无 HTML 注入） */
export function Highlight({
  text,
  keyword,
}: {
  text: string
  keyword?: string
}) {
  const plain = getTextContent(text)
  if (!keyword || !plain) return <>{plain}</>
  const lower = plain.toLowerCase()
  const kw = keyword.toLowerCase()
  const parts: React.ReactNode[] = []
  let i = 0
  let idx: number
  while ((idx = lower.indexOf(kw, i)) !== -1) {
    if (idx > i) parts.push(plain.slice(i, idx))
    parts.push(
      <b key={idx} className="text-primary">
        {plain.slice(idx, idx + kw.length)}
      </b>,
    )
    i = idx + kw.length
  }
  if (i < plain.length) parts.push(plain.slice(i))
  return <>{parts}</>
}

function TagPills({ web }: { web: IWebProps }) {
  const tagList = useNavStore((s) => s.tagList)
  if (!web.tags?.length) return null
  return (
    <div className="flex flex-wrap gap-1">
      {web.tags.map((t) => {
        const tag = tagList.find((x) => x.id === t.id)
        if (!tag) return null
        return (
          <span
            key={String(t.id)}
            className="rounded px-1.5 py-0.5 text-[10px] leading-none"
            style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
          >
            {tag.name}
          </span>
        )
      })}
    </div>
  )
}

export default function Card({
  web,
  cardStyle = 'example',
  keyword,
}: {
  web: IWebProps
  cardStyle?: ICardType
  keyword?: string
}) {
  const settings = useNavStore((s) => s.settings)
  const isLogin = useNavStore((s) => s.isLogin)
  const userActions = useNavStore((s) => s.settings.userActions)
  const permissions = useMemo(() => getPermissions(userActions), [userActions])
  const openEditWeb = useModalStore((s) => s.openEditWeb)
  const openMove = useModalStore((s) => s.openMove)
  const deleteByIds = useNavStore((s) => s.deleteByIds)
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isIcon = cardStyle === 'icon'
  const isCode = isCodeDesc(web.desc)
  const showActions = isLogin && permissions.ok

  const handleDelete = () => {
    // rId 镜像级联删除
    const ids = web.rId ? [web.id, web.rId] : [web.id]
    deleteByIds(ids)
  }

  const stop = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }

  return (
    <div
      className={cn(
        'nav-card group',
        isIcon ? 'flex items-center gap-2 px-3 py-2' : 'flex items-center gap-3 px-3.5 py-3',
      )}
      onClick={(e) => {
        e.stopPropagation()
        if (web.url === '@apply') {
          if (!isLogin) {
            toast.info('登录后即可提交网站收录')
            return
          }
          if (!permissions.create) {
            toast.warning('当前设置未开放收录权限')
            return
          }
          openEditWeb(undefined, undefined)
          return
        }
        goUrl(web.url, navigate)
      }}
      title={getTextContent(web.desc) || web.name}
    >
      <WebIcon
        src={web.icon}
        name={web.name}
        size={isIcon ? 24 : 36}
      />

      <div className={cn('min-w-0 flex-1', isIcon && 'flex items-center gap-2')}>
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">
            <Highlight text={web.name} keyword={keyword} />
          </span>
          {web.ownVisible && isLogin && <Lock size={11} className="shrink-0 text-amber-500" />}
        </div>

        {!isIcon && web.desc && (
          isCode ? (
            <div
              className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400"
              onClick={(e) => stop(e)}
              dangerouslySetInnerHTML={{ __html: web.desc.slice(1) }}
            />
          ) : (
            <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              <Highlight text={web.desc} keyword={keyword} />
            </div>
          )
        )}
        {!isIcon && <TagPills web={web} />}
      </div>

      {settings.showRate && !isIcon && (
        <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
          <Star size={11} className={cn((web.rate ?? 5) >= 4 ? 'fill-amber-400 text-amber-400' : 'fill-zinc-300 text-zinc-300 dark:fill-zinc-600')} />
          <span className="text-[10px] text-zinc-400">{web.rate ?? 5}</span>
        </div>
      )}

      {/* hover 操作区 */}
      <div className="absolute inset-y-0 right-2 hidden items-center gap-1 rounded-lg bg-white/95 px-1.5 group-hover:flex dark:bg-zinc-800/95">
        <button
          className="cursor-pointer rounded p-1 text-zinc-400 hover:text-primary"
          title="复制链接"
          onClick={async (e) => {
            stop(e)
            const ok = await copyText(web.url)
            ok ? void 0 : window.alert('复制失败')
          }}
        >
          <Copy size={13} />
        </button>
        {isLogin && permissions.edit && (
          <>
            <button
              className="cursor-pointer rounded p-1 text-zinc-400 hover:text-primary"
              title="编辑"
              onClick={(e) => {
                stop(e)
                openEditWeb(web)
              }}
            >
              <Pencil size={13} />
            </button>
            <button
              className="cursor-pointer rounded p-1 text-zinc-400 hover:text-primary"
              title="移动"
              onClick={(e) => {
                stop(e)
                openMove([web.id])
              }}
            >
              <FolderInput size={13} />
            </button>
          </>
        )}
        {isLogin && permissions.del && (
          <button
            className="cursor-pointer rounded p-1 text-zinc-400 hover:text-red-500"
            title="删除"
            onClick={(e) => {
              stop(e)
              setConfirmOpen(true)
            }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="删除网站"
        content={`确定删除「${web.name}」吗？${web.rId ? '（关联镜像将一并删除）' : ''}`}
        onConfirm={handleDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  )
}
