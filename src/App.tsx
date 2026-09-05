// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。

import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useNavStore } from '@/store/useNavStore'
import { ToastHost } from '@/components/ui'
import Home from '@/pages/Home'
import System from '@/pages/System'

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
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        加载中...
      </div>
    )
  }

  return (
    <HashRouter>
      <ToastHost />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/system" element={<System />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
