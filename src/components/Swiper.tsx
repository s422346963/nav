// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 顶部轮播（对应原 swiper），仅 sideThemeImages 非空且 height > 0 时渲染。

import { useEffect, useState } from 'react'
import type { ImageProps } from '@/types/nav'
import { useNavigate } from 'react-router-dom'

export default function Swiper({
  images,
  autoplay,
  height,
}: {
  images: ImageProps[]
  autoplay: boolean
  height: number
}) {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (!autoplay || images.length <= 1) return
    const timer = setInterval(
      () => setCurrent((c) => (c + 1) % images.length),
      4000,
    )
    return () => clearInterval(timer)
  }, [autoplay, images.length])

  // 未配置高度时使用默认 193px（对齐原版 banner 实测高度）
  const finalHeight = height > 0 ? height : 193

  if (images.length === 0) return null

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: finalHeight }}
    >
      {images.map((img, i) => (
        <img
          key={i}
          src={img.src}
          alt=""
          className={`absolute inset-0 h-full w-full cursor-pointer object-cover transition-opacity duration-700 ${
            i === current ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={() => img.url && (img.url.startsWith('@') ? navigate(img.url.slice(1)) : window.open(img.url))}
        />
      ))}
    </div>
  )
}
