// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// GitHub Contents API：Token 校验 + db.json 上传（对应原 src/api/index.ts 的 GitHub 分支）。

import type { GithubConfig } from '@/store/useNavStore'

const DB_PATH = 'public/data/db.json'
const SETTINGS_PATH = 'public/data/settings.json'

/** 从 GitHub 仓库 URL 解析 owner/repo（支持 .git 后缀与 git@ 形式） */
export function parseRepoUrl(url?: string): { owner: string; repo: string } | null {
  if (!url) return null
  const m = url.trim().match(/github\.com[/:]([^/]+)\/([^/#?]+?)(?:\.git)?(?:[/#?].*)?$/i)
  return m ? { owner: m[1], repo: m[2] } : null
}

function base64(content: string): string {
  const bytes = new TextEncoder().encode(content)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin)
}

/** 校验 GitHub Token 有效性（对齐原 verifyToken） */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${token.trim()}` },
    })
    return res.ok
  } catch {
    return false
  }
}

/** 更新仓库文件：先 GET 拿 sha，再 PUT 提交（对齐原 updateFileContent） */
export async function updateFileContent(options: {
  config: GithubConfig
  token: string
  path: string
  content: string
  message?: string
}): Promise<{ ok: boolean; message: string }> {
  const { config, token, path, content } = options
  const message = options.message || 'update'
  if (!config.owner || !config.repo) {
    return { ok: false, message: '请先在「后台 → 设置」中填写仓库信息' }
  }
  const headers = {
    Authorization: `token ${token.trim()}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }

  // 1. 拿现有文件 sha（新文件则跳过）
  let sha: string | undefined
  try {
    const res = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`,
      { headers },
    )
    if (res.ok) {
      const data = await res.json()
      sha = data.sha
    }
  } catch {
    /* ignore */
  }

  // 2. PUT 提交
  const res = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `rebot(CI): ${message}`,
        content: base64(content),
        branch: config.branch,
        sha,
      }),
    },
  )
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    return { ok: false, message: data?.message || `上传失败（${res.status}）` }
  }
  return { ok: true, message: '上传成功，等待 CI 重新部署' }
}

export function uploadDb(options: {
  config: GithubConfig
  token: string
  navs: unknown[]
  message?: string
}) {
  return updateFileContent({
    ...options,
    path: DB_PATH,
    content: JSON.stringify(options.navs),
  })
}

/** 上传图片到仓库（Contents API，二进制 base64），返回 CDN 地址 */
export async function uploadImage(options: {
  config: GithubConfig
  token: string
  file: File
  pathPrefix?: string
}): Promise<{ ok: boolean; url?: string; message: string }> {
  const { config, token, file } = options
  if (!config.owner || !config.repo) {
    return { ok: false, message: '请先在「后台 → 设置」中配置图床仓库（imageRepoUrl）' }
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
  const content = dataUrl.split(',')[1]
  const pathPrefix = options.pathPrefix || '_upload'
  const path = `${pathPrefix}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
  const res = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${token.trim()}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'upload image',
        content,
        branch: config.branch,
      }),
    },
  )
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    return { ok: false, message: data?.message || `上传失败（${res.status}）` }
  }
  const cdnUrl = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@${config.branch}/${path}`
  return { ok: true, url: cdnUrl, message: '上传成功' }
}

export function uploadSettings(options: {
  config: GithubConfig
  token: string
  settings: unknown
  message?: string
}) {
  return updateFileContent({
    ...options,
    path: SETTINGS_PATH,
    content: JSON.stringify(options.settings, null, 4),
  })
}
