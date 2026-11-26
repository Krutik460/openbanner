import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { StaticBanner } from '@/canvas/StaticBanner'
import { BANNER } from '@/lib/constants'
import type { BannerDoc } from '@/lib/types'
import { openInEditor } from '@/store/persistence'
import { requestProfileEdit } from '../editor/ProfileDetails'

export const REPO_URL = 'https://github.com/Krutik460/openbanner'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Tracks an element's width in whole CSS pixels. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current!
    const observer = new ResizeObserver(() => setWidth(Math.floor(el.clientWidth)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

/** Set while a transition into the editor is under way, so a double click cannot open two designs. */
let entering = false

/**
 * Opens the editor on `doc`. Where the browser supports view transitions, the
 * banner the visitor clicked (`from`) flies to its place in the editor, along
 * with the skeleton's photo when it is on screen. `editProfile` puts the cursor
 * in the name field, or points at the photo button, on arrival.
 */
export function enterEditor(doc: BannerDoc, { from, editProfile }: { from?: HTMLElement | null; editProfile?: 'name' | 'photo' } = {}) {
  if (entering) return
  if (editProfile) requestProfileEdit(editProfile)
  const go = () => openInEditor(doc)
  if (!document.startViewTransition || prefersReducedMotion()) return go()
  entering = true
  if (from) from.style.viewTransitionName = 'banner'
  const photo = document.querySelector<HTMLElement>('[data-skeleton-photo]')
  if (photo && onScreen(photo)) photo.style.viewTransitionName = 'avatar'
  // Rendering is paused while this callback runs, so the editor fits itself synchronously on mount.
  const transition = document.startViewTransition(() => flushSync(go))
  void transition.finished.finally(() => (entering = false))
}

function onScreen(el: HTMLElement): boolean {
  const box = el.getBoundingClientRect()
  return box.bottom > 0 && box.top < window.innerHeight && box.right > 0 && box.left < window.innerWidth
}

/** A template rendered as a banner thumbnail that fills its container's width. */
export function BannerThumb({ doc, className }: { doc: Pick<BannerDoc, 'background' | 'elements'>; className?: string }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  return (
    <div ref={ref} className={className} style={{ aspectRatio: `${BANNER.width} / ${BANNER.height}` }}>
      {width > 0 && <StaticBanner doc={doc} width={width} />}
    </div>
  )
}
