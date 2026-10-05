// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。

import { lazy, Suspense, useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { useNavStore } from '@/store/useNavStore'
import { Loading, ToastHost } from '@/components/ui'

// 路由级代码分割：前台三页 / 后台 / 登录按需加载
const Home = lazy(() => import('@/pages/Home'))
const Search = lazy(() => import('@/pages/Search'))
const Nav = lazy(() => import('@/pages/Nav'))
const System = lazy(() => import('@/pages/System'))
const Login = lazy(() => import('@/pages/Login'))

export default function App() {
  const init = useNavStore((s) => s.init)
  const loaded = useNavStore((s) => s.loaded)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    init().catch((e) => {
      console.error(e)
      setFailed(true)
    })
  }, [init])

  // 空闲时预取其余前台页面：三个页面都是懒加载且 Suspense 在最外层，
  // 不预取的话刷新后首次点菜单会挂起整页（侧栏也被替换成 Loading），表现为卡顿/白闪
  useEffect(() => {
    if (!loaded) return
    const prefetch = () => {
      void import('@/pages/Search')
      void import('@/pages/Nav')
    }
    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(prefetch, { timeout: 2000 })
      return () => window.cancelIdleCallback(idleId)
    }
    const timer = window.setTimeout(prefetch, 300)
    return () => window.clearTimeout(timer)
  }, [loaded])

  if (failed) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        数据加载失败，请刷新重试
      </div>
    )
  }

  if (!loaded) {
    return <Loading />
  }

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastHost />
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* 前台三页：首页（搜索 + 收藏）/ 搜索结果 / 分类卡片 */}
          <Route path="/" element={<LegacyHome />} />
          <Route path="/search" element={<Search />} />
          <Route path="/nav" element={<Nav />} />
          <Route path="/login" element={<Login />} />
          <Route path="/system" element={<Navigate to="/system/web" replace />} />
          <Route path="/system/:tab" element={<System />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

/** 首页入口：兼容拆分路由前的旧地址（#/?id=xx → /nav?id=xx，#/?q=xx → /search?q=xx） */
function LegacyHome() {
  const [params] = useSearchParams()
  if (params.get('q')) {
    return <Navigate to={`/search?${new URLSearchParams(params).toString()}`} replace />
  }
  const id = params.get('id')
  if (id) {
    return <Navigate to={`/nav?id=${encodeURIComponent(id)}`} replace />
  }
  return <Home />
}
