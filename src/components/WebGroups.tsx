// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 三级分组列表（对应原 side 模板 content 区：toolbar-title + 卡片网格 + 折叠）。

import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { useNavStore } from '@/store/useNavStore'
import { useModalStore } from '@/store/useModalStore'
import { cn } from '@/lib/utils'
import type { ICardType, INavThreeProp } from '@/types/nav'
import Card from './Card'

export default function WebGroups({
  groups,
  cardStyle,
  keyword,
}: {
  groups: INavThreeProp[]
  cardStyle: ICardType
  keyword?: string
}) {
  const updateClass = useNavStore((s) => s.updateClass)
  const isLogin = useNavStore((s) => s.isLogin)
  const openEditWeb = useModalStore((s) => s.openEditWeb)
  const navigate = useNavigate()

  if (groups.length === 0) return <NoData />

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => {
        const collapsed = !!group.collapsed
        return (
          <div key={group.id} id={`group-${group.id}`} className="scroll-mt-16">
            <div className="mb-2 flex items-center">
              <button
                className="flex flex-1 cursor-pointer items-center gap-1.5 text-left"
                onClick={() => updateClass(group.id, { collapsed: !collapsed })}
              >
                {collapsed ? (
                  <ChevronRight size={14} className="text-zinc-400" />
                ) : (
                  <ChevronDown size={14} className="text-zinc-400" />
                )}
                {group.icon ? (
                  <img src={group.icon} className="h-4 w-4" alt="" loading="lazy" />
                ) : null}
                <span className="text-sm font-semibold">{group.title}</span>
                <span className="text-xs text-sky-500">x {group.nav.length}</span>
              </button>
              {/* 分组标题右侧「+」快速添加网站（仅登录后可用） */}
              {isLogin && (
                <button
                  className="cursor-pointer rounded p-1 text-zinc-400 hover:text-primary"
                  title="添加网站"
                  onClick={() => openEditWeb(undefined, group.id)}
                >
                  <Plus size={15} />
                </button>
              )}
            </div>

            {!collapsed && (
              <div
                className={cn(
                  cardStyle === 'icon'
                    ? 'flex flex-wrap gap-x-5 gap-y-3'
                    : 'grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
                )}
              >
                {group.nav.map((web) => (
                  <Card
                    key={web.id}
                    web={web}
                    cardStyle={cardStyle}
                    keyword={keyword}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function NoData() {
  const navigate = useNavigate()
  return (
    <div className="py-20 text-center text-sm text-zinc-400">
      暂无数据
      <button
        className="ml-2 cursor-pointer text-primary hover:underline"
        onClick={() => navigate('/system')}
      >
        去后台添加
      </button>
    </div>
  )
}
