// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 固定顶栏（只覆盖右侧内容区）：左侧汉堡按钮，右侧功能按钮（折叠全部/暗黑切换）。
// 滚动感知：顶部透明，滚动后过渡为毛玻璃 + 底部分隔线，避免内容穿透文字。
// 后台管理入口已移至侧边栏底部。

import { useEffect, useState } from 'react'
import { Home, Menu, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '@/store/useThemeStore'
import { cn } from '@/lib/utils'

export default function Header({
  onToggleSidebar,
  sidebarOpen = true,
  tone = 'dark',
}: {
  onToggleSidebar?: () => void
  sidebarOpen?: boolean
  /** 透明态下顶栏背后的背景明暗：dark=深色背景（主页 Hero 图，用白色图标），light=浅色背景（后台页，用深色图标） */
  tone?: 'dark' | 'light'
}) {
  const dark = useThemeStore((s) => s.dark)
  const toggleDark = useThemeStore((s) => s.toggle)
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  // 滚动感知：超过 8px 切换毛玻璃状态
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 滚动后（白色毛玻璃顶栏）：一律深色图标；
  // 未滚动透明态：按背景明暗选择图标颜色
  const btn = scrolled
    ? 'flex h-10 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white'
    : tone === 'dark'
      ? 'flex h-10 cursor-pointer items-center justify-center rounded-full text-white drop-shadow transition-colors hover:bg-white/15 hover:text-white dark:text-white dark:hover:bg-white/15'
      : 'flex h-10 cursor-pointer items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white'
  const iconBtn = cn(btn, 'w-10')

  return (
    <header
      className={cn(
        // 只覆盖右侧内容区：桌面端侧栏展开时从 220px 处开始，移动端始终全宽
        'fixed top-0 right-0 left-0 z-40 flex h-16 items-center border-b px-3 transition-[left,background-color,border-color,box-shadow] duration-300 ease-in-out md:px-4',
        sidebarOpen ? 'md:left-[220px]' : 'md:left-16',
        scrolled
          ? 'border-zinc-200/80 bg-white/75 shadow-[0_1px_2px_rgb(0_0_0/0.04)] backdrop-blur-xl backdrop-saturate-150 dark:border-zinc-700/60 dark:bg-zinc-900/75'
          : 'border-transparent bg-transparent',
      )}
    >
      {/* 汉堡按钮：桌面端收起/展开侧栏，移动端打开抽屉 */}
      <button
        className={iconBtn}
        onClick={onToggleSidebar}
        aria-label="切换侧栏"
        title="切换侧栏"
      >
        <Menu size={18} />
      </button>

      {/* 主页按钮：回到首页 */}
      <button
        className={iconBtn}
        aria-label="主页"
        title="主页"
        onClick={() => navigate('/')}
      >
        <Home size={18} />
      </button>

      {/* 右侧功能按钮（纯图标，title 提示） */}
      <div className="ml-auto flex items-center gap-1">
        <button
          className={cn(btn, 'gap-1.5 px-3 text-sm font-medium')}
          title="切换主题"
          aria-label="切换主题"
          onClick={toggleDark}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          <span>主题</span>
        </button>
      </div>
    </header>
  )
}
