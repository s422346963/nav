// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// Hero 大搜索框（参考 WebStack-Hugo）：
// 胶囊形输入框（类型下拉 + 引擎图标 + 输入 + 圆形搜索按钮），
// 下方引擎快捷切换行，点击图标弹出引擎面板。

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, Search } from 'lucide-react'
import { useNavStore } from '@/store/useNavStore'
import { getDefaultEngine, setDefaultEngine } from '@/lib/utils'
import { SearchType } from '@/types/nav'
import type { ISearchItemProps } from '@/types/nav'
import { cn } from '@/lib/utils'
import { WebIcon } from './ui'

export const TYPE_OPTIONS = [
  { value: SearchType.All, label: '综合' },
  { value: SearchType.Class, label: '分类' },
  { value: SearchType.Tag, label: '标签' },
  { value: SearchType.Title, label: '标题' },
  { value: SearchType.Desc, label: '描述' },
  { value: SearchType.Url, label: '链接' },
  { value: SearchType.Current, label: '当前' },
  { value: SearchType.Quick, label: '快捷' },
  { value: SearchType.Id, label: 'ID' },
]

export default function SearchBar() {
  const search = useNavStore((s) => s.search)
  const settings = useNavStore((s) => s.settings)
  const [params, setParams] = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const [keyword, setKeyword] = useState(params.get('q') || '')
  const [engineOpen, setEngineOpen] = useState(false)

  // 引擎用组件 state 管理：localStorage 记忆 + 选中后立即刷新 UI
  const [engineName, setEngineName] = useState<string | undefined>(() =>
    getDefaultEngine(search.list || [])?.name,
  )
  const engine = useMemo<ISearchItemProps | undefined>(
    () => search.list?.find((i) => i.name === engineName) || search.list?.[0],
    [search.list, engineName],
  )

  const q = params.get('q') || ''
  useEffect(() => {
    setKeyword(q)
  }, [q])

  // '/' 聚焦搜索框
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!settings.openSearch) return null

  const sType = Number(params.get('type')) || SearchType.All

  const doSearch = () => {
    if (!engine) return
    if (engine.isInner) {
      const next = new URLSearchParams(params)
      keyword.trim() ? next.set('q', keyword.trim()) : next.delete('q')
      setParams(next)
    } else if (keyword.trim()) {
      window.open(`${engine.url}${encodeURIComponent(keyword.trim())}`)
    }
  }

  const pickEngine = (item: ISearchItemProps) => {
    setDefaultEngine(item)
    setEngineName(item.name)
    setEngineOpen(false)
  }

  return (
    <div className="relative">
      {/* 胶囊搜索框 */}
      <div className="flex h-13 items-center rounded-full bg-white pr-2 shadow-lg ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-primary/60 dark:bg-zinc-800 dark:ring-white/10">
        {/* 搜索类型（综合/分类/标签/...） */}
        <div className="relative shrink-0 self-stretch">
          <select
            className="h-full cursor-pointer appearance-none rounded-l-full bg-transparent py-0 pl-5 pr-6 text-sm text-zinc-500 outline-none dark:text-zinc-400"
            value={sType}
            onChange={(e) => {
              const next = new URLSearchParams(params)
              next.set('type', e.target.value)
              setParams(next)
            }}
            title="搜索范围"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
        </div>

        <div className="h-5 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700" />

        {/* 当前引擎图标（点击切换） */}
        <button
          className="flex shrink-0 cursor-pointer items-center px-2.5"
          title={`当前引擎：${engine?.name || ''}（点击切换）`}
          onClick={() => setEngineOpen((v) => !v)}
        >
          <WebIcon src={engine?.icon} name={engine?.name || '搜'} size={22} />
        </button>

        <input
          ref={inputRef}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          placeholder={engine?.placeholder || `在 ${engine?.name || ''} 中搜索`}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') doSearch()
          }}
        />

        {/* 圆形搜索按钮 */}
        <button
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent text-primary transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
          onClick={doSearch}
          aria-label="搜索"
        >
          <Search size={18} />
        </button>
      </div>

      {/* 引擎面板（点击图标弹出，卡片式引擎列表） */}
      {engineOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setEngineOpen(false)} />
          <div className="absolute left-0 right-0 top-[56px] z-30 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {search.list.map((item) => {
                const active = item.name === engine?.name
                return (
                  <button
                    key={item.name}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors',
                      active
                        ? 'border-primary bg-primary/5 font-medium text-primary'
                        : 'border-transparent bg-zinc-100 hover:bg-zinc-200/70 dark:bg-zinc-700/50 dark:hover:bg-zinc-700',
                    )}
                    onClick={() => pickEngine(item)}
                  >
                    <WebIcon src={item.icon} name={item.name} size={18} />
                    <span className="truncate">{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
