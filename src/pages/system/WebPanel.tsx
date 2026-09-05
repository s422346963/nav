// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 网站管理面板（对齐原 navbin system/web）：
// 顶部操作栏（保存/撤销/下载备份/导入备份）+ 标签页表格
// （管理一级/二级/三级分类、管理网站）。
// 行支持鼠标拖拽排序，上移/下移由拖拽替代，全屏宽度卡片式布局。

import { useMemo, useRef, useState } from 'react'
import { ChevronDown, GripVertical, Pencil, X } from 'lucide-react'
import { useNavStore, STORAGE_KEY_MAP } from '@/store/useNavStore'
import { useModalStore } from '@/store/useModalStore'
import { uploadDb } from '@/lib/github'
import { cleanWebAttrs } from '@/lib/dfs'
import { Button, ConfirmModal } from '@/components/ui'
import { toast } from '@/store/toast'
import EditWebModal from '@/components/EditWebModal'
import EditClassModal from '@/components/EditClassModal'
import MoveWebModal from '@/components/MoveWebModal'
import { cn } from '@/lib/utils'
import type { IWebProps } from '@/types/nav'

type ClassRow = any
type TabKey = 'one' | 'two' | 'three' | 'web'

export default function WebPanel() {
  const navs = useNavStore((s) => s.navs)
  const token = useNavStore((s) => s.token)
  const githubConfig = useNavStore((s) => s.githubConfig)
  const replaceNavs = useNavStore((s) => s.replaceNavs)
  const deleteByIds = useNavStore((s) => s.deleteByIds)
  const updateWeb = useNavStore((s) => s.updateWeb)
  const openEditWeb = useModalStore((s) => s.openEditWeb)
  const openEditClass = useModalStore((s) => s.openEditClass)

  const [tab, setTab] = useState<TabKey>('one')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirm, setConfirm] = useState<{ title: string; content: string; onOk: () => void } | null>(
    null,
  )

  // 级联选择器
  const [oneId, setOneId] = useState<number | undefined>()
  const [twoId, setTwoId] = useState<number | undefined>()
  const [threeId, setThreeId] = useState<number | undefined>()

  const one = navs.find((n) => n.id === oneId)
  const two = one?.nav?.find((n) => n.id === twoId)
  const three = two?.nav?.find((n) => n.id === threeId)

  const totalWebs = useMemo(() => countAll(navs), [navs])

  /** 检索异常网站：仅检测当前选中三级分类下的网站，每批 5 个并发 */
  const [checking, setChecking] = useState(false)
  const [checkProgress, setCheckProgress] = useState({ done: 0, total: 0 })
  const checkAbnormal = async () => {
    const list = three?.nav || []
    if (!list.length) {
      toast.error('请先选择三级分类')
      return
    }
    setChecking(true)
    setCheckProgress({ done: 0, total: list.length })
    let bad = 0
    const BATCH_SIZE = 5
    for (let i = 0; i < list.length; i += BATCH_SIZE) {
      const batch = list.slice(i, i + BATCH_SIZE)
      await Promise.all(
        batch.map(async (web) => {
          const raw = (web.url || '').replace(/^[^\w]+/, '') // 去掉 ^ @ 前缀
          let ok = true
          try {
            new URL(raw)
          } catch {
            ok = false // URL 非法直接判异常
          }
          if (ok) {
            ok = await probeReachable(raw)
          }
          updateWeb(web.id, { ok })
          if (!ok) bad++
          setCheckProgress((p) => ({ ...p, done: p.done + 1 }))
        }),
      )
    }
    setChecking(false)
    if (bad > 0) {
      toast.warning(`检测完成：${list.length} 个网站中 ${bad} 个链接失效，状态列已标红`)
    } else {
      toast.success(`检测完成：共 ${list.length} 个网站，全部正常`)
    }
  }

  /** 拖拽排序：把 dragId 所在节点移动到 overId 的位置（同一父列表内） */
  const reorderNode = (dragId: number, overId: number) => {
    if (dragId === overId) return
    const clone: ClassRow[] = JSON.parse(JSON.stringify(navs))
    let moved = false
    const move = (list: ClassRow[]): boolean => {
      const from = list.findIndex((it) => it.id === dragId)
      const to = list.findIndex((it) => it.id === overId)
      if (from >= 0 && to >= 0) {
        const [item] = list.splice(from, 1)
        list.splice(to, 0, item)
        moved = true
        return true
      }
      return list.some((it) => Array.isArray(it.nav) && move(it.nav))
    }
    if (move(clone)) {
      replaceNavs(clone)
    }
  }

  /** 置顶/置底：把节点移到所在列表的头/尾 */
  const moveNodeTo = (id: number, edge: 'top' | 'bottom') => {
    const clone: ClassRow[] = JSON.parse(JSON.stringify(navs))
    let moved = false
    const move = (list: ClassRow[]): boolean => {
      const from = list.findIndex((it) => it.id === id)
      if (from >= 0) {
        const [item] = list.splice(from, 1)
        edge === 'top' ? list.unshift(item) : list.push(item)
        moved = true
        return true
      }
      return list.some((it) => Array.isArray(it.nav) && move(it.nav))
    }
    if (move(clone)) {
      replaceNavs(clone)
    }
  }

  // 上传同步：确认后把 db.json 同步到 GitHub 仓库
  const doSave = async () => {
    if (!token) {
      toast.error('请先登录')
      return
    }
    setUploading(true)
    const result = await uploadDb({
      config: githubConfig,
      token,
      navs: cleanWebAttrs(navs),
      message: 'update db',
    })
    setUploading(false)
    result.ok ? toast.success(result.message) : toast.error(result.message)
  }

  const confirmSync = () =>
    setConfirm({
      title: '同步数据到远端',
      content: '确定将所有数据同步到远端吗？（每次保存需要等待构建完成再进行下一次操作）',
      onOk: doSave,
    })

  // 撤销：丢弃本地编辑缓存，恢复为上次同步数据
  const undoAll = () =>
    setConfirm({
      title: '撤销本次所有操作',
      content: '将丢弃本地所有未同步的修改，恢复为上次同步的数据，确定继续吗？',
      onOk: async () => {
        localStorage.removeItem(STORAGE_KEY_MAP.WEBSITE)
        await useNavStore.getState().init()
        toast.success('已撤销本地修改')
      },
    })

  // 下载备份
  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify(navs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nav-backup-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导入备份
  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (!Array.isArray(data)) {
        toast.error('文件格式不正确（需要分类数组）')
      } else {
        replaceNavs(data)
        toast.success('导入成功')
      }
    } catch {
      toast.error('文件解析失败')
    }
    e.target.value = ''
  }

  return (
    <div>
      {/* 顶部操作栏：左侧动作组 + 右侧异常提示 */}
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" disabled={uploading} onClick={confirmSync}>
            {uploading ? '同步中...' : '上传同步'}
          </Button>
          <Button onClick={undoAll}>撤销本次所有操作</Button>
          <Button onClick={downloadBackup}>下载备份</Button>
          <Button onClick={() => fileRef.current?.click()}>导入备份</Button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={onImport} />
        </div>
      </div>

      {/* 标签页 */}
      <div className="mt-5 flex gap-1 border-b border-zinc-200 dark:border-zinc-700/70">
        {(
          [
            ['one', '管理一级分类'],
            ['two', '管理二级分类'],
            ['three', '管理三级分类'],
            ['web', '管理网站'],
          ] as [TabKey, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            className={cn(
              '-mb-px cursor-pointer border-b-2 px-4 py-2.5 text-sm transition-colors',
              tab === key
                ? 'border-primary font-medium text-primary'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200',
            )}
            onClick={() => setTab(key)}
          >
            {label}
            {key === 'web' && (
              <span
                className={cn(
                  'ml-1.5 inline-block rounded-full border px-1.5 py-px text-[11px] font-medium leading-4',
                  tab === key
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700/70 dark:bg-zinc-800/60 dark:text-zinc-400',
                )}
              >
                {totalWebs}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'one' && (
          <ClassTable
            key={`one-${oneId ?? 'root'}`}
            rows={navs}
            onReorder={reorderNode}
            onMoveEdge={moveNodeTo}
            onEdit={(cls) => openEditClass({ cls, level: 1 })}
            onAdd={() => openEditClass({ cls: null, level: 1 })}
            deleteByIds={deleteByIds}
            setConfirm={setConfirm}
          />
        )}
        {tab === 'two' && (
          <div>
            <Picker
              placeholder="请选择一级分类"
              options={navs}
              value={oneId}
              onChange={(id) => {
                setOneId(id)
                setTwoId(undefined)
                setThreeId(undefined)
              }}
            />
            <div className="mt-4">
              <ClassTable
                key={`two-${oneId}`}
                rows={one?.nav || []}
                onReorder={reorderNode}
                onMoveEdge={moveNodeTo}
                onEdit={(cls) => openEditClass({ cls, level: 2 })}
                onAdd={() => openEditClass({ cls: null, level: 2, parentId: oneId })}
                addDisabled={!oneId}
                deleteByIds={deleteByIds}
                setConfirm={setConfirm}
              />
            </div>
          </div>
        )}
        {tab === 'three' && (
          <div>
            <div className="flex flex-wrap gap-2.5">
              <Picker
                placeholder="请选择一级分类"
                options={navs}
                value={oneId}
                onChange={(id) => {
                  setOneId(id)
                  setTwoId(undefined)
                  setThreeId(undefined)
                }}
              />
              <Picker
                placeholder="请选择二级分类"
                options={one?.nav || []}
                value={twoId}
                onChange={(id) => {
                  setTwoId(id)
                  setThreeId(undefined)
                }}
              />
            </div>
            <div className="mt-4">
              <ClassTable
                key={`three-${twoId}`}
                rows={two?.nav || []}
                onReorder={reorderNode}
                onMoveEdge={moveNodeTo}
                onEdit={(cls) => openEditClass({ cls, level: 3 })}
                onAdd={() => openEditClass({ cls: null, level: 3, parentId: twoId })}
                addDisabled={!twoId}
                deleteByIds={deleteByIds}
                setConfirm={setConfirm}
              />
            </div>
          </div>
        )}
        {tab === 'web' && (
          <div>
            <div className="flex flex-wrap gap-2.5">
              <Picker
                placeholder="请选择一级分类"
                options={navs}
                value={oneId}
                onChange={(id) => {
                  setOneId(id)
                  setTwoId(undefined)
                  setThreeId(undefined)
                }}
              />
              <Picker
                placeholder="请选择二级分类"
                options={one?.nav || []}
                value={twoId}
                onChange={(id) => {
                  setTwoId(id)
                  setThreeId(undefined)
                }}
              />
              <Picker
                placeholder="请选择三级分类"
                options={two?.nav || []}
                value={threeId}
                onChange={setThreeId}
              />
              <Button
                variant="primary"
                disabled={!threeId}
                onClick={() => openEditWeb(undefined, threeId)}
              >
                添加网站
              </Button>
            </div>
            <div className="mt-4">
              <WebTable
                key={`web-${threeId}`}
                rows={three?.nav || []}
                onReorder={reorderNode}
                onMoveEdge={moveNodeTo}
                onEdit={(web) => openEditWeb(web)}
                deleteByIds={deleteByIds}
                setConfirm={setConfirm}
                headerExtra={
                  <Button
                    variant="danger"
                    disabled={checking || !threeId}
                    onClick={checkAbnormal}
                  >
                    {checking
                      ? `检测中(${checkProgress.done}/${checkProgress.total})`
                      : '检索异常网站'}
                  </Button>
                }
              />
            </div>
          </div>
        )}
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

/* ============ 通用部件 ============ */

function Picker({
  placeholder,
  options,
  value,
  onChange,
}: {
  placeholder: string
  options: ClassRow[]
  value: number | undefined
  onChange: (id: number | undefined) => void
}) {
  return (
    <div className="relative w-full md:w-[200px]">
      {/* 未选择时的占位浮层：遮住浏览器渲染的第一项文字 */}
      {value == null && (
        <span className="pointer-events-none absolute inset-y-0 left-3 right-8 z-10 flex items-center overflow-hidden bg-white text-sm text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
          {placeholder}
        </span>
      )}
      <select
        className={cn(
          'h-9 w-full cursor-pointer appearance-none rounded-lg border bg-white pl-3 text-sm shadow-[0_1px_2px_rgb(0_0_0/0.03)] outline-none transition-colors dark:bg-zinc-800',
          'focus:border-primary focus:ring-2 focus:ring-primary/15',
          value != null ? 'pr-[52px]' : 'pr-8',
          value == null
            ? 'border-zinc-200 text-zinc-400 hover:border-zinc-300 dark:border-zinc-700/70 dark:text-zinc-500 dark:hover:border-zinc-600'
            : 'border-zinc-200 text-zinc-800 hover:border-primary dark:border-zinc-700/70 dark:text-zinc-100 dark:hover:border-primary',
        )}
        value={value != null ? String(value) : ''}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onChange(e.target.value ? Number(e.target.value) : undefined)
        }
      >
        {/* 隐藏占位项：保证未选择时 value="" 有匹配项，否则点击第一项不触发 change */}
        <option value="" hidden>
          {placeholder}
        </option>
        {options.map((o) => (
          <option
            key={o.id}
            value={o.id}
            className="bg-white font-normal text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {o.title}
          </option>
        ))}
      </select>

      {/* 清空按钮：已选择时显示，位于下箭头左侧 */}
      {value != null && (
        <button
          type="button"
          className="absolute right-7 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200/70 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
          title="清空选择"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onChange(undefined)
          }}
        >
          <X size={12} />
        </button>
      )}

      <ChevronDown
        size={14}
        className={cn(
          'pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors',
          value == null ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400',
        )}
      />
    </div>
  )
}

function CommonIcon({ name, icon }: { name: string; icon?: string }) {
  if (icon) {
    return <img src={icon} className="h-9 w-9 rounded object-contain" alt="" />
  }
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-gradient-to-br from-white to-zinc-300 text-sm font-medium text-zinc-700 dark:from-zinc-700 dark:to-zinc-900 dark:text-zinc-200"
      style={{ borderRadius: 4 }}
    >
      {name.slice(0, 1)}
    </div>
  )
}

function VisibleCell({ ownVisible, onToggle }: { ownVisible?: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex cursor-pointer items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        ownVisible
          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20'
          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200/70 dark:bg-zinc-700/50 dark:text-zinc-400 dark:hover:bg-zinc-700',
      )}
      title="仅自己可见（点击切换）"
      onClick={onToggle}
    >
      {ownVisible ? '是' : '否'}
    </button>
  )
}

function StatusPill({ ok }: { ok?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        ok === false
          ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
          : 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-500',
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', ok === false ? 'bg-red-500' : 'bg-green-500')}
      />
      {ok === false ? '异常' : '正常'}
    </span>
  )
}

/** 行拖拽句柄 + 事件（HTML5 Drag & Drop） */
function useRowDrag(onReorder: (dragId: number, overId: number) => void) {
  const [dragId, setDragId] = useState<number | null>(null)
  const [overId, setOverId] = useState<number | null>(null)

  const dragProps = (id: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      setDragId(id)
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(id))
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (dragId != null && dragId !== id) setOverId(id)
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      if (dragId != null && dragId !== id) onReorder(dragId, id)
      setDragId(null)
      setOverId(null)
    },
    onDragEnd: () => {
      setDragId(null)
      setOverId(null)
    },
  })

  const rowCls = (id: number) =>
    cn(
      'border-b border-zinc-100 transition-colors last:border-b-0 dark:border-zinc-700/50',
      dragId === id && 'opacity-40',
      overId === id && dragId !== id && 'bg-primary/5 shadow-[inset_0_2px_0_0_var(--color-primary)]',
      dragId == null && 'hover:bg-zinc-100 dark:hover:bg-zinc-700/40',
    )

  return { dragProps, rowCls, dragging: dragId != null }
}

function DragHandle() {
  return (
    <a
      className="inline-flex shrink-0 cursor-pointer items-center rounded p-1 text-zinc-500 transition-colors hover:bg-primary/10 hover:text-primary active:cursor-grabbing active:text-primary dark:text-zinc-400 dark:hover:bg-primary/20 dark:hover:text-primary"
      title="拖动调整顺序"
      onClick={(e) => e.preventDefault()}
    >
      <GripVertical size={14} />
    </a>
  )
}

/* ============ 分类表格（一/二/三级共用） ============ */

function ClassTable({
  rows,
  onReorder,
  onMoveEdge,
  onEdit,
  onAdd,
  addDisabled,
  deleteByIds,
  setConfirm,
}: {
  rows: ClassRow[]
  onReorder: (dragId: number, overId: number) => void
  onMoveEdge: (id: number, edge: 'top' | 'bottom') => void
  onEdit: (cls: ClassRow) => void
  onAdd: () => void
  addDisabled?: boolean
  deleteByIds: (ids: number[]) => boolean
  setConfirm: (c: { title: string; content: string; onOk: () => void } | null) => void
}) {
  const updateClass = useNavStore((s) => s.updateClass)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const { dragProps, rowCls } = useRowDrag(onReorder)

  const toggleAll = () => {
    setSelected((s) => (s.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))))
  }
  const toggleOne = (id: number) =>
    setSelected((s) => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const batchDelete = () =>
    setConfirm({
      title: '批量删除',
      content: `确定删除选中的 ${selected.size} 项吗？分类下的子内容将一并删除。`,
      onOk: () => {
        deleteByIds([...selected])
        setSelected(new Set())
      },
    })

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        <Button variant="primary" disabled={addDisabled} onClick={onAdd}>
          添加分类
        </Button>
        <Button variant="danger" disabled={selected.size === 0} onClick={batchDelete}>
          批量删除{selected.size > 0 ? ` (${selected.size})` : ''}
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.03)] dark:border-zinc-700/70 dark:bg-zinc-800/40">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80 text-left text-xs text-zinc-500 dark:border-zinc-700/70 dark:bg-zinc-800/60 dark:text-zinc-400">
              <th className="w-28 px-4 py-3 font-medium">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={rows.length > 0 && selected.size === rows.length}
                    onChange={toggleAll}
                  />
                  ({selected.size})
                </label>
              </th>
              <th className="w-64 px-4 py-3 font-medium">操作</th>
              <th className="w-24 px-4 py-3 font-medium">图标</th>
              <th className="min-w-[220px] px-4 py-3 font-medium">标签名称</th>
              <th className="w-28 px-4 py-3 text-center font-medium">自己可见</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-sm text-zinc-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn('group', rowCls(row.id))}
                  {...dragProps(row.id)}
                >
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={selected.has(row.id)}
                      onChange={() => toggleOne(row.id)}
                    />
                  </td>
                  <td className="px-4 py-3.5 select-none">
                    <div className="flex items-center gap-2.5">
                      <DragHandle />
                      <a
                        className={cn(
                          'cursor-pointer text-sm text-primary hover:underline',
                          i === 0 && 'pointer-events-none invisible',
                        )}
                        onClick={() => onMoveEdge(row.id, 'top')}
                      >
                        置顶
                      </a>
                      <a
                        className={cn(
                          'cursor-pointer text-sm text-primary hover:underline',
                          i === rows.length - 1 && 'pointer-events-none invisible',
                        )}
                        onClick={() => onMoveEdge(row.id, 'bottom')}
                      >
                        置底
                      </a>
                      <a
                        className="inline-flex cursor-pointer items-center gap-1 text-sm text-primary hover:underline"
                        onClick={() => onEdit(row)}
                      >
                        <Pencil size={13} /> 编辑
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <CommonIcon name={row.title || ''} icon={row.icon} />
                  </td>
                  <td className="px-4 py-3.5 text-[15px] font-medium">{row.title}</td>
                  <td className="px-4 py-3.5 text-center">
                    <VisibleCell
                      ownVisible={row.ownVisible}
                      onToggle={() => updateClass(row.id, { ownVisible: !row.ownVisible })}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2.5 flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
        <GripVertical size={12} /> 提示：按住行首拖动可调整顺序
      </p>
    </div>
  )
}

/* ============ 网站表格 ============ */

function WebTable({
  rows,
  onReorder,
  onMoveEdge,
  onEdit,
  deleteByIds,
  setConfirm,
  headerExtra,
}: {
  rows: IWebProps[]
  onReorder: (dragId: number, overId: number) => void
  onMoveEdge: (id: number, edge: 'top' | 'bottom') => void
  onEdit: (web: IWebProps) => void
  deleteByIds: (ids: number[]) => boolean
  setConfirm: (c: { title: string; content: string; onOk: () => void } | null) => void
  headerExtra?: React.ReactNode
}) {
  const updateWeb = useNavStore((s) => s.updateWeb)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const { dragProps, rowCls } = useRowDrag(onReorder)

  const toggleAll = () => {
    setSelected((s) => (s.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))))
  }
  const toggleOne = (id: number) =>
    setSelected((s) => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const batchDelete = () =>
    setConfirm({
      title: '批量删除',
      content: `确定删除选中的 ${selected.size} 个网站吗？`,
      onOk: () => {
        deleteByIds([...selected])
        setSelected(new Set())
      },
    })

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {headerExtra}
        <Button variant="danger" disabled={selected.size === 0} onClick={batchDelete}>
          批量删除{selected.size > 0 ? ` (${selected.size})` : ''}
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.03)] dark:border-zinc-700/70 dark:bg-zinc-800/40">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80 text-left text-xs text-zinc-500 dark:border-zinc-700/70 dark:bg-zinc-800/60 dark:text-zinc-400">
              <th className="w-24 px-4 py-3 font-medium">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={rows.length > 0 && selected.size === rows.length}
                    onChange={toggleAll}
                  />
                  ({selected.size})
                </label>
              </th>
              <th className="w-64 px-4 py-3 font-medium">操作</th>
              <th className="w-24 px-4 py-3 font-medium">状态</th>
              <th className="w-24 px-4 py-3 font-medium">图标</th>
              <th className="min-w-[160px] px-4 py-3 font-medium">网站名称</th>
              <th className="w-24 px-4 py-3 text-center font-medium">自己可见</th>
              <th className="min-w-[300px] px-4 py-3 font-medium">网站描述</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-zinc-400">
                  暂无数据，请先选择三级分类
                </td>
              </tr>
            ) : (
              rows.map((web, i) => (
                <tr
                  key={web.id}
                  className={cn('group', rowCls(web.id))}
                  {...dragProps(web.id)}
                >
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={selected.has(web.id)}
                      onChange={() => toggleOne(web.id)}
                    />
                  </td>
                  <td className="px-4 py-3.5 select-none">
                    <div className="flex items-center gap-2.5">
                      <DragHandle />
                      <a
                        className={cn(
                          'cursor-pointer text-sm text-primary hover:underline',
                          i === 0 && 'pointer-events-none invisible',
                        )}
                        onClick={() => onMoveEdge(web.id, 'top')}
                      >
                        置顶
                      </a>
                      <a
                        className={cn(
                          'cursor-pointer text-sm text-primary hover:underline',
                          i === rows.length - 1 && 'pointer-events-none invisible',
                        )}
                        onClick={() => onMoveEdge(web.id, 'bottom')}
                      >
                        置底
                      </a>
                      <a
                        className="inline-flex cursor-pointer items-center gap-1 text-sm text-primary hover:underline"
                        onClick={() => onEdit(web)}
                      >
                        <Pencil size={13} /> 编辑
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusPill ok={web.ok} />
                  </td>
                  <td className="px-4 py-3.5">
                    <CommonIcon name={web.name || ''} icon={web.icon} />
                  </td>
                  <td className="px-4 py-3.5 text-[15px] font-medium">
                    {web.url ? (
                      <a
                        href={web.url.replace(/^[^\w]+/, '')}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                        title={web.url}
                      >
                        {web.name}
                      </a>
                    ) : (
                      web.name
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <VisibleCell
                      ownVisible={web.ownVisible}
                      onToggle={() => updateWeb(web.id, { ownVisible: !web.ownVisible })}
                    />
                  </td>
                  <td
                    className="max-w-[320px] truncate px-4 py-3.5 text-zinc-500 dark:text-zinc-400"
                    title={web.desc}
                  >
                    {web.desc || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2.5 flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
        <GripVertical size={12} /> 提示：按住行首拖动可调整顺序
      </p>
    </div>
  )
}

/* ============ 工具 ============ */

/**
 * 站点可达性探测（多级候选）：
 * 1. no-cors fetch（Chromium 下 HTML 响应会被 ORB 拦截，多数网站会抛错）
 * 2. <img> 加载 /favicon.ico（img 不受 CORS 限制）
 * 3. <img> 加载 /apple-touch-icon.png
 * 4. Google favicon 服务兜底（站点被 Google 收录过即有图标）
 */
function probeImage(src: string, timeout: number): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    const timer = setTimeout(() => {
      img.src = ''
      resolve(false)
    }, timeout)
    img.onload = () => {
      clearTimeout(timer)
      resolve(true)
    }
    img.onerror = () => {
      clearTimeout(timer)
      resolve(false)
    }
    img.src = src
  })
}

async function probeReachable(raw: string, timeout = 8000): Promise<boolean> {
  let host = ''
  let origin = ''
  try {
    const u = new URL(raw)
    host = u.host
    origin = u.origin
  } catch {
    return false
  }

  // 第 1 层：no-cors fetch
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    await fetch(raw, { mode: 'no-cors', signal: controller.signal })
    clearTimeout(timer)
    return true
  } catch {
    /* 进入图片探测 */
  }

  // 第 2~4 层：多候选图片探测
  const candidates = [
    `${origin}/favicon.ico?_=${Date.now()}`,
    `${origin}/apple-touch-icon.png?_=${Date.now()}`,
    `https://www.google.com/s2/favicons?domain=${host}&sz=32`,
  ]
  for (const src of candidates) {
    if (await probeImage(src, timeout)) return true
  }
  return false
}

function countAll(list: any): number {
  if (!Array.isArray(list)) return 0
  return list.reduce((acc, item) => acc + (item.url ? 1 : countAll(item.nav)), 0)
}
