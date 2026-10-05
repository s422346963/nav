// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 侧边分类导航（参考 WebStack-Hugo）：
// 图标 + 标题 + 折叠箭头的一级菜单、缩进二级菜单。
// 底部入口仅保留后台管理页的"返回主页"（后台管理/退出登录已移至顶栏）。
// 桌面端可通过顶栏汉堡按钮整体收起（滑出），移动端为抽屉。

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  Code2,
  FlaskConical,
  Gamepad2,
  House,
  Image,
  Lock,
  Newspaper,
  Plane,
  Star,
  Wrench,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useNavStore } from '@/store/useNavStore'
import { useUiStore } from '@/store/useUiStore'
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
  homeActive = false,
  onHomeSelect,
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
  /** 顶部固定「首页」入口是否选中（仅分类树模式显示） */
  homeActive?: boolean
  onHomeSelect?: () => void
}) {
  const navs = useNavStore((s) => s.navs)
  const settings = useNavStore((s) => s.settings)
  const navigate = useNavigate()
  // 已展开的一级分类放 store：切换路由不重置（局部 state 会随页面卸载丢失）
  const expandedOneIds = useUiStore((s) => s.expandedOneIds)
  const setExpandedOneIds = useUiStore((s) => s.setExpandedOneIds)
  const expandOne = useUiStore((s) => s.expandOne)
  const expanded = useMemo(() => new Set(expandedOneIds), [expandedOneIds])

  // 挂载后隔两帧再应用展开状态：首页 → 分类是路由切换，侧栏会重建，
  // 若首帧就按「已展开」渲染，grid-rows 没有起始值可用，过渡不会触发（表现为瞬间展开）
  const [animateOpen, setAnimateOpen] = useState(false)

  useEffect(() => {
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setAnimateOpen(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [])

  // 收起态悬停浮层：展示该一级分类下的二级菜单
  // 面板用 fixed 定位（视口坐标），避免被侧栏 overflow-hidden 与滚动容器裁剪
  const [flyout, setFlyout] = useState<{ id: number; top: number; left: number } | null>(null)
  const flyoutTimer = useRef<number | undefined>(undefined)

  const openFlyout = (id: number, el: HTMLElement) => {
    window.clearTimeout(flyoutTimer.current)
    const r = el.getBoundingClientRect()
    // 估算面板高度（标题 + 每项 36px + 内边距），超出视口时向上贴近
    const count = navs.find((n) => n.id === id)?.nav?.length ?? 0
    const est = 40 + count * 36
    const top = Math.max(72, Math.min(r.top, window.innerHeight - est - 12))
    setFlyout({ id, top, left: r.right })
  }

  const closeFlyout = (immediate = false) => {
    window.clearTimeout(flyoutTimer.current)
    if (immediate) {
      setFlyout(null)
      return
    }
    // 留出鼠标从按钮移入浮层的缓冲
    flyoutTimer.current = window.setTimeout(() => setFlyout(null), 120)
  }

  // 侧栏展开时关闭浮层
  useEffect(() => {
    if (desktopOpen) setFlyout(null)
  }, [desktopOpen])

  // 卸载清理定时器
  useEffect(() => () => window.clearTimeout(flyoutTimer.current), [])

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

  // 切换分类时默认展开当前一级（只跟随 currentOneId 变化，避免把用户手动收起又弹回来）
  useEffect(() => {
    if (currentOneId != null) expandOne(currentOneId)
  }, [currentOneId, expandOne])

  const nav = (collapsed: boolean) => (
    <div className="flex h-full flex-col">
      {brand(collapsed)}

      {/* 顶部固定「首页」入口：位于分类列表之上，不随分类滚动 */}
      {!menu && (
        <button
          title={collapsed ? '首页' : undefined}
          className={cn(
            'flex h-11 w-full shrink-0 cursor-pointer items-center text-[15px] transition-colors',
            collapsed ? 'justify-center' : 'gap-2.5 py-0 pl-5 pr-3',
            homeActive
              ? 'bg-primary/5 font-medium text-primary'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5',
          )}
          onClick={() => {
            onHomeSelect?.()
            onMobileClose()
            onSelect?.()
          }}
        >
          <House size={16} className="shrink-0 opacity-70" />
          {!collapsed && <span className="flex-1 truncate text-left">首页</span>}
        </button>
      )}

      <nav
        className="flex-1 overflow-y-auto py-3"
        // 滚动时浮层位置会失效，直接关闭（鼠标移动可重新触发）
        onScroll={collapsed ? () => closeFlyout(true) : undefined}
      >
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
          const children = one.nav || []
          // 收起态且有二级菜单：悬停显示浮层（取代原生 title 提示）
          const showFlyout = collapsed && children.length > 0
          return (
            <div
              key={one.id}
              onMouseEnter={
                showFlyout ? (e) => openFlyout(one.id, e.currentTarget) : undefined
              }
              // 滚动关闭后鼠标仍停在按钮上，轻微移动即可重新弹出
              onMouseMove={
                showFlyout
                  ? (e) => {
                      if (flyout?.id !== one.id) openFlyout(one.id, e.currentTarget)
                    }
                  : undefined
              }
              onMouseLeave={showFlyout ? () => closeFlyout() : undefined}
            >
              <button
                title={collapsed && !showFlyout ? one.title : undefined}
                className={cn(
                  'flex h-11 w-full cursor-pointer items-center text-[15px] transition-colors',
                  collapsed ? 'justify-center' : 'gap-2.5 py-0 pl-5 pr-3',
                  oneActive
                    ? 'bg-primary/5 font-medium text-primary'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5',
                )}
                onClick={() => {
                  setExpandedOneIds([one.id])
                  const firstTwo = one.nav?.[0]
                  window.location.hash = `/nav?id=${firstTwo ? firstTwo.id : one.id}`
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
                        setExpandedOneIds(
                          expanded.has(one.id)
                            ? expandedOneIds.filter((x) => x !== one.id)
                            : [...expandedOneIds, one.id],
                        )
                      }}
                    />
                  </>
                )}
              </button>

              {/* 二级菜单：展开/收起动画（grid-rows 过渡）；侧栏收起时强制隐藏 */}
              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-300 ease-in-out',
                  isOpen && !collapsed && animateOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div className="overflow-hidden">
                  {children.map((two: INavTwoProp) => {
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
                          window.location.hash = `/nav?id=${two.id}`
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

              {/* 收起态悬停浮层：浮层是分组 div 的子节点，鼠标移入不会触发分组的 mouseleave */}
              {showFlyout && flyout?.id === one.id && (
                <div
                  className="fixed z-[60] flex w-[138px] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white py-1.5 shadow-xl ring-1 ring-black/5 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-white/5"
                  style={{
                    top: flyout.top,
                    left: flyout.left,
                    maxHeight: `calc(100vh - ${flyout.top + 12}px)`,
                  }}
                  onMouseEnter={() => window.clearTimeout(flyoutTimer.current)}
                  onMouseLeave={() => closeFlyout()}
                >
                  <div className="flex shrink-0 items-center gap-2 px-3 pb-1 pt-0.5">
                    <Icon size={13} className="shrink-0 text-primary opacity-80" />
                    <span className="flex-1 truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {one.title}
                    </span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {children.map((two: INavTwoProp) => {
                      const twoActive = two.id === currentTwoId
                      return (
                        <button
                          key={two.id}
                          className={cn(
                            'flex h-9 w-full cursor-pointer items-center gap-2 border-l-2 px-3 text-sm transition-colors',
                            twoActive
                              ? 'border-primary bg-primary/5 font-medium text-primary'
                              : 'border-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-zinc-100',
                          )}
                          onClick={() => {
                            window.location.hash = `/nav?id=${two.id}`
                            closeFlyout(true)
                            onMobileClose()
                            onSelect?.()
                          }}
                        >
                          <span className="flex-1 truncate text-left">{two.title}</span>
                          {two.ownVisible && (
                            <Lock size={11} className="shrink-0 text-amber-500" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* 底部固定入口：返回主页（后台管理页）；后台管理/退出登录入口已移至顶栏 */}
      {menu && (
        <div className="border-t border-zinc-200 py-2 dark:border-zinc-700/70">
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
        </div>
      )}
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
    </>
  )
}
