// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 页脚（对应原 footer）：渲染 sideFooterHTML，支持 ${year}/${hostname} 插值。

import { useNavStore } from '@/store/useNavStore'

export default function Footer() {
  const settings = useNavStore((s) => s.settings)
  const html = settings.sideFooterHTML || settings.footerContent
  // 未配置页脚 HTML 时不渲染任何内容（按需求去掉默认 Copyright）
  if (!html) return null
  const rendered = html
    .replace(/\$\{year\}/g, String(new Date().getFullYear()))
    .replace(/\$\{hostname\}/g, window.location.hostname)
  return (
    <footer
      className="py-6 text-center text-xs text-zinc-400 [&_a]:text-zinc-400 [&_a:hover]:text-primary"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  )
}
