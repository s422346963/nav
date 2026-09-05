// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 系统管理后台（对应原 /system 路由）：网站管理 / 书签导入导出 / 设置。
// 布局与主页一致：左侧全高侧边栏 + 右侧顶栏（汉堡/主页/主题）。

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bookmark, LayoutList, LogOut, Settings } from 'lucide-react'
import { useNavStore } from '@/store/useNavStore'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import WebPanel from './system/WebPanel'
import BookmarkPanel from './system/BookmarkPanel'
import SettingsPanel from './system/SettingsPanel'

const TABS = [
  { key: 'web', label: '网站管理', icon: LayoutList },
  { key: 'bookmark', label: '书签导入 / 导出', icon: Bookmark },
  { key: 'setting', label: '设置', icon: Settings },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function System() {
  const [params] = useSearchParams()
  const initTab = (TABS.find((t) => t.key === params.get('tab'))?.key || 'web') as TabKey
  const [tab, setTab] = useState<TabKey>(initTab)
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
        onMenuSelect={(key) => setTab(key as TabKey)}
      />

      <Header onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} tone="light" />

      <main
        className={`transition-[padding] duration-300 ease-in-out ${
          sidebarOpen ? 'md:pl-[220px]' : 'md:pl-16'
        }`}
      >
        <div className="mx-auto max-w-5xl px-4 py-4">
          {/* 页头：标题 + 退出登录 */}
          <div className="mb-4 flex h-10 items-center justify-between">
            <h1 className="text-base font-semibold">系统管理</h1>
            {isLogin && (
              <button
                className="flex cursor-pointer items-center gap-1 text-xs text-zinc-500 hover:text-red-500"
                title="退出登录"
                onClick={() => {
                  useNavStore.getState().logout()
                  window.location.hash = '#/'
                  window.location.reload()
                }}
              >
                <LogOut size={14} /> 退出登录
              </button>
            )}
          </div>

          {tab === 'web' && <WebPanel />}
          {tab === 'bookmark' && <BookmarkPanel />}
          {tab === 'setting' && <SettingsPanel />}
        </div>
      </main>
    </div>
  )
}
