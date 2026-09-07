// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 新增/编辑网站弹窗（对齐原 create-web 表单格式）：
// 网站链接 / 网站名称 / 排序 / 快捷方式 / 自己可见 / 图标地址 / 网站描述。
// 去掉了原版的评分系数、图片（截图）、关联链接或标签、翻译按钮。

import { useEffect, useState } from 'react'
import { useNavStore } from '@/store/useNavStore'
import { useModalStore } from '@/store/useModalStore'
import { flattenClasses } from '@/lib/tree'
import { findNodeById } from '@/lib/dfs'
import { isNumber, DEFAULT_SORT_INDEX } from '@/lib/utils'
import type { IWebProps } from '@/types/nav'
import { Button, IconInput, Input, Modal, Select, Textarea } from './ui'
import { toast } from '@/store/toast'
import { parseRepoUrl, uploadImage } from '@/lib/github'

/** 横向表单行：左侧标签 + 右侧控件（对齐原版 ant-form 布局） */
function FormRow({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-24 shrink-0 pt-2 text-right text-sm text-zinc-500 dark:text-zinc-400">
        {required && <span className="mr-0.5 text-red-500">*</span>}
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="h-4 w-4 accent-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  )
}

export default function EditWebModal() {
  const { editWeb, closeAll } = useModalStore()
  const navs = useNavStore((s) => s.navs)
  const pushData = useNavStore((s) => s.pushData)
  const updateWeb = useNavStore((s) => s.updateWeb)
  const nextId = useNavStore((s) => s.nextId)
  const token = useNavStore((s) => s.token)
  const githubConfig = useNavStore((s) => s.githubConfig)
  const settings = useNavStore((s) => s.settings)
  const [uploading, setUploading] = useState(false)

  // 图床仓库：只使用 settings.imageRepoUrl（不回退到代码仓库）
  const imageCfg = (() => {
    const imgRepo = parseRepoUrl(settings.imageRepoUrl)
    if (imgRepo) {
      return {
        owner: imgRepo.owner,
        repo: imgRepo.repo,
        branch: settings.imageBranch || settings.branch || 'main',
      }
    }
    return { owner: '', repo: '', branch: 'main' }
  })()

  const isEdit = !!editWeb.web
  const classes = flattenClasses(navs).filter((c) => c.level === 3)

  const [form, setForm] = useState<Partial<IWebProps>>({})
  const [parentId, setParentId] = useState<number | undefined>()

  useEffect(() => {
    if (!editWeb.open) return
    const web = editWeb.web
    setForm(
      web
        ? { ...web }
        : { name: '', url: '', icon: '', desc: '', rate: 5, top: false },
    )
    setParentId(editWeb.parentId ?? classes[0]?.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editWeb.open, editWeb.web])

  const patch = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  /** URL 失焦：调用抓取 API 自动填充图标/名称/描述（仅填充空字段，对齐原 getWebInfo） */
  const [fetching, setFetching] = useState(false)
  const onUrlBlur = async () => {
    if (fetching) return
    const raw = (form.url || '').trim()
    if (!raw) return
    const url = raw.replace(/^[^\w]+/, '') // 去掉 ^ @ 等前缀
    try {
      new URL(url)
    } catch {
      return
    }
    if (form.icon && form.name && form.desc) return // 已填满则跳过
    setFetching(true)
    try {
      const base = (settings.apiUrl || 'https://api-qiangbin.vercel.app').replace(/\/+$/, '')
      const res = await fetch(`${base}/api/url/icon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) {
        toast.error(`获取网站信息失败（${res.status}）`)
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!data.url && !data.title && !data.description) {
        toast.warning('未获取到该网站的信息，请手动填写')
        return
      }
      setForm((f) => ({
        ...f,
        icon: f.icon || data.url || '',
        name: f.name || data.title || '',
        desc: f.desc || data.description || '',
      }))
    } catch {
      toast.error('获取网站信息失败，请检查网络或 apiUrl 配置')
    } finally {
      setFetching(false)
    }
  }

  /** 上传图标到图床仓库，成功后回填 CDN 地址 */
  const onUploadIcon = async (file: File) => {
    if (!token) {
      toast.error('请先登录后再上传')
      return
    }
    setUploading(true)
    const result = await uploadImage({ config: imageCfg, token, file })
    setUploading(false)
    if (result.ok && result.url) {
      patch('icon', result.url)
      toast.success('图标上传成功')
    } else {
      toast.error(result.message)
    }
  }

  const onSubmit = () => {
    if (!form.url?.trim()) {
      toast.error('请填写网站链接')
      return
    }
    if (!form.name?.trim()) {
      toast.error('请填写网站名称')
      return
    }
    if (isEdit && editWeb.web) {
      // 不改动关联标签，仅更新表单字段
      updateWeb(editWeb.web.id, {
        ...form,
        tags: editWeb.web.tags,
        topTypes: form.top ? [1] : [],
      } as IWebProps)
      toast.success('已保存')
    } else {
      if (!parentId) {
        toast.error('请选择所属分类')
        return
      }
      // 取同分类下最大 index + 1，保证新网站默认排到最后
      const siblings = findNodeById(navs, parentId)?.nav || []
      const maxIndex = siblings.reduce(
        (m: number, it: any) =>
          Math.max(m, isNumber(it.index) ? Number(it.index) : DEFAULT_SORT_INDEX),
        0,
      )
      pushData(parentId, {
        ...form,
        index: isNumber(form.index) ? Number(form.index) : maxIndex + 1,
        id: nextId(),
        tags: [],
        topTypes: form.top ? [1] : [],
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
      <div className="flex flex-col gap-4">
        {!isEdit && (
          <FormRow label="所属分类" required>
            <Select value={parentId} onChange={(e) => setParentId(Number(e.target.value))}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.path}
                </option>
              ))}
            </Select>
          </FormRow>
        )}

        <FormRow label="网站链接" required>
          <div className="flex flex-col gap-1">
            <Input value={form.url || ''} onChange={(e) => patch('url', e.target.value)} onBlur={onUrlBlur} />
            {fetching && <p className="text-xs text-zinc-400">正在获取网站信息...</p>}
          </div>
        </FormRow>

        <FormRow label="网站名称" required>
          <Input value={form.name || ''} onChange={(e) => patch('name', e.target.value)} />
        </FormRow>

        <FormRow label="排序">
          <Input
            type="number"
            placeholder="100000"
            value={form.index ?? ''}
            onChange={(e) => patch('index', e.target.value)}
          />
        </FormRow>

        <FormRow label="自己可见">
          <div className="flex h-9 items-center">
            <SwitchRow
              label=""
              checked={!!form.ownVisible}
              onChange={(v) => patch('ownVisible', v)}
            />
          </div>
        </FormRow>

        <FormRow label="图标地址">
          <IconInput
            value={form.icon || ''}
            onChange={(url) => patch('icon', url)}
            onFile={onUploadIcon}
            uploading={uploading}
            placeholder="留空则自动使用 favicon"
          />
        </FormRow>

        <FormRow label="网站描述">
          <Textarea
            rows={3}
            value={form.desc || ''}
            onChange={(e) => patch('desc', e.target.value)}
          />
        </FormRow>
      </div>
    </Modal>
  )
}
