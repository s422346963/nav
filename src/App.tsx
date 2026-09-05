// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。

import { lazy, Suspense, useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useNavStore } from '@/store/useNavStore'
import { Loading, ToastHost } from '@/components/ui'

// 路由级代码分割：前台 / 后台 / 登录按需加载
const Home = lazy(() => import('@/pages/Home'))
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
    <HashRouter>
      <ToastHost />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/system" element={<Navigate to="/system/web" replace />} />
          <Route path="/system/:tab" element={<System />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
