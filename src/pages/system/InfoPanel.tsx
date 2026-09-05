// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 网站信息面板（对齐原 navbin system/info）：Token、构建时间、当前版本、最新版本。

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavStore } from '@/store/useNavStore'

export default function InfoPanel() {
  const token = useNavStore((s) => s.token)
  const [showToken, setShowToken] = useState(false)

  const maskedToken = token
    ? `${token.slice(0, 6)}${'*'.repeat(Math.max(token.length - 10, 4))}${token.slice(-4)}`
    : '未登录'

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: 'Token',
      value: (
        <span className="inline-flex items-center gap-2 font-mono text-xs">
          {showToken ? token || '未登录' : maskedToken}
          {token && (
            <button
              className="cursor-pointer text-zinc-400 transition-colors hover:text-primary"
              title={showToken ? '隐藏' : '显示'}
              onClick={() => setShowToken((v) => !v)}
            >
              {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          )}
        </span>
      ),
    },
    {
      label: '构建时间',
      value: new Date(__BUILD_DATETIME__).toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
    },
    { label: '当前版本', value: `v${__APP_VERSION__}` },
  ]

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">网站信息</h3>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700/70">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center gap-4 px-4 py-3 text-sm ${
              i > 0 ? 'border-t border-zinc-200 dark:border-zinc-700/70' : ''
            }`}
          >
            <span className="w-20 shrink-0 text-zinc-500 dark:text-zinc-400">{row.label}</span>
            <span className="min-w-0 flex-1 truncate">{row.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
