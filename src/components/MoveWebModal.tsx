// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 移动节点弹窗（对应原 move-web）：网站/分类移动到其他分类。

import { useEffect, useMemo, useState } from 'react'
import { useNavStore } from '@/store/useNavStore'
import { useModalStore } from '@/store/useModalStore'
import { flattenClasses } from '@/lib/tree'
import { Button, Field, Modal, Select } from './ui'
import { toast } from '@/store/toast'
import { cn } from '@/lib/utils'

export default function MoveWebModal() {
  const moveIds = useModalStore((s) => s.moveIds)
  const closeAll = useModalStore((s) => s.closeAll)
  const navs = useNavStore((s) => s.navs)
  const moveNodes = useNavStore((s) => s.moveNodes)
  const [targetId, setTargetId] = useState<number | undefined>()

  const classes = useMemo(() => flattenClasses(navs), [navs])

  // 被移动节点及其子树不允许作为目标（避免移动到自身内部）
  const invalidIds = useMemo(() => {
    const ids = new Set<number>()
    if (!moveIds) return ids
    const walk = (list: any[]) => {
      for (const item of list) {
        if (moveIds.includes(item.id)) {
          const collect = (n: any) => {
            ids.add(n.id)
            ;(n.nav || []).forEach((c: any) => collect(c))
          }
          collect(item)
        } else if (Array.isArray(item.nav)) {
          walk(item.nav)
        }
      }
    }
    walk(navs)
    return ids
  }, [moveIds, navs])

  useEffect(() => {
    if (moveIds) setTargetId(undefined)
  }, [moveIds])

  return (
    <Modal
      open={!!moveIds}
      title={`移动（选中 ${moveIds?.length ?? 0} 项）`}
      onClose={closeAll}
      width="max-w-md"
      footer={
        <>
          <Button onClick={closeAll}>取消</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!targetId) {
                toast.error('请选择目标分类')
                return
              }
              const ok = moveNodes(moveIds!, targetId)
              if (ok) {
                toast.success('移动成功')
                closeAll()
              }
            }}
          >
            移动
          </Button>
        </>
      }
    >
      <Field label="目标分类">
        <div className="relative">
          {/* 选中后用浮层展示完整路径（下拉列表内仍是树状缩进） */}
          {targetId != null && (
            <span className="pointer-events-none absolute inset-y-0 left-3 right-8 z-10 flex items-center overflow-hidden bg-white text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
              {classes.find((c) => c.id === targetId)?.path}
            </span>
          )}
          <Select
            value={targetId != null ? String(targetId) : ''}
            onChange={(e) => setTargetId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">请选择</option>
            {classes.map((c) => (
              <option
                key={c.id}
                value={c.id}
                disabled={invalidIds.has(c.id)}
                className={cn(invalidIds.has(c.id) && 'text-zinc-300 dark:text-zinc-600')}
              >
                {'\u00A0\u00A0\u00A0\u00A0'.repeat(c.level - 1)}
                {c.level > 1 ? '└ ' : ''}
                {c.title}
              </option>
            ))}
          </Select>
        </div>
      </Field>
    </Modal>
  )
}
