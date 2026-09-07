// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 新增/编辑分类弹窗（对应原 edit-class）。

import { useEffect, useState } from 'react'
import { useNavStore } from '@/store/useNavStore'
import { useModalStore } from '@/store/useModalStore'
import { flattenClasses } from '@/lib/tree'
import { Button, Field, Input, Modal, Select } from './ui'
import { toast } from '@/store/toast'

export default function EditClassModal() {
  const { editClass, closeAll } = useModalStore()
  const navs = useNavStore((s) => s.navs)
  const pushData = useNavStore((s) => s.pushData)
  const pushRootData = useNavStore((s) => s.pushRootData)
  const updateClass = useNavStore((s) => s.updateClass)
  const nextId = useNavStore((s) => s.nextId)

  const payload = editClass.payload
  const isEdit = !!payload?.cls

  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('')
  const [ownVisible, setOwnVisible] = useState(false)
  const [level, setLevel] = useState<1 | 2 | 3>(1)
  const [parentId, setParentId] = useState<number | undefined>()

  useEffect(() => {
    if (!editClass.open || !payload) return
    setTitle(payload.cls?.title || '')
    setIcon(payload.cls?.icon || '')
    setOwnVisible(!!payload.cls?.ownVisible)
    setLevel(payload.level)
    if (!payload.cls) {
      // 优先用打开弹窗时传入的当前选中分类；否则回退到该层级候选的第一项
      if (payload.parentId != null) {
        setParentId(payload.parentId)
      } else if (payload.level > 1) {
        const classes = flattenClasses(navs).filter((c) =>
          payload.level === 2 ? c.level === 1 : c.level === 2,
        )
        setParentId(classes[0]?.id)
      } else {
        setParentId(undefined)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editClass.open, payload])

  const parentCandidates = flattenClasses(navs).filter((c) =>
    level === 2 ? c.level === 1 : c.level === 2,
  )

  // 仅在「分类层级」切换时同步上级分类；不要依赖 parentCandidates（每次渲染都是新数组，会把用户手选冲掉）
  useEffect(() => {
    if (level <= 1) {
      setParentId(undefined)
      return
    }
    setParentId((prev) =>
      parentCandidates.some((c) => c.id === prev) ? prev : parentCandidates[0]?.id,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])

  const onSubmit = () => {
    if (!title.trim()) {
      toast.error('请填写分类名称')
      return
    }
    if (isEdit && payload?.cls) {
      updateClass(payload.cls.id, { title, icon, ownVisible })
      toast.success('已保存')
    } else {
      const node = { id: nextId(), title, icon, ownVisible, nav: [] }
      if (level === 1) {
        pushRootData(node)
      } else if (parentId) {
        pushData(parentId, node)
      } else {
        toast.error('请选择上级分类')
        return
      }
      toast.success('已添加')
    }
    closeAll()
  }

  return (
    <Modal
      open={editClass.open}
      title={isEdit ? `编辑分类（ID: ${payload?.cls?.id}）` : '新增分类'}
      onClose={closeAll}
      width="max-w-md"
      footer={
        <>
          <Button onClick={closeAll}>取消</Button>
          <Button variant="primary" onClick={onSubmit}>
            保存
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="分类名称 *">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="图标 URL">
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} />
        </Field>
        {!isEdit && (
          <>
            <Field label="分类层级">
              <Select
                value={level}
                onChange={(e) => setLevel(Number(e.target.value) as 1 | 2 | 3)}
              >
                <option value={1}>一级分类</option>
                <option value={2}>二级分类</option>
                <option value={3}>三级分类（直接挂网站）</option>
              </Select>
            </Field>
            {level > 1 && (
              <Field label="上级分类 *">
                <Select value={parentId} onChange={(e) => setParentId(Number(e.target.value))}>
                  {parentCandidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.path}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </>
        )}
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={ownVisible}
            onChange={(e) => setOwnVisible(e.target.checked)}
          />
          仅登录可见
        </label>
      </div>
    </Modal>
  )
}
