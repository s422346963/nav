// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 书签导入 / 导出（对应原 system/bookmark 与 bookmark-export）。

import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { useNavStore } from '@/store/useNavStore'
import { initTempId, parseBookmark, exportBookmark, downloadFile } from '@/lib/bookmark'
import { cleanWebAttrs } from '@/lib/dfs'
import { Button, ConfirmModal } from '@/components/ui'
import { toast } from '@/store/toast'

export default function BookmarkPanel() {
  const navs = useNavStore((s) => s.navs)
  const replaceNavs = useNavStore((s) => s.replaceNavs)
  const nextId = useNavStore((s) => s.nextId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirm, setConfirm] = useState<{ html: string } | null>(null)

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setConfirm({ html: reader.result as string })
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  const doImport = (html: string) => {
    try {
      initTempId(nextId())
      const merged = parseBookmark(html, navs)
      replaceNavs(merged)
      toast.success('导入成功（增量合并，未覆盖现有数据）')
    } catch (err: any) {
      toast.error(`导入失败：${err.message}`)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="mb-2 text-sm font-medium">导入浏览器书签</h3>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          选择浏览器导出的 Netscape 书签 HTML 文件（Chrome/Edge/Firefox：书签管理器 → 导出书签）。
          导入采用<strong className="mx-1">增量合并</strong>：按分类名 / 网址去重，不会覆盖现有数据。
        </p>
        <input ref={fileRef} type="file" accept=".html" hidden onChange={onFile} />
        <Button variant="primary" onClick={() => fileRef.current?.click()}>
          <Upload size={14} /> 选择书签文件
        </Button>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium">导出</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              downloadFile('bookmarks.html', exportBookmark(navs))
              toast.success('已导出书签 HTML')
            }}
          >
            <Download size={14} /> 导出书签 HTML
          </Button>
          <Button
            onClick={() => {
              downloadFile(
                'db.json',
                JSON.stringify(cleanWebAttrs(navs), null, 4),
                'application/json',
              )
              toast.success('已导出 db.json 备份')
            }}
          >
            <Download size={14} /> 导出数据 JSON
          </Button>
        </div>
      </section>

      <ConfirmModal
        open={!!confirm}
        title="确认导入"
        content="导入将与现有数据增量合并，确定继续吗？"
        onConfirm={() => confirm && doImport(confirm.html)}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}
