// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// Side 主题主页（参考 WebStack-Hugo 布局）：
// 固定顶栏（透明→滚动毛玻璃）+ 可收起侧栏 + DNA 背景 Hero（内嵌搜索）+ 卡片内容区。

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useNavStore } from '@/store/useNavStore'
import { useModalStore } from '@/store/useModalStore'
import { getClassById } from '@/lib/dfs'
import { fuzzySearch } from '@/lib/utils'
import { SearchType } from '@/types/nav'
import type { IWebProps } from '@/types/nav'
import Sidebar from '@/components/Sidebar'
import SearchBar from '@/components/SearchBar'
import PinnedList from '@/components/PinnedList'
import ClassTabs from '@/components/ClassTabs'
import WebGroups from '@/components/WebGroups'
import Card from '@/components/Card'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import BackTop from '@/components/BackTop'
import EditWebModal from '@/components/EditWebModal'
import EditClassModal from '@/components/EditClassModal'
import MoveWebModal from '@/components/MoveWebModal'
import { toast } from '@/store/toast'

export default function Home() {
  const [params] = useSearchParams()
  const navs = useNavStore((s) => s.navs)
  const settings = useNavStore((s) => s.settings)
  const isLogin = useNavStore((s) => s.isLogin)
  const openEditWeb = useModalStore((s) => s.openEditWeb)

  const q = params.get('q') || ''
  const sType = (Number(params.get('type')) || SearchType.All) as SearchType

  // 当前选中分类：URL ?id= → localStorage 记忆 → 默认第一个
  const id = useMemo(() => {
    const paramId = params.get('id')
    if (paramId && getClassById(navs, paramId).breadcrumb.length) {
      return Number(paramId)
    }
    try {
      const loc = localStorage.getItem('location')
      if (loc) {
        const localId = JSON.parse(loc)?.id
        if (localId && getClassById(navs, localId).breadcrumb.length) return localId
      }
    } catch {
      /* ignore */
    }
    return navs[0]?.nav?.[0]?.id ?? navs[0]?.id
  }, [params, navs])

  useEffect(() => {
    if (id != null) {
      localStorage.setItem('location', JSON.stringify({ id }))
    }
  }, [id])

  const { oneIndex, twoIndex } = getClassById(navs, id)
  const currentTwo = navs[oneIndex]?.nav?.[twoIndex]
  const tagList = useNavStore((s) => s.tagList)
  const groups = useMemo(() => (q ? [] : currentTwo?.nav || []), [q, currentTwo])
  const searchResults = useMemo(() => {
    if (!q) return []
    // 「当前」：仅在当前二级分类内搜索
    if (sType === SearchType.Current) {
      return fuzzySearch(currentTwo?.nav || [], q, SearchType.All)
    }
    return fuzzySearch(navs, q, sType, { tagList })
  }, [q, sType, navs, currentTwo, tagList])

  // 侧栏展开/收起（桌面收起为滑出，移动端为抽屉）
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(true)
    } else {
      setSidebarOpen((v) => !v)
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
      if (!useNavStore.getState().permissions().create) return
      openEditWeb(undefined, groups[0]?.id)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [settings.createWebKey, isLogin, groups, openEditWeb])

  return (
    <div className="min-h-full">
      <Sidebar
        currentOneId={navs[oneIndex]?.id}
        currentTwoId={currentTwo?.id}
        desktopOpen={sidebarOpen}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
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
        <div className="flex flex-col gap-4 px-2.5 pb-6 pt-5">
          {q ? (
            <SearchResults results={searchResults} keyword={q} cardStyle={settings.sideCardStyle} />
          ) : (
            <>
              <PinnedList />
              {groups.length > 0 && <ClassTabs groups={groups} />}
              <WebGroups groups={groups} cardStyle={settings.sideCardStyle} />
            </>
          )}

          <Footer />
        </div>
      </main>

      <BackTop />

      {/* 全局编辑弹窗 */}
      <EditWebModal />
      <EditClassModal />
      <MoveWebModal />
    </div>
  )
}

function SearchResults({
  results,
  keyword,
  cardStyle,
}: {
  results: IWebProps[]
  keyword: string
  cardStyle: any
}) {
  if (results.length === 0) {
    return <div className="py-16 text-center text-sm text-zinc-400">未找到「{keyword}」相关网站</div>
  }
  return (
    <div>
      <div className="mb-2 text-xs text-zinc-400">
        共 {results.length} 条与「{keyword}」相关的结果
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {results.map((web) => (
          <Card key={web.id} web={web} cardStyle={cardStyle} keyword={keyword} />
        ))}
      </div>
    </div>
  )
}
