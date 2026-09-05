// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 设置面板：与 settings.json 逐项对应、一项一行；页面底部固定
// 「保存设置」与「上传 settings.json」操作栏。Token 在进入后台时已校验。

import { useEffect, useState } from 'react'
import { CloudUpload, Save } from 'lucide-react'
import { useNavStore } from '@/store/useNavStore'
import { uploadImage, uploadSettings, parseRepoUrl } from '@/lib/github'
import { Button, Field, IconInput, Input } from '@/components/ui'
import { toast } from '@/store/toast'
import type { ISettings } from '@/types/nav'

export default function SettingsPanel() {
  const settings = useNavStore((s) => s.settings)
  const setSettings = useNavStore((s) => s.setSettings)
  const navs = useNavStore((s) => s.navs)
  const token = useNavStore((s) => s.token)
  const githubConfig = useNavStore((s) => s.githubConfig)
  const saveGithubConfig = useNavStore((s) => s.saveGithubConfig)

  const [form, setForm] = useState<ISettings>(settings)
  const [uploading, setUploading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)

  useEffect(() => setForm(settings), [settings])

  const patch = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  // 图床仓库：只使用 imageRepoUrl（不回退到代码仓库）
  const imageCfg = (() => {
    const imgRepo = parseRepoUrl(form.imageRepoUrl)
    if (imgRepo) {
      return {
        owner: imgRepo.owner,
        repo: imgRepo.repo,
        branch: form.imageBranch || form.branch || 'main',
      }
    }
    return { owner: '', repo: '', branch: 'main' }
  })()

  /** 上传侧边栏 logo */
  const handleUploadSideLogo = async (file: File) => {
    if (!token) {
      toast.error('请先登录')
      return
    }
    setUploadingLogo(true)
    const result = await uploadImage({ config: imageCfg, token, file })
    setUploadingLogo(false)
    if (result.ok && result.url) {
      patch('sideLogo', result.url)
      toast.success('Logo 上传成功')
    } else {
      toast.error(result.message)
    }
  }

  /** 上传站点 favicon */
  const handleUploadFavicon = async (file: File) => {
    if (!token) {
      toast.error('请先登录')
      return
    }
    setUploadingFavicon(true)
    const result = await uploadImage({ config: imageCfg, token, file })
    setUploadingFavicon(false)
    if (result.ok && result.url) {
      patch('favicon', result.url)
      toast.success('favicon 上传成功')
    } else {
      toast.error(result.message)
    }
  }

  // 上传目标：settings.json 的 gitRepoUrl/branch 优先，回退 localStorage 仓库配置
  const uploadConfig = (() => {
    const repo = parseRepoUrl(form.gitRepoUrl)
    return repo
      ? { owner: repo.owner, repo: repo.repo, branch: form.branch || 'main' }
      : githubConfig
  })()

  const saveSettings = () => {
    setSettings(form)
    const repo = parseRepoUrl(form.gitRepoUrl)
    if (repo) {
      saveGithubConfig({
        owner: repo.owner,
        repo: repo.repo,
        branch: form.branch || 'main',
      })
    }
    toast.success('设置已保存（本地生效，可通过上传同步到仓库）')
  }

  const doUpload = async () => {
    if (!token) {
      toast.error('请先登录')
      return
    }
    setUploading(true)
    const result = await uploadSettings({
      config: uploadConfig,
      token,
      settings: form,
      message: 'update settings',
    })
    setUploading(false)
    result.ok ? toast.success(result.message) : toast.error(result.message)
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <Field label="favicon（站点图标，站内搜索图标同源）">
        <IconInput
          value={form.favicon || ''}
          onChange={(url) => patch('favicon', url)}
          onFile={handleUploadFavicon}
          uploading={uploadingFavicon}
        />
      </Field>

      <Field label="title（站点标题，浏览器标签页标题）">
        <Input value={form.title || ''} onChange={(e) => patch('title', e.target.value)} />
      </Field>

      <Field label="showThemeToggle（顶栏显示主题切换按钮）">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={!!form.showThemeToggle}
            onChange={(e) => patch('showThemeToggle', e.target.checked)}
          />
          显示
        </label>
      </Field>

      <Field label="createWebKey（新增网站快捷键）">
        <Input
          value={form.createWebKey || 'E'}
          onChange={(e) => patch('createWebKey', e.target.value)}
        />
      </Field>

      <Field label="sideLogo（侧边栏品牌 logo，留空回退 favicon）">
        <IconInput
          value={form.sideLogo || ''}
          onChange={(url) => patch('sideLogo', url)}
          onFile={handleUploadSideLogo}
          uploading={uploadingLogo}
        />
      </Field>

      <Field label="sideTitle（侧边栏标题，留空回退 title）">
        <Input value={form.sideTitle || ''} onChange={(e) => patch('sideTitle', e.target.value)} />
      </Field>

      <Field label="gitHubCDN（CDN 域名替换目标）">
        <Input value={form.gitHubCDN || ''} onChange={(e) => patch('gitHubCDN', e.target.value)} />
      </Field>

      <Field label="gitRepoUrl（数据仓库）">
        <Input
          value={form.gitRepoUrl || ''}
          onChange={(e) => patch('gitRepoUrl', e.target.value)}
          placeholder="https://github.com/owner/repo"
        />
      </Field>

      <Field label="branch（数据分支）">
        <Input
          value={form.branch || ''}
          onChange={(e) => patch('branch', e.target.value)}
          placeholder="main"
        />
      </Field>

      <Field label="imageRepoUrl（图床仓库，可选）">
        <Input
          value={form.imageRepoUrl || ''}
          onChange={(e) => patch('imageRepoUrl', e.target.value)}
          placeholder="https://github.com/owner/images"
        />
      </Field>

      <Field label="imageBranch（图床分支，留空回退 branch）">
        <Input
          value={form.imageBranch || ''}
          onChange={(e) => patch('imageBranch', e.target.value)}
          placeholder="main"
        />
      </Field>

      <Field label="apiUrl（网站信息抓取 API 服务地址）">
        <Input
          value={form.apiUrl || ''}
          onChange={(e) => patch('apiUrl', e.target.value)}
          placeholder="https://api-qiangbin.vercel.app"
        />
      </Field>

      {/* 底部固定操作栏 */}
      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-700/70 dark:bg-zinc-900/80">
        <Button onClick={saveSettings}>
          <Save size={14} /> 保存设置
        </Button>
        <Button variant="primary" disabled={uploading} onClick={doUpload}>
          <CloudUpload size={14} /> {uploading ? '上传中...' : '上传同步'}
        </Button>
      </div>
    </div>
  )
}
