// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 网站管理面板：三级树的可视化增删改（对应原 system/web）。

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2, FolderInput, Lock } from 'lucide-react'
import { useNavStore } from '@/store/useNavStore'
import { useModalStore } from '@/store/useModalStore'
import { Button, ConfirmModal } from '@/components/ui'
import EditWebModal from '@/components/EditWebModal'
import EditClassModal from '@/components/EditClassModal'
import MoveWebModal from '@/components/MoveWebModal'
import { cn, getTextContent } from '@/lib/utils'
import type { INavProps, INavThreeProp, INavTwoProp, IWebProps } from '@/types/nav'

export default function WebPanel() {
  const navs = useNavStore((s) => s.navs)
  const openEditWeb = useModalStore((s) => s.openEditWeb)
  const openEditClass = useModalStore((s) => s.openEditClass)
  const openMove = useModalStore((s) => s.openMove)
  const deleteByIds = useNavStore((s) => s.deleteByIds)
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set(navs.map((n) => n.id)))
  const [confirm, setConfirm] = useState<{
    title: string
    content: string
    onOk: () => void
  } | null>(null)

  const toggle = (id: number) =>
    setExpanded((s) => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const deleteClass = (id: number, title: string) => {
    setConfirm({
      title: '删除分类',
      onOk: () => {
        deleteByIds([id]) // 删除自身
        deleteByIds([id], true) // 级联删除 rId 指向它的镜像
      },
      content: `确定删除分类「${title}」及其下所有内容吗？`,
    })
  }

  const deleteWeb = (web: IWebProps) => {
    setConfirm({
      title: '删除网站',
      onOk: () => {
        deleteByIds(web.rId ? [web.id, web.rId] : [web.id])
      },
      content: `确定删除网站「${web.name}」吗？`,
    })
  }

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <Button
          variant="primary"
          onClick={() => openEditWeb(undefined, undefined)}
        >
          <Plus size={14} /> 新增网站
        </Button>
        <Button onClick={() => openEditClass({ cls: null, level: 1 })}>
          <Plus size={14} /> 新增一级分类
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        {navs.map((one: INavProps) => (
          <ClassNode
            key={one.id}
            node={one}
            level={1}
            expanded={expanded}
            toggle={toggle}
            onEditClass={(cls, level) => openEditClass({ cls, level })}
            onAddChild={(parent, level) => openEditClass({ cls: null, level, parentId: parent.id })}
            onDeleteClass={deleteClass}
            onDeleteWeb={deleteWeb}
            onEditWeb={(web) => openEditWeb(web)}
            onAddWeb={(parentId) => openEditWeb(undefined, parentId)}
            onMove={(ids) => openMove(ids)}
          />
        ))}
      </div>

      {/* 弹窗 */}
      <EditWebModal />
      <EditClassModal />
      <MoveWebModal />
      <ConfirmModal
        open={!!confirm}
        title={confirm?.title || ''}
        content={confirm?.content || ''}
        onConfirm={() => confirm?.onOk()}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}

function Row({
  depth,
  icon,
  title,
  meta,
  actions,
}: {
  depth: number
  icon?: string
  title: React.ReactNode
  meta?: string
  actions: React.ReactNode
}) {
  return (
    <div
      className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
      style={{ marginLeft: depth * 20 }}
    >
      {icon ? <img src={icon} className="h-4 w-4 shrink-0" alt="" /> : null}
      <span className="min-w-0 flex-1 truncate text-sm">{title}</span>
      {meta && <span className="shrink-0 text-xs text-zinc-400">{meta}</span>}
      <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">{actions}</div>
    </div>
  )
}

function IconBtn({
  title,
  onClick,
  danger,
  children,
}: {
  title: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      title={title}
      className={cn(
        'cursor-pointer rounded p-1 text-zinc-400 hover:text-primary',
        danger && 'hover:text-red-500',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function ClassNode({
  node,
  level,
  expanded,
  toggle,
  onEditClass,
  onAddChild,
  onDeleteClass,
  onDeleteWeb,
  onEditWeb,
  onAddWeb,
  onMove,
}: {
  node: INavProps | INavTwoProp | INavThreeProp
  level: 1 | 2 | 3
  expanded: Set<number>
  toggle: (id: number) => void
  onEditClass: (cls: any, level: 1 | 2 | 3) => void
  onAddChild: (parent: any, level: 1 | 2 | 3) => void
  onDeleteClass: (id: number, title: string) => void
  onDeleteWeb: (web: IWebProps) => void
  onEditWeb: (web: IWebProps) => void
  onAddWeb: (parentId: number) => void
  onMove: (ids: number[]) => void
}) {
  const hasChildren = Array.isArray(node.nav) && node.nav.length > 0
  const isOpen = expanded.has(node.id)
  const childLevel = (level + 1) as 1 | 2 | 3

  return (
    <div>
      <div
        className="flex items-center"
        onClick={() => hasChildren && toggle(node.id)}
      >
        <div className="flex-1">
          <Row
            depth={level - 1}
            icon={node.icon}
            title={
              <span className="flex items-center gap-1">
                {hasChildren &&
                  (isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />)}
                {node.title}
                {node.ownVisible && <Lock size={11} className="text-amber-500" />}
              </span>
            }
            meta={`${countAll(node.nav)} 项`}
            actions={
              <>
                {level < 3 && (
                  <IconBtn title="添加子分类" onClick={() => onAddChild(node, childLevel)}>
                    <Plus size={13} />
                  </IconBtn>
                )}
                {level === 3 && (
                  <IconBtn title="添加网站" onClick={() => onAddWeb(node.id)}>
                    <Plus size={13} />
                  </IconBtn>
                )}
                <IconBtn title="编辑分类" onClick={() => onEditClass(node, level)}>
                  <Pencil size={13} />
                </IconBtn>
                <IconBtn title="移动" onClick={() => onMove([node.id])}>
                  <FolderInput size={13} />
                </IconBtn>
                <IconBtn title="删除" danger onClick={() => onDeleteClass(node.id, node.title)}>
                  <Trash2 size={13} />
                </IconBtn>
              </>
            }
          />
        </div>
      </div>

      {isOpen && hasChildren && (
        <div>
          {level === 3
            ? (node as INavThreeProp).nav.map((web: IWebProps) => (
                <Row
                  key={web.id}
                  depth={3}
                  icon={web.icon}
                  title={web.name}
                  meta={getTextContent(web.desc).slice(0, 30)}
                  actions={
                    <>
                      <IconBtn title="编辑" onClick={() => onEditWeb(web)}>
                        <Pencil size={13} />
                      </IconBtn>
                      <IconBtn title="移动" onClick={() => onMove([web.id])}>
                        <FolderInput size={13} />
                      </IconBtn>
                      <IconBtn title="删除" danger onClick={() => onDeleteWeb(web)}>
                        <Trash2 size={13} />
                      </IconBtn>
                    </>
                  }
                />
              ))
            : (node as any).nav.map((child: any) => (
                <ClassNode
                  key={child.id}
                  node={child}
                  level={childLevel}
                  expanded={expanded}
                  toggle={toggle}
                  onEditClass={onEditClass}
                  onAddChild={onAddChild}
                  onDeleteClass={onDeleteClass}
                  onDeleteWeb={onDeleteWeb}
                  onEditWeb={onEditWeb}
                  onAddWeb={onAddWeb}
                  onMove={onMove}
                />
              ))}
        </div>
      )}
    </div>
  )
}

function countAll(list: any): number {
  if (!Array.isArray(list)) return 0
  return list.reduce((acc, item) => acc + (item.url ? 1 : countAll(item.nav)), 0)
}
