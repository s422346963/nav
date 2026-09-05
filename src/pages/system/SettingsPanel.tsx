// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 设置面板：站点设置 + GitHub 仓库配置与数据上传（对应原 system/setting + config）。

import { useEffect, useState } from 'react'
import { CloudUpload, LogIn } from 'lucide-react'
import { useNavStore } from '@/store/useNavStore'
import { uploadDb, uploadSettings, verifyToken } from '@/lib/github'
import { cleanWebAttrs } from '@/lib/dfs'
import { Button, Field, Input, Select, Textarea } from '@/components/ui'
import { toast } from '@/store/toast'
import type { ISettings } from '@/types/nav'
import { ActionType } from '@/types/nav'

export default function SettingsPanel() {
  const settings = useNavStore((s) => s.settings)
  const setSettings = useNavStore((s) => s.setSettings)
  const navs = useNavStore((s) => s.navs)
  const isLogin = useNavStore((s) => s.isLogin)
  const token = useNavStore((s) => s.token)
  const githubConfig = useNavStore((s) => s.githubConfig)
  const saveGithubConfig = useNavStore((s) => s.saveGithubConfig)

  const [form, setForm] = useState<ISettings>(settings)
  const [gh, setGh] = useState(githubConfig)
  const [tokenInput, setTokenInput] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => setForm(settings), [settings])

  const patch = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const saveSettings = () => {
    setSettings(form)
    toast.success('设置已保存（本地生效，可通过下方上传同步到仓库）')
  }

  const doUpload = async (kind: 'db' | 'settings') => {
    if (!isLogin) {
      toast.error('请先在首页右上角登录（或下方校验 Token）')
      return
    }
    setUploading(true)
    const result =
      kind === 'db'
        ? await uploadDb({ config: gh, token, navs: cleanWebAttrs(navs), message: 'update db' })
        : await uploadSettings({
            config: gh,
            token,
            settings: form,
            message: 'update settings',
          })
    setUploading(false)
    result.ok ? toast.success(result.message) : toast.error(result.message)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 站点设置 */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">站点设置</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="站点标题">
            <Input value={form.title || ''} onChange={(e) => patch('title', e.target.value)} />
          </Field>
          <Field label="侧栏标题（sideTitle）">
            <Input value={form.sideTitle || ''} onChange={(e) => patch('sideTitle', e.target.value)} />
          </Field>
          <Field label="浏览器标签标题（sideDocTitle，空则用站点标题）">
            <Input value={form.sideDocTitle || ''} onChange={(e) => patch('sideDocTitle', e.target.value)} />
          </Field>
          <Field label="卡片风格">
            <Select
              value={form.sideCardStyle}
              onChange={(e) => patch('sideCardStyle', e.target.value)}
            >
              {['standard', 'column', 'example', 'retro', 'original', 'poster', 'icon'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="轮播高度（0 不显示）">
            <Input
              type="number"
              value={form.sideThemeHeight ?? 0}
              onChange={(e) => patch('sideThemeHeight', Number(e.target.value))}
            />
          </Field>
          <Field label="新增网站快捷键">
            <Input value={form.createWebKey || 'E'} onChange={(e) => patch('createWebKey', e.target.value)} />
          </Field>
          <Field label="CDN 域名替换目标">
            <Input value={form.gitHubCDN || ''} onChange={(e) => patch('gitHubCDN', e.target.value)} />
          </Field>
          <Field label="前台权限（userActions）">
            <div className="flex gap-3 pt-1 text-sm">
              {[
                [ActionType.Create, '新增'],
                [ActionType.Edit, '编辑'],
                [ActionType.Delete, '删除'],
              ].map(([v, label]) => (
                <label key={String(v)} className="flex cursor-pointer items-center gap-1">
                  <input
                    type="checkbox"
                    checked={(form.userActions || []).includes(v as ActionType)}
                    onChange={(e) => {
                      const list = new Set(form.userActions || [])
                      e.target.checked ? list.add(v as ActionType) : list.delete(v as ActionType)
                      patch('userActions', Array.from(list))
                    }}
                  />
                  {label as string}
                </label>
              ))}
            </div>
          </Field>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          {[
            ['showRate', '显示评分'],
            ['showThemeToggle', '顶栏显示主题切换'],
            ['openSearch', '显示搜索框'],
            ['showGithub', '显示 GitHub 入口'],
          ].map(([k, label]) => (
            <label key={k} className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={!!form[k as string]}
                onChange={(e) => patch(k as string, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
        <Field label="页脚 HTML（sideFooterHTML，支持 ${year}/${hostname} 插值）">
          <Textarea
            rows={4}
            value={form.sideFooterHTML || ''}
            onChange={(e) => patch('sideFooterHTML', e.target.value)}
          />
        </Field>
        <div>
          <Button variant="primary" onClick={saveSettings}>
            保存设置
          </Button>
        </div>
      </section>

      {/* GitHub */}
      <section className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-700/70">
        <h3 className="text-sm font-medium">GitHub 仓库与发布</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          登录状态：{isLogin ? '✅ 已登录' : '❌ 未登录'}。填写数据所在仓库信息后，可将本地编辑上传回仓库触发 CI 部署。
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Owner">
            <Input value={gh.owner} onChange={(e) => setGh({ ...gh, owner: e.target.value })} placeholder="xjh22222228" />
          </Field>
          <Field label="Repo">
            <Input value={gh.repo} onChange={(e) => setGh({ ...gh, repo: e.target.value })} placeholder="nav" />
          </Field>
          <Field label="Branch">
            <Input value={gh.branch} onChange={(e) => setGh({ ...gh, branch: e.target.value })} placeholder="main" />
          </Field>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="GitHub Token（校验并登录）" className="min-w-64 flex-1">
            <Input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
            />
          </Field>
          <Button
            onClick={async () => {
              const ok = await verifyToken(tokenInput)
              if (ok) {
                saveGithubConfig(gh)
                localStorage.setItem('token', tokenInput.trim())
                toast.success('Token 有效，已登录')
                setTimeout(() => window.location.reload(), 500)
              } else {
                toast.error('Token 无效或网络错误')
              }
            }}
          >
            <LogIn size={14} /> 校验并登录
          </Button>
          <Button
            variant="primary"
            disabled={uploading}
            onClick={() => doUpload('db')}
          >
            <CloudUpload size={14} /> {uploading ? '上传中...' : '上传 db.json'}
          </Button>
          <Button disabled={uploading} onClick={() => doUpload('settings')}>
            <CloudUpload size={14} /> 上传 settings.json
          </Button>
        </div>
        <div>
          <Button onClick={() => saveGithubConfig(gh)}>保存仓库信息</Button>
        </div>
      </section>
    </div>
  )
}
