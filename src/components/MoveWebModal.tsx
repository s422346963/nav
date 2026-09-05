// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 移动节点弹窗（对应原 move-web）：网站/分类移动到其他分类。

import { useEffect, useMemo, useState } from 'react'
import { useNavStore } from '@/store/useNavStore'
import { useModalStore } from '@/store/useModalStore'
import { flattenClasses } from '@/lib/tree'
import { Button, Field, Modal, Select } from './ui'
import { toast } from '@/store/toast'

export default function MoveWebModal() {
  const moveIds = useModalStore((s) => s.moveIds)
  const closeAll = useModalStore((s) => s.closeAll)
  const navs = useNavStore((s) => s.navs)
  const moveNodes = useNavStore((s) => s.moveNodes)
  const [targetId, setTargetId] = useState<number | undefined>()

  const classes = useMemo(() => flattenClasses(navs), [navs])

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
        <Select value={targetId} onChange={(e) => setTargetId(Number(e.target.value))}>
          <option value="">请选择</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              [{['一级', '二级', '三级'][c.level - 1]}] {c.path}
            </option>
          ))}
        </Select>
      </Field>
    </Modal>
  )
}
