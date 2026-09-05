// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 新增/编辑网站弹窗（对应原 create-web）。

import { useEffect, useState } from 'react'
import { useNavStore } from '@/store/useNavStore'
import { useModalStore } from '@/store/useModalStore'
import { flattenClasses } from '@/lib/tree'
import type { IWebProps } from '@/types/nav'
import { Button, Field, Input, Modal, Select, Textarea } from './ui'
import { toast } from '@/store/toast'

export default function EditWebModal() {
  const { editWeb, closeAll } = useModalStore()
  const navs = useNavStore((s) => s.navs)
  const tagList = useNavStore((s) => s.tagList)
  const pushData = useNavStore((s) => s.pushData)
  const updateWeb = useNavStore((s) => s.updateWeb)
  const nextId = useNavStore((s) => s.nextId)

  const isEdit = !!editWeb.web
  const classes = flattenClasses(navs).filter((c) => c.level === 3)

  const [form, setForm] = useState<Partial<IWebProps>>({})
  const [parentId, setParentId] = useState<number | undefined>()
  const [tagIds, setTagIds] = useState<number[]>([])

  useEffect(() => {
    if (!editWeb.open) return
    const web = editWeb.web
    setForm(web ? { ...web } : { name: '', url: '', icon: '', desc: '', rate: 5, top: false, index: 100000 })
    setParentId(editWeb.parentId ?? classes[0]?.id)
    setTagIds((web?.tags || []).map((t) => Number(t.id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editWeb.open, editWeb.web])

  const patch = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const onSubmit = () => {
    if (!form.name?.trim()) {
      toast.error('请填写网站名称')
      return
    }
    if (isEdit && editWeb.web) {
      updateWeb(editWeb.web.id, {
        ...form,
        topTypes: form.top ? [1] : [],
        tags: tagIds.map((id) => ({ id, url: '' })),
      } as IWebProps)
      toast.success('已保存')
    } else {
      if (!parentId) {
        toast.error('请选择所属分类')
        return
      }
      pushData(parentId, {
        ...form,
        id: nextId(),
        topTypes: form.top ? [1] : [],
        tags: tagIds.map((id) => ({ id, url: '' })),
      })
      toast.success('已添加')
    }
    closeAll()
  }

  return (
    <Modal
      open={editWeb.open}
      title={isEdit ? `编辑网站（ID: ${editWeb.web!.id}）` : '新增网站'}
      onClose={closeAll}
      footer={
        <>
          <Button onClick={closeAll}>取消</Button>
          <Button variant="primary" onClick={onSubmit}>
            保存
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="名称 *">
          <Input value={form.name || ''} onChange={(e) => patch('name', e.target.value)} />
        </Field>
        <Field label="URL（^ 本窗口 / @ 站内路由）">
          <Input value={form.url || ''} onChange={(e) => patch('url', e.target.value)} />
        </Field>
        <Field label="图标 URL" className="col-span-2">
          <Input value={form.icon || ''} onChange={(e) => patch('icon', e.target.value)} placeholder="留空则自动使用 favicon" />
        </Field>
        <Field label="描述（! 开头表示原始 HTML）" className="col-span-2">
          <Textarea value={form.desc || ''} onChange={(e) => patch('desc', e.target.value)} />
        </Field>
        <Field label="评分（0-5）">
          <Input
            type="number"
            min={0}
            max={5}
            value={form.rate ?? 5}
            onChange={(e) => patch('rate', Number(e.target.value))}
          />
        </Field>
        <Field label="排序权重（越小越靠前）">
          <Input
            type="number"
            value={form.index ?? 100000}
            onChange={(e) => patch('index', e.target.value)}
          />
        </Field>
        {!isEdit && (
          <Field label="所属分类 *" className="col-span-2">
            <Select value={parentId} onChange={(e) => setParentId(Number(e.target.value))}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.path}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="标签" className="col-span-2">
          <div className="flex flex-wrap gap-2">
            {tagList.map((tag) => (
              <label key={tag.id} className="flex cursor-pointer items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={tagIds.includes(Number(tag.id))}
                  onChange={(e) => {
                    setTagIds((ids) =>
                      e.target.checked
                        ? [...ids, Number(tag.id)]
                        : ids.filter((i) => i !== Number(tag.id)),
                    )
                  }}
                />
                <span style={{ color: tag.color }}>{tag.name}</span>
              </label>
            ))}
          </div>
        </Field>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!form.top}
            onChange={(e) => patch('top', e.target.checked)}
          />
          置顶到首页
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!form.ownVisible}
            onChange={(e) => patch('ownVisible', e.target.checked)}
          />
          仅登录可见
        </label>
      </div>
    </Modal>
  )
}
