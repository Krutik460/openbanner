import clsx from 'clsx'
import { CircleAlert } from 'lucide-react'
import { useToasts } from '@/store/toasts'

export function Toaster() {
  const { toasts, dismiss } = useToasts()
  return (
    <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-16 z-30 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'pointer-events-auto flex h-10 max-w-full animate-pop items-center gap-3 rounded-full bg-fg pr-1.5 pl-4 text-[13px] font-medium text-white shadow-pop',
            !t.action && 'pr-4',
          )}
        >
          {t.tone === 'error' && <CircleAlert className="size-4 shrink-0 text-[#ff9b93]" />}
          <span className="truncate">{t.message}</span>
          {t.action && (
            <button
              type="button"
              onClick={() => (t.action!.run(), dismiss(t.id))}
              className="h-7 shrink-0 rounded-full bg-white/15 px-3 text-xs font-semibold text-white transition-colors hover:bg-white/25"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
