import { useRef } from 'react'
import { Camera, UserRound } from 'lucide-react'
import { toAvatarDataUrl } from '@/lib/assets'
import type { Profile } from '@/lib/types'
import { initials } from '@/lib/util'

export function Avatar({ profile, size }: { profile: Pick<Profile, 'name' | 'avatar'> | null; size: number }) {
  return profile?.avatar ? (
    <img src={profile.avatar} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-[#D9E0E7] font-semibold text-[#5B6B7B]" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials(profile?.name ?? '') || <UserRound style={{ width: size * 0.5, height: size * 0.5 }} />}
    </span>
  )
}

const field = 'w-full rounded-lg border border-line bg-app px-3 py-2 text-[13px] placeholder:text-subtle transition-colors focus:border-line-strong'

/** Name, headline and photo: what the profile preview and the templates are built from. */
export function ProfileFields({ profile, onChange }: { profile: Profile; onChange: (profile: Profile) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const pickPhoto = async (file: File | undefined) => {
    if (!file) return
    try {
      onChange({ ...profile, avatar: await toAvatarDataUrl(file) })
    } catch {
      // Not a readable image; keep the current photo.
    }
  }
  return (
    <div className="flex gap-4">
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => (pickPhoto(e.target.files?.[0]), (e.target.value = ''))} />
      <button type="button" onClick={() => fileRef.current?.click()} aria-label="Change photo" className="group relative mt-5 size-16 shrink-0 self-start rounded-full">
        <Avatar profile={profile} size={64} />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Camera className="size-5 text-white" />
        </span>
      </button>
      <div className="min-w-0 flex-1 space-y-2">
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Name</span>
          <input className={field} placeholder="Your name" value={profile.name} onChange={(e) => onChange({ ...profile, name: e.target.value })} autoComplete="name" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Headline</span>
          <textarea
            className={`${field} resize-none`}
            rows={2}
            placeholder="Product designer at Northwind | Speaker"
            value={profile.headline}
            onChange={(e) => onChange({ ...profile, headline: e.target.value })}
          />
        </label>
      </div>
    </div>
  )
}
