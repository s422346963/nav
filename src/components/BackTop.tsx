// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 回到顶部悬浮按钮（右下角，滚动超过 200px 显示）。

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BackTop() {
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 200)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!showTop) return null

  return (
    <button
      className="fixed bottom-6 right-6 z-40 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-green-600 shadow-md transition-colors hover:bg-green-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
      title="回到顶部"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ArrowUp size={17} />
    </button>
  )
}
