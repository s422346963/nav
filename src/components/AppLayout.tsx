// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 前台通用布局：可收起侧栏 + 固定顶栏 + DNA 背景 Hero（内嵌搜索框）+ 内容区。
// 首页 / 搜索 / 分类三个页面共用，页面只负责内容区与侧栏选中态。

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNavStore } from '@/store/useNavStore'
import { useModalStore } from '@/store/useModalStore'
import { useUiStore } from '@/store/useUiStore'
import { toast } from '@/store/toast'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import SearchBar from '@/components/SearchBar'
import BackTop from '@/components/BackTop'
import EditWebModal from '@/components/EditWebModal'
import EditClassModal from '@/components/EditClassModal'
import MoveWebModal from '@/components/MoveWebModal'

export default function AppLayout({
  children,
  currentOneId,
  currentTwoId,
  homeActive = false,
  defaultParentId,
}: {
  children: ReactNode
  /** 侧栏一级 / 二级高亮 */
  currentOneId?: number
  currentTwoId?: number
  /** 侧栏顶部「首页」入口高亮 */
  homeActive?: boolean
  /** 快捷键新增网站时的默认父分类 id */
  defaultParentId?: number
}) {
  const navigate = useNavigate()
  const settings = useNavStore((s) => s.settings)
  const isLogin = useNavStore((s) => s.isLogin)
  const openEditWeb = useModalStore((s) => s.openEditWeb)

  // 侧栏展开/收起：桌面端状态放 store（切换路由不重置），移动端抽屉仍用局部 state
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const toggleSidebarOpen = useUiStore((s) => s.toggleSidebar)
  const setExpandedOneIds = useUiStore((s) => s.setExpandedOneIds)
  const [mobileOpen, setMobileOpen] = useState(false)

  // 进入没有「当前分类」的页面（首页 / 无来源分类的搜索页）时收起全部分类，不残留上次展开的菜单
  useEffect(() => {
    if (currentOneId == null) setExpandedOneIds([])
  }, [currentOneId, setExpandedOneIds])

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(true)
    } else {
      toggleSidebarOpen()
    }
  }

  // 快捷键新增网站（createWebKey，默认 E）
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key.toLowerCase() !== (settings.createWebKey || 'E').toLowerCase()) return
      if (!isLogin) {
        toast.info('登录后才能添加网站')
        return
      }
      openEditWeb(undefined, defaultParentId)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [settings.createWebKey, isLogin, defaultParentId, openEditWeb])

  return (
    <div className="min-h-full">
      <Sidebar
        currentOneId={currentOneId}
        currentTwoId={currentTwoId}
        desktopOpen={sidebarOpen}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        homeActive={homeActive}
        onHomeSelect={() => navigate('/')}
      />

      <Header onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

      <main
        className={`transition-[padding] duration-300 ease-in-out ${
          sidebarOpen ? 'md:pl-[220px]' : 'md:pl-16'
        }`}
      >
        {/* DNA 背景 Hero：内嵌大搜索框 */}
        <section className="relative flex min-h-[220px] items-center justify-center overflow-hidden py-10 md:min-h-[280px]">
          <img
            src="/bg-dna.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* 轻微暗角，保证搜索框对比度 */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-white/40 dark:from-black/30 dark:to-black/20" />
          <div className="relative z-10 w-full max-w-[560px] px-4">
            <SearchBar />
          </div>
        </section>

        {/* 内容区 */}
        <div className="flex flex-col gap-4 px-2.5 pb-6 pt-5">{children}</div>
      </main>

      <BackTop />

      {/* 全局编辑弹窗 */}
      <EditWebModal />
      <EditClassModal />
      <MoveWebModal />
    </div>
  )
}
