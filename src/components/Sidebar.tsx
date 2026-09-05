// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 侧边分类导航（参考 WebStack-Hugo）：
// 图标 + 标题 + 折叠箭头的一级菜单、缩进二级菜单、底部固定入口。
// 桌面端可通过顶栏汉堡按钮整体收起（滑出），移动端为抽屉。

import { useEffect, useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  Code2,
  FlaskConical,
  Gamepad2,
  House,
  Image,
  Lock,
  LogOut,
  Newspaper,
  Plane,
  Settings,
  Star,
  Wrench,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useNavStore } from '@/store/useNavStore'
import { ConfirmModal } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { INavProps, INavTwoProp } from '@/types/nav'
import type { LucideIcon } from 'lucide-react'

// 一级分类图标（数据无 icon 字段，按索引循环取用）
const MENU_ICONS = [Star, FlaskConical, Gamepad2, Image, Code2, BookOpen, Plane, Newspaper, Wrench]

// 自定义菜单项（后台管理等页面传入，替换默认分类树）
export interface SidebarMenuItem {
  key: string
  label: string
  icon?: LucideIcon
}

export default function Sidebar({
  currentOneId,
  currentTwoId,
  onSelect,
  desktopOpen,
  mobileOpen,
  onMobileClose,
  menu,
  activeMenuKey,
  onMenuSelect,
  showLogout = false,
}: {
  currentOneId: number | undefined
  currentTwoId: number | undefined
  onSelect?: () => void
  desktopOpen: boolean
  mobileOpen: boolean
  onMobileClose: () => void
  menu?: SidebarMenuItem[]
  activeMenuKey?: string
  onMenuSelect?: (key: string) => void
  /** 底部显示"退出登录"入口（后台管理页使用） */
  showLogout?: boolean
}) {
  const navs = useNavStore((s) => s.navs)
  const isLogin = useNavStore((s) => s.isLogin)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const settings = useNavStore((s) => s.settings)
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  // 品牌区：logo + 标题（从顶栏移入）。收起时只留 logo 居中
  const brandText =
    (settings.sideTitle || settings.title || '').trim().split(/\s/)[0] || '路标导航'

  const brand = (collapsed: boolean) => (
    <Link
      to="/"
      title={collapsed ? brandText : undefined}
      className={cn(
        'flex h-16 shrink-0 items-center border-b border-zinc-100 dark:border-zinc-700/70',
        collapsed ? 'justify-center' : 'gap-2.5 px-5',
      )}
    >
      {settings.sideLogo || settings.favicon ? (
        <img
          src={settings.sideLogo || settings.favicon}
          className="h-9 w-9 shrink-0 rounded-lg object-contain"
          alt="logo"
        />
      ) : null}
      {!collapsed && (
        <span className="truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {brandText}
        </span>
      )}
    </Link>
  )

  // 当前一级始终展开
  useEffect(() => {
    if (currentOneId != null) {
      setExpanded((s) => (s.has(currentOneId) ? s : new Set(s).add(currentOneId)))
    }
  }, [currentOneId])

  const goSystem = () => navigate('/system')

  const nav = (collapsed: boolean) => (
    <div className="flex h-full flex-col">
      {brand(collapsed)}
      <nav className="flex-1 overflow-y-auto py-3">
        {/* 自定义菜单模式（后台管理等页面） */}
        {menu?.map((m, i) => {
          const Icon = m.icon || MENU_ICONS[i % MENU_ICONS.length]
          const active = m.key === activeMenuKey
          return (
            <button
              key={m.key}
              title={collapsed ? m.label : undefined}
              className={cn(
                'flex h-11 w-full cursor-pointer items-center text-[15px] transition-colors',
                collapsed ? 'justify-center' : 'gap-2.5 py-0 pl-5 pr-3',
                active
                  ? 'bg-primary/5 font-medium text-primary'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5',
              )}
              onClick={() => {
                onMenuSelect?.(m.key)
                onMobileClose()
                onSelect?.()
              }}
            >
              <Icon size={16} className="shrink-0 opacity-70" />
              {!collapsed && <span className="flex-1 truncate text-left">{m.label}</span>}
            </button>
          )
        })}

        {/* 默认分类树模式（主页） */}
        {!menu &&
          navs.map((one: INavProps, i: number) => {
          const oneActive = one.id === currentOneId
          const isOpen = expanded.has(one.id)
          const Icon = MENU_ICONS[i % MENU_ICONS.length]
          return (
            <div key={one.id}>
              <button
                title={collapsed ? one.title : undefined}
                className={cn(
                  'flex h-11 w-full cursor-pointer items-center text-[15px] transition-colors',
                  collapsed ? 'justify-center' : 'gap-2.5 py-0 pl-5 pr-3',
                  oneActive
                    ? 'bg-primary/5 font-medium text-primary'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5',
                )}
                onClick={() => {
                  setExpanded(new Set([one.id]))
                  const firstTwo = one.nav?.[0]
                  window.location.hash = firstTwo ? `/?id=${firstTwo.id}` : `/?id=${one.id}`
                  onMobileClose()
                  onSelect?.()
                }}
              >
                <Icon size={16} className="shrink-0 opacity-70" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate text-left">{one.title}</span>
                    {one.ownVisible && <Lock size={12} className="shrink-0 text-amber-500" />}
                    <ChevronDown
                      size={14}
                      className={cn(
                        'shrink-0 text-zinc-400 transition-transform duration-300',
                        !isOpen && '-rotate-90',
                      )}
                      onClick={(e) => {
                        // 箭头单独点击：仅展开/收起，不跳转
                        e.stopPropagation()
                        setExpanded((s) => {
                          const next = new Set(s)
                          next.has(one.id) ? next.delete(one.id) : next.add(one.id)
                          return next
                        })
                      }}
                    />
                  </>
                )}
              </button>

              {/* 二级菜单：展开/收起动画（grid-rows 过渡）；侧栏收起时强制隐藏 */}
              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-300 ease-in-out',
                  isOpen && !collapsed ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div className="overflow-hidden">
                  {(one.nav || []).map((two: INavTwoProp) => {
                    const twoActive = two.id === currentTwoId
                    return (
                      <button
                        key={two.id}
                        className={cn(
                          'flex h-10 w-full cursor-pointer items-center border-l-2 py-0 pl-[52px] pr-3 text-sm transition-colors',
                          twoActive
                            ? 'border-primary font-medium text-primary'
                            : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200',
                        )}
                        onClick={() => {
                          window.location.hash = `/?id=${two.id}`
                          onMobileClose()
                          onSelect?.()
                        }}
                      >
                        <span className="flex-1 truncate text-left">{two.title}</span>
                        {two.ownVisible && <Lock size={11} className="shrink-0 text-amber-500" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      {/* 底部固定入口（对齐参考站 sidebar-footer） */}
      <div className="border-t border-zinc-200 py-2 dark:border-zinc-700/70">
        {/* 退出登录（后台管理页 + 已登录时显示，位于后台管理按钮上方） */}
        {showLogout && isLogin && (
          <button
            title={collapsed ? '退出登录' : undefined}
            className={cn(
              'flex h-10 w-full cursor-pointer items-center text-sm text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-400',
              collapsed ? 'justify-center' : 'gap-2.5 pl-5 pr-3',
            )}
            onClick={() => setConfirmLogout(true)}
          >
            <LogOut size={15} className="shrink-0 opacity-70" />
            {!collapsed && <span className="flex-1 truncate text-left">退出登录</span>}
          </button>
        )}

        {/* 后台管理页：显示返回主页；主页：显示后台管理入口 */}
        {menu ? (
          <button
            title={collapsed ? '返回主页' : undefined}
            className={cn(
              'flex h-10 w-full cursor-pointer items-center text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200',
              collapsed ? 'justify-center' : 'gap-2.5 pl-5 pr-3',
            )}
            onClick={() => {
              navigate('/')
              onMobileClose()
            }}
          >
            <House size={15} className="shrink-0 opacity-70" />
            {!collapsed && <span className="flex-1 truncate text-left">返回主页</span>}
          </button>
        ) : (
          <button
            title={collapsed ? '后台管理' : undefined}
            className={cn(
              'flex h-10 w-full cursor-pointer items-center text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200',
              collapsed ? 'justify-center' : 'gap-2.5 pl-5 pr-3',
            )}
            onClick={goSystem}
          >
            <Settings size={15} className="shrink-0 opacity-70" />
            {!collapsed && <span className="flex-1 truncate text-left">后台管理</span>}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* 桌面端固定侧栏（展开 220px / 收起仅图标 64px，从页面顶部贯通到底部） */}
      <aside
        className={cn(
          'fixed bottom-0 left-0 top-0 z-30 hidden overflow-hidden border-r border-zinc-200 bg-white transition-[width] duration-300 ease-in-out md:block dark:border-zinc-700/70 dark:bg-[#161616]',
          desktopOpen ? 'w-[220px]' : 'w-16',
        )}
      >
        {nav(!desktopOpen)}
      </aside>

      {/* 移动端抽屉 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="absolute bottom-0 left-0 top-0 w-64 border-r border-zinc-200 bg-white dark:border-zinc-700/70 dark:bg-zinc-800">
            <button
              className="absolute right-2 top-2 cursor-pointer rounded p-1 text-zinc-400"
              onClick={onMobileClose}
            >
              <X size={18} />
            </button>
            {nav(false)}
          </aside>
        </div>
      )}

      <ConfirmModal
        open={confirmLogout}
        title="退出登录"
        content="确定要退出当前账号吗？"
        onConfirm={() => {
          setConfirmLogout(false)
          useNavStore.getState().logout()
          window.location.hash = '#/'
          window.location.reload()
        }}
        onClose={() => setConfirmLogout(false)}
      />
    </>
  )
}
