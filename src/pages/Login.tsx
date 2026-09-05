// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 登录页（/login）：填写 GitHub Token 校验后进入后台管理。左上角可返回。

import { useState } from 'react'
import { ArrowLeft, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNavStore } from '@/store/useNavStore'
import { Button, Input } from '@/components/ui'
import { toast } from '@/store/toast'

export default function Login() {
  const login = useNavStore((s) => s.login)
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!token.trim()) return
    setLoading(true)
    const ok = await login(token)
    setLoading(false)
    // 校验成功后进入后台管理
    if (ok) {
      toast.success('登录成功，进入后台管理')
      navigate('/system/web', { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* 顶部返回按钮 */}
      <div className="p-4">
        <button
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} /> 返回
        </button>
      </div>

      {/* 登录卡片 */}
      <div className="flex flex-1 items-start justify-center px-4">
        <div className="mt-10 w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700/70 dark:bg-zinc-800/80">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold">系统管理</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">登录后才能访问</p>
            </div>
          </div>

          <p className="mb-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            填写 GitHub Personal Access Token（需要仓库 Contents 读写权限），校验通过后即可进入后台管理。
          </p>

          <Input
            type="password"
            placeholder="ghp_xxxxxxxxxxxx"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter') submit()
            }}
          />

          <Button
            variant="primary"
            className="mt-3 w-full"
            disabled={loading || !token.trim()}
            onClick={submit}
          >
            {loading ? '校验中...' : '登录'}
          </Button>
        </div>
      </div>
    </div>
  )
}
