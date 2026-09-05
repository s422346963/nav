// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 极简 UI 原语（Button/Input/Select/Modal/Toast/Confirm），替代 shadcn 生成组件。

import React, { useEffect, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toast'

export function Button({
  variant = 'default',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
}) {
  const variantCls =
    variant === 'primary'
      ? 'nz-btn-primary'
      : variant === 'danger'
        ? 'nz-btn-danger'
        : variant === 'ghost'
          ? 'border-transparent bg-transparent hover:bg-zinc-200/60 hover:text-inherit dark:hover:bg-zinc-700/60'
          : ''
  return <button className={cn('nz-btn', variantCls, className)} {...props} />
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="nz-input" {...props} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="nz-input" rows={3} {...props} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="nz-input" {...props} />
}

export function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="nz-label">{label}</label>
      {children}
    </div>
  )
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  width = 'max-w-lg',
  centered = false,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string
  /** 屏幕垂直居中展示（确认类小弹窗使用）；默认顶部对齐（表单类长弹窗） */
  centered?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex justify-center overflow-y-auto bg-black/50 p-4',
        centered ? 'items-center' : 'items-start pt-[8vh]',
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn(
          'w-full rounded-xl bg-white shadow-2xl dark:bg-zinc-800',
          width,
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-700">
          <h3 className="text-base font-medium">{title}</h3>
          <button
            className="cursor-pointer rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-3 dark:border-zinc-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 图标地址输入栏：左侧图标预览（留空时按 URL 取 favicon，失败显示首字）
 * + 右侧上传按钮（选择文件后回调 onFile，由调用方负责上传并回填地址）。
 */
export function IconInput({
  value,
  onChange,
  onFile,
  uploading = false,
  placeholder = 'https://...',
}: {
  value?: string
  onChange: (url: string) => void
  /** 传入后显示上传按钮；选择文件时回调 */
  onFile?: (file: File) => void
  uploading?: boolean
  placeholder?: string
}) {
  const [err, setErr] = useState(false)

  useEffect(() => {
    setErr(false)
  }, [value])

  const host = (() => {
    if (!value) return ''
    try {
      return new URL(value.replace(/^[^\w]+/, '')).hostname
    } catch {
      return ''
    }
  })()
  const src = value || (host ? `https://www.google.com/s2/favicons?domain=${host}&sz=64` : '')

  return (
    <div className="flex h-9 w-full items-stretch overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-colors focus-within:border-primary dark:border-zinc-700/70 dark:bg-zinc-800">
      {/* 前缀：图标预览 */}
      <div className="flex w-10 shrink-0 items-center justify-center border-r border-zinc-200 dark:border-zinc-700/70">
        {src && !err ? (
          <img
            src={src}
            className="h-6 w-6 object-contain"
            alt=""
            onError={() => setErr(true)}
          />
        ) : (
          <span className="text-sm font-medium text-zinc-400">?</span>
        )}
      </div>

      <input
        className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />

      {/* 后缀：上传按钮 */}
      {onFile && (
        <label
          className={cn(
            'flex shrink-0 items-center gap-1 border-l border-zinc-200 px-3 text-xs text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-primary dark:border-zinc-700/70 dark:text-zinc-400 dark:hover:bg-zinc-700/50',
            uploading ? 'cursor-wait opacity-60' : 'cursor-pointer',
          )}
          title="上传图标"
        >
          <Upload size={13} />
          {uploading ? '上传中' : '上传'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) onFile(file)
            }}
          />
        </label>
      )}
    </div>
  )
}

/** 加载态：三点脉冲 + 可选文案（与 index.html 启动动画同款） */
export function Loading({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center gap-5">
      <div className="loading-dots">
        <div></div>
        <div></div>
        <div></div>
      </div>
      {text && <span className="text-sm text-zinc-500 dark:text-zinc-400">{text}</span>}
    </div>
  )
}

export function ConfirmModal({
  open,
  title,
  content,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  content: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      width="max-w-sm"
      centered
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            确定
          </Button>
        </>
      }
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{content}</p>
    </Modal>
  )
}

/** 网站图标：空图标 / 加载失败时回退为首字母色块，避免 <img src=""> 请求页面自身 */
export function WebIcon({
  src,
  name,
  size = 32,
  className,
}: {
  src?: string
  name: string
  size?: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'
  const style = { width: size, height: size }

  if (!src || failed) {
    return (
      <span
        className={cn(
          'flex shrink-0 select-none items-center justify-center rounded bg-gradient-to-br from-sky-400 to-indigo-500 text-xs font-bold text-white',
          className,
        )}
        style={style}
      >
        {initial}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className={cn('shrink-0 rounded object-contain', className)}
      style={style}
      onError={() => setFailed(true)}
    />
  )
}

const toastColors: Record<string, string> = {
  success: 'border-emerald-400 text-emerald-600 dark:text-emerald-400',
  error: 'border-red-400 text-red-600 dark:text-red-400',
  warning: 'border-amber-400 text-amber-600 dark:text-amber-400',
  info: 'border-sky-400 text-sky-600 dark:text-sky-400',
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  const remove = useToastStore((s) => s.remove)
  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[200] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto rounded-lg border-l-4 bg-white px-4 py-2.5 text-sm shadow-lg dark:bg-zinc-800',
            toastColors[t.type],
          )}
          onClick={() => remove(t.id)}
        >
          {t.content}
        </div>
      ))}
    </div>
  )
}
