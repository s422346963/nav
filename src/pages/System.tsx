// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 系统管理后台（对应原 /system 路由）：网站管理 / 书签导入导出 / 设置 / 网站信息。
// 路由：/system/web 等子路径区分页签；未登录跳转 /login。
// 布局与主页一致：左侧全高侧边栏 + 右侧顶栏（汉堡/主页/主题）。

import { lazy, Suspense, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Bookmark, Info, LayoutList, Settings } from 'lucide-react'
import { useNavStore } from '@/store/useNavStore'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Loading } from '@/components/ui'

// 后台四个页签按需加载，避免全部打进后台首屏
const WebPanel = lazy(() => import('./system/WebPanel'))
const BookmarkPanel = lazy(() => import('./system/BookmarkPanel'))
const SettingsPanel = lazy(() => import('./system/SettingsPanel'))
const InfoPanel = lazy(() => import('./system/InfoPanel'))

const TABS = [
  { key: 'web', label: '网站管理', icon: LayoutList },
  { key: 'setting', label: '网站设置', icon: Settings },
  { key: 'info', label: '网站信息', icon: Info },
  { key: 'bookmark', label: '书签导入', icon: Bookmark },

] as const

type TabKey = (typeof TABS)[number]['key']

export default function System() {
  const { tab: tabParam } = useParams()
  const navigate = useNavigate()
  // 路由参数决定当前页签：/system/web、/system/setting、/system/info、/system/bookmark
  const tab = ((TABS as readonly { key: string }[]).some((t) => t.key === tabParam)
    ? tabParam
    : 'web') as TabKey
  const isLogin = useNavStore((s) => s.isLogin)

  // 侧栏展开/收起（与主页一致：桌面收起为仅图标，移动端为抽屉）
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(true)
    } else {
      setSidebarOpen((v) => !v)
    }
  }

  // 未登录跳转登录页
  if (!isLogin) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-full">
      <Sidebar
        currentOneId={undefined}
        currentTwoId={undefined}
        desktopOpen={sidebarOpen}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        menu={TABS.map((t) => ({ key: t.key, label: t.label, icon: t.icon }))}
        activeMenuKey={tab}
        onMenuSelect={(key) => navigate(`/system/${key}`)}
        showLogout
      />

      <Header onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} tone="light" />

      <main
        className={`transition-[padding] duration-300 ease-in-out ${
          sidebarOpen ? 'md:pl-[220px]' : 'md:pl-16'
        }`}
      >
        <div className="w-full px-4 pb-10 pt-20 md:px-8">
          <Suspense fallback={<Loading />}>
            {tab === 'web' && <WebPanel />}
            {tab === 'bookmark' && <BookmarkPanel />}
            {tab === 'setting' && <SettingsPanel />}
            {tab === 'info' && <InfoPanel />}
          </Suspense>
        </div>
      </main>
    </div>
  )
}
