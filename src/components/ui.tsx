// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 极简 UI 原语（Button/Input/Select/Modal/Toast/Confirm），替代 shadcn 生成组件。

import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
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
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string
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
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[8vh]"
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
