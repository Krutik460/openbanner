import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ContextMenu } from 'radix-ui'
import { Circle, Group, Image as KImage, Layer, Line, Rect, Shape, Stage, Text, TextPath, Transformer } from 'react-konva'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { AVATAR, BANNER } from '@/lib/constants'
import type { BannerElement, Device, Profile } from '@/lib/types'
import { initials, round } from '@/lib/util'
import { useEditor } from '@/store/editor'
import { useView } from '@/store/view'
import { useFontVersion } from '@/lib/fonts'
import { FRAME_BAND, PHOTO_FRAMES, photoFrameLayout, type PhotoFrame } from '@/lib/photoFrame'
import { BackgroundNodes, ElementNode, type NodeBinder } from './BannerScene'
import { fitView } from './fit'
import { registerContent } from './registry'
import { snap, snapTargets, type Box, type Guide } from './snapping'
import { CanvasMenu } from './CanvasMenu'
import { TextEditor } from './TextEditor'
import { useImage } from './useImage'

const { width: W, height: H } = BANNER
const SELECT = '#0F6FEC'
const SNAP_PX = 6
/** Corner radius of the profile card on LinkedIn's desktop layout, in banner pixels. */
const CARD_RADIUS = 16

const SIDE_ANCHORS = ['middle-left', 'middle-right']
const CORNER_ANCHORS = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
const ALL_ANCHORS = [...CORNER_ANCHORS, ...SIDE_ANCHORS, 'top-center', 'bottom-center']

const isElementNode = (node: Konva.Node) => node.hasName('el')

function styleAnchor(anchor: Konva.Rect) {
  // Side handles become pills so corners (scale) and sides (stretch) read differently.
  if (anchor.hasName('middle-left') || anchor.hasName('middle-right')) {
    anchor.setAttrs({ width: 6, height: 20, offsetX: 3, offsetY: 10, cornerRadius: 3 })
  } else if (anchor.hasName('top-center') || anchor.hasName('bottom-center')) {
    anchor.setAttrs({ width: 20, height: 6, offsetX: 10, offsetY: 3, cornerRadius: 3 })
  } else if (anchor.hasName('rotater')) {
    anchor.setAttrs({ width: 14, height: 14, offsetX: 7, offsetY: 7, cornerRadius: 7 })
  }
}

function AvatarOverlay({ profile, device, dimmed }: { profile: Profile | null; device: Device; dimmed: boolean }) {
  const { x, y, scale } = useView()
  const photo = useImage(profile?.avatar)
  const a = AVATAR[device]
  const r = a.d / 2
  const inner = a.d - a.ring * 2
  const letters = initials(profile?.name ?? '')
  return (
    <Group x={x + a.x * scale} y={y + a.y * scale} scaleX={scale} scaleY={scale} opacity={dimmed ? 0.3 : 1}>
      <Circle x={r} y={r} radius={r} fill="#FFFFFF" />
      <Group clipFunc={(ctx) => ctx.arc(r, r, r - a.ring, 0, Math.PI * 2)}>
        {photo ? (
          <KImage image={photo} x={a.ring} y={a.ring} width={inner} height={inner} />
        ) : (
          <>
            <Rect x={a.ring} y={a.ring} width={inner} height={inner} fill="#E8E8E7" />
            {letters ? (
              <Text
                x={a.ring} y={a.ring} width={inner} height={inner} align="center" verticalAlign="middle"
                text={letters} fontFamily="Geist Variable" fontStyle="600" fontSize={inner * 0.36} fill="#5B6B7B"
              />
            ) : (
              <>
                <Circle x={r} y={r * 0.82} radius={inner * 0.19} fill="#CBCBC8" />
                <Circle x={r} y={r * 1.95} radius={inner * 0.4} fill="#CBCBC8" />
              </>
            )}
          </>
        )}
        {profile?.frame && <PhotoFrameRing frame={profile.frame} r={r} radius={r - a.ring} />}
      </Group>
    </Group>
  )
}

/** One of LinkedIn's photo frames over the photo; see `FRAME_BAND` for its shape. */
function PhotoFrameRing({ frame: kind, r, radius }: { frame: PhotoFrame; r: number; radius: number }) {
  const { text, color } = PHOTO_FRAMES[kind]
  const fontVersion = useFontVersion(FRAME_BAND.family, FRAME_BAND.weight, false, text)
  const frame = photoFrameLayout(r, radius)
  return (
    <>
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath()
          ctx.arc(r, r, radius + 1, 0, Math.PI * 2, false)
          ctx.arc(r, r, frame.innerRadius, 0, Math.PI * 2, true)
          ctx.closePath()
          ctx.fillStrokeShape(shape)
        }}
        fillLinearGradientStartPoint={frame.fadeStart}
        fillLinearGradientEndPoint={frame.fadeEnd}
        fillLinearGradientColorStops={[0, `${color}00`, 1, color]}
      />
      <TextPath
        key={fontVersion}
        data={frame.textPath}
        text={text}
        align="center"
        textBaseline="alphabetic"
        fill="#FFFFFF"
        fontFamily={FRAME_BAND.family}
        fontStyle={String(FRAME_BAND.weight)}
        fontSize={frame.fontSize}
        letterSpacing={frame.letterSpacing}
      />
    </>
  )
}

function SafeZones() {
  const { x, y, scale } = useView()
  return (
    <>
      {(['mobile', 'desktop'] as const).map((device) => {
        const a = AVATAR[device]
        const r = (a.d / 2) * scale
        const cx = x + (a.x + a.d / 2) * scale
        const cy = y + (a.y + a.d / 2) * scale
        const label = device === 'desktop' ? 'Photo on desktop' : 'Photo on mobile'
        const labelWidth = device === 'desktop' ? 112 : 104
        // Desktop's label sits above its circle, mobile's to the right, so they never collide.
        const labelAt = device === 'desktop' ? { x: cx - labelWidth / 2, y: cy - r - 30 } : { x: cx + r + 10, y: cy - 11 }
        return (
          <Group key={device}>
            <Circle x={cx} y={cy} radius={r} fill="rgba(255, 82, 82, 0.16)" />
            <Circle x={cx} y={cy} radius={r} stroke="rgba(0, 0, 0, 0.5)" strokeWidth={3} />
            <Circle x={cx} y={cy} radius={r} stroke="#FFFFFF" strokeWidth={1.5} dash={[6, 5]} />
            <Group {...labelAt}>
              <Rect width={labelWidth} height={22} cornerRadius={11} fill="rgba(10, 10, 11, 0.86)" />
              <Text
                width={labelWidth} height={22} align="center" verticalAlign="middle"
                text={label} fontFamily="Geist Variable" fontStyle="500" fontSize={11} fill="#FFFFFF"
              />
            </Group>
          </Group>
        )
      })}
    </>
  )
}

/** `children` are HTML overlays that sit above the canvas and share its wheel and pan handling. */
export function EditorStage({ children }: { children?: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const contentRef = useRef<Konva.Group>(null)
  const trRef = useRef<Konva.Transformer>(null)

  const doc = useEditor((s) => s.doc)
  const selection = useEditor((s) => s.selection)
  const editingId = useEditor((s) => s.editingId)
  const profile = useEditor((s) => s.profile)
  const device = useEditor((s) => s.device)
  const showProfile = useEditor((s) => s.showProfile)
  const showSafeZones = useEditor((s) => s.showSafeZones)
  const view = useView()
  const { scale } = view

  const [guides, setGuides] = useState<Guide[]>([])
  const [interacting, setInteracting] = useState(false)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [marquee, setMarquee] = useState<Box | null>(null)
  const [badge, setBadge] = useState<{ text: string; x: number; y: number } | null>(null)
  const [spaceDown, setSpaceDown] = useState(false)
  const [panning, setPanning] = useState(false)

  const dragLead = useRef<Konva.Node | null>(null)
  const targets = useRef<{ x: number[]; y: number[] } | null>(null)
  const marqueeStart = useRef<{ x: number; y: number; additive: boolean } | null>(null)
  const marqueeBox = useRef<Box | null>(null)
  /** A text element that was already selected when pressed: releasing without dragging starts editing it. */
  const editCandidate = useRef<string | null>(null)

  const findNode = useCallback(
    (id: string) => contentRef.current?.findOne((node: Konva.Node) => node.id() === id),
    [],
  )
  const boxOf = (node: Konva.Node): Box => node.getClientRect({ relativeTo: contentRef.current!, skipShadow: true })

  // --- viewport ---------------------------------------------------------
  useLayoutEffect(() => {
    const host = hostRef.current!
    const measure = () => {
      useView.getState().set({ width: host.clientWidth, height: host.clientHeight })
      if (useView.getState().fitted) fitView()
    }
    // Measure now as well: the first frame must already be fitted, because the
    // landing page's view transition captures it before any observer fires.
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (useView.getState().fitted) fitView()
  }, [device, showProfile])

  useEffect(() => {
    registerContent(contentRef.current)
    return () => registerContent(null)
  }, [])

  // Wheel pans; ctrl/cmd + wheel (and trackpad pinch) zooms around the pointer.
  useEffect(() => {
    const host = hostRef.current!
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const v = useView.getState()
      if (e.ctrlKey || e.metaKey) {
        const rect = host.getBoundingClientRect()
        // Trackpad pinches send small deltas, mouse wheels ~100 per notch; cap it so one notch is a gentle step.
        const delta = Math.max(-40, Math.min(40, e.deltaY))
        v.zoomTo(v.scale * Math.exp(-delta * 0.008), { x: e.clientX - rect.left, y: e.clientY - rect.top })
      } else {
        v.panBy(e.shiftKey ? -e.deltaY : -e.deltaX, e.shiftKey ? 0 : -e.deltaY)
      }
    }
    host.addEventListener('wheel', onWheel, { passive: false })
    return () => host.removeEventListener('wheel', onWheel)
  }, [])

  // Hold space to pan with the mouse.
  useEffect(() => {
    // Space keeps its normal meaning in text fields and on focused buttons and controls.
    const typing = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.isContentEditable || Boolean(target.closest('input, textarea, select, button, a, [role="slider"], [role="dialog"], [role="listbox"]')))
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || typing(e.target)) return
      e.preventDefault()
      setSpaceDown(true)
    }
    const up = (e: KeyboardEvent) => e.code === 'Space' && setSpaceDown(false)
    const blur = () => setSpaceDown(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  const startPan = (e: React.PointerEvent) => {
    e.preventDefault()
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    setPanning(true)
    let last = { x: e.clientX, y: e.clientY }
    const move = (ev: PointerEvent) => {
      useView.getState().panBy(ev.clientX - last.x, ev.clientY - last.y)
      last = { x: ev.clientX, y: ev.clientY }
    }
    const stop = () => {
      setPanning(false)
      target.removeEventListener('pointermove', move as EventListener)
      target.removeEventListener('pointerup', stop)
      target.removeEventListener('pointercancel', stop)
    }
    target.addEventListener('pointermove', move as EventListener)
    target.addEventListener('pointerup', stop)
    target.addEventListener('pointercancel', stop)
  }

  // --- selection frame --------------------------------------------------
  const selected = doc.elements.filter((el) => selection.includes(el.id))
  const transformable = selected.filter((el) => !el.locked && !el.hidden)
  const single = transformable.length === 1 ? transformable[0] : null

  useLayoutEffect(() => {
    const tr = trRef.current
    if (!tr) return
    const nodes = editingId
      ? []
      : transformable.map((el) => findNode(el.id)).filter((node): node is Konva.Node => Boolean(node))
    tr.nodes(nodes)
    tr.forceUpdate()
    tr.getLayer()?.batchDraw()
    // Tell the floating toolbar where the selection is on screen.
    useView.getState().set({ frame: nodes.length ? tr.getClientRect() : null })
    // `doc` is a dependency so the frame follows edits made from the toolbar (font size, text, ...).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, editingId, doc, findNode, view.x, view.y, scale])

  // Fonts finishing loading change text sizes after layout; keep the frame in step.
  useEffect(() => {
    const refresh = () => {
      trRef.current?.forceUpdate()
      trRef.current?.getLayer()?.batchDraw()
    }
    document.fonts.addEventListener('loadingdone', refresh)
    // (the published frame catches up on the next edit; a font swap rarely moves it far)
    return () => document.fonts.removeEventListener('loadingdone', refresh)
  }, [])

  const anchors = !single ? CORNER_ANCHORS : single.type === 'text' ? [...CORNER_ANCHORS, ...SIDE_ANCHORS] : single.type === 'shape' ? ALL_ANCHORS : CORNER_ANCHORS

  // --- pointer: select, marquee ------------------------------------------
  const onStageDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if ('button' in e.evt && e.evt.button !== 0) return
    const node = e.target
    const editor = useEditor.getState()
    const additive = 'shiftKey' in e.evt && (e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey)

    if (isElementNode(node)) {
      const alreadySole = editor.selection.length === 1 && editor.selection[0] === node.id()
      editCandidate.current = !additive && alreadySole && node.getClassName() === 'Text' ? node.id() : null
      if (additive) editor.toggleSelect(node.id())
      else if (!editor.selection.includes(node.id())) editor.select([node.id()])
      return
    }
    // Anything belonging to the transformer keeps the selection.
    if (node.findAncestor('Transformer')) return

    if (!additive) editor.select([])
    const pos = stageRef.current!.getPointerPosition()
    if (pos) marqueeStart.current = { ...pos, additive }
  }

  const onStageMove = () => {
    const start = marqueeStart.current
    const pos = stageRef.current?.getPointerPosition()
    if (!start || !pos) return
    const box = { x: Math.min(start.x, pos.x), y: Math.min(start.y, pos.y), width: Math.abs(pos.x - start.x), height: Math.abs(pos.y - start.y) }
    marqueeBox.current = box
    setMarquee(box)
  }

  const endMarquee = useCallback(() => {
    const start = marqueeStart.current
    const box = marqueeBox.current
    marqueeStart.current = null
    marqueeBox.current = null
    setMarquee(null)
    // A plain click on empty space is not a marquee.
    if (!start || !box || box.width + box.height <= 6) return
    const v = useView.getState()
    const area = { x: (box.x - v.x) / v.scale, y: (box.y - v.y) / v.scale, width: box.width / v.scale, height: box.height / v.scale }
    const editor = useEditor.getState()
    const hits = editor.doc.elements
      .filter((el) => !el.locked && !el.hidden)
      .filter((el) => {
        const node = findNode(el.id)
        if (!node) return false
        const b = node.getClientRect({ relativeTo: contentRef.current!, skipShadow: true })
        return b.x < area.x + area.width && b.x + b.width > area.x && b.y < area.y + area.height && b.y + b.height > area.y
      })
      .map((el) => el.id)
    editor.select(start.additive ? [...new Set([...editor.selection, ...hits])] : hits)
  }, [findNode])

  useEffect(() => {
    window.addEventListener('mouseup', endMarquee)
    window.addEventListener('touchend', endMarquee)
    return () => {
      window.removeEventListener('mouseup', endMarquee)
      window.removeEventListener('touchend', endMarquee)
    }
  }, [endMarquee])

  // --- drag with snapping -------------------------------------------------
  const onDragStart = (e: KonvaEventObject<DragEvent>) => {
    const node = e.target
    if (!isElementNode(node) || dragLead.current) return
    dragLead.current = node
    editCandidate.current = null
    useView.getState().set({ frame: null })
    marqueeStart.current = null
    setInteracting(true)
    const { selection: current, doc: currentDoc } = useEditor.getState()
    const moving = new Set(current.includes(node.id()) ? current : [node.id()])
    // Snapping a group is ambiguous, so only a lone element snaps.
    targets.current =
      moving.size === 1
        ? snapTargets(
            currentDoc.elements
              .filter((el) => !moving.has(el.id) && !el.hidden)
              .map((el) => findNode(el.id))
              .filter((n): n is Konva.Node => Boolean(n))
              .map(boxOf),
          )
        : null
  }

  const onDragMove = (e: KonvaEventObject<DragEvent>) => {
    const node = e.target
    if (node !== dragLead.current || !targets.current) return
    if (e.evt.altKey) {
      setGuides([])
      return
    }
    const result = snap(boxOf(node), targets.current, SNAP_PX / useView.getState().scale)
    if (result.dx || result.dy) node.position({ x: node.x() + result.dx, y: node.y() + result.dy })
    setGuides(result.guides)
  }

  const onDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const node = e.target
    if (!isElementNode(node)) return
    if (node === dragLead.current) {
      dragLead.current = null
      targets.current = null
      setGuides([])
      setInteracting(false)
    }
    useEditor.getState().patchElements([node.id()], { x: round(node.x(), 1), y: round(node.y(), 1) }, 'drag')
  }

  // --- resize / rotate ------------------------------------------------------
  const onTransform = () => {
    const tr = trRef.current!
    const anchor = tr.getActiveAnchor() ?? ''
    if (SIDE_ANCHORS.includes(anchor)) {
      // Dragging a text box's side re-wraps it instead of stretching the letters.
      for (const node of tr.nodes()) {
        if (node.getClassName() === 'Text') {
          node.setAttrs({ width: Math.max(24, node.width() * node.scaleX()), scaleX: 1, scaleY: 1 })
        }
      }
    }
    // A small readout under the frame: the angle while rotating, the size while resizing.
    const [node] = tr.nodes()
    if (!node) return
    const frame = tr.getClientRect()
    const text =
      anchor === 'rotater'
        ? `${Math.round(((node.rotation() % 360) + 360) % 360)}°`
        : tr.nodes().length === 1
          ? `${Math.round(node.width() * node.scaleX())} × ${Math.round(node.height() * node.scaleY())}`
          : null
    setBadge(text ? { text, x: frame.x + frame.width / 2, y: frame.y + frame.height + 10 } : null)
  }

  const onTransformEnd = () => {
    const tr = trRef.current!
    const { doc: currentDoc, patchElements } = useEditor.getState()
    const patches = new Map<string, Partial<BannerElement>>()
    for (const node of tr.nodes()) {
      const el = currentDoc.elements.find((item) => item.id === node.id())
      if (!el) continue
      const sx = node.scaleX()
      const sy = node.scaleY()
      const placed = { x: round(node.x(), 1), y: round(node.y(), 1), rotation: round(node.rotation(), 1) }
      if (el.type === 'text') {
        const patch = {
          ...placed,
          width: round(Math.max(24, node.width() * sx), 1),
          fontSize: round(Math.max(6, el.fontSize * sy), 1),
          letterSpacing: round(el.letterSpacing * sy, 2),
        }
        node.setAttrs({ scaleX: 1, scaleY: 1, width: patch.width, fontSize: patch.fontSize, letterSpacing: patch.letterSpacing })
        // Text height follows from its wrapping; keep the stored value in step.
        patches.set(el.id, { ...patch, height: round(node.height(), 1) })
      } else {
        const patch = {
          ...placed,
          width: round(Math.max(2, node.width() * sx), 1),
          height: round(Math.max(2, node.height() * sy), 1),
        }
        node.setAttrs({ scaleX: 1, scaleY: 1, width: patch.width, height: patch.height })
        patches.set(el.id, patch)
      }
    }
    patchElements([...patches.keys()], (el) => patches.get(el.id) ?? {})
    setInteracting(false)
    setBadge(null)
  }

  // Right-click acts on what is under the pointer, like every other design tool.
  const onContextMenu = (e: KonvaEventObject<PointerEvent>) => {
    const editor = useEditor.getState()
    if (isElementNode(e.target)) {
      if (!editor.selection.includes(e.target.id())) editor.select([e.target.id()])
    } else if (!e.target.findAncestor('Transformer')) {
      editor.select([])
    }
  }

  const bind: NodeBinder = useCallback((el) => ({ draggable: !el.locked }), [])

  // --- render ------------------------------------------------------------------
  const rounded = showProfile && device === 'desktop'
  const avatar = AVATAR[device]
  const selectionNearAvatar =
    showProfile &&
    selected.some((el) => el.x < avatar.x + avatar.d && el.y + el.height > avatar.y) // cheap: boxes, not circles
  const hoverNode = hoverId && !selection.includes(hoverId) && !interacting && !marquee ? findNode(hoverId) : null
  const editing = editingId ? doc.elements.find((el) => el.id === editingId) : undefined
  const cursor = panning ? 'grabbing' : spaceDown ? 'grab' : hoverId ? 'move' : 'default'

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
    <div ref={hostRef} className="absolute inset-0 touch-none overflow-hidden" style={{ cursor }} onPointerDown={(e) => e.button === 1 && startPan(e)}>
      <p className="pointer-events-none absolute text-[11px] whitespace-nowrap text-subtle" style={{ left: view.x, top: view.y - 24 }}>
        LinkedIn banner <span className="mx-1 opacity-50">·</span> {W} × {H} px
      </p>
      <Stage
        ref={stageRef}
        width={view.width || 1}
        height={view.height || 1}
        onMouseDown={onStageDown}
        onTouchStart={onStageDown}
        onMouseMove={onStageMove}
        onTouchMove={onStageMove}
        onContextMenu={onContextMenu}
      >
        <Layer>
          <Group
            x={view.x}
            y={view.y}
            scaleX={scale}
            scaleY={scale}
            clipFunc={(ctx) => {
              const r = rounded ? CARD_RADIUS : 0
              ctx.beginPath()
              ctx.moveTo(0, H)
              ctx.lineTo(0, r)
              ctx.arcTo(0, 0, r, 0, r)
              ctx.lineTo(W - r, 0)
              ctx.arcTo(W, 0, W, r, r)
              ctx.lineTo(W, H)
              ctx.closePath()
            }}
          >
            <Group
              ref={contentRef}
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
              onMouseOver={(e) => isElementNode(e.target) && setHoverId(e.target.id())}
              onMouseOut={() => setHoverId(null)}
              onClick={(e) => {
                if (editCandidate.current && e.target.id() === editCandidate.current) useEditor.getState().setEditing(e.target.id())
                editCandidate.current = null
              }}
              onDblClick={(e) => e.target.getClassName() === 'Text' && isElementNode(e.target) && useEditor.getState().setEditing(e.target.id())}
              onDblTap={(e) => e.target.getClassName() === 'Text' && isElementNode(e.target) && useEditor.getState().setEditing(e.target.id())}
            >
              <BackgroundNodes background={doc.background} />
              {doc.elements.map((el) => (
                <ElementNode key={el.id} el={el} bind={bind} editing={el.id === editingId} />
              ))}
            </Group>
          </Group>
        </Layer>

        <Layer listening={false}>
          {showProfile && <AvatarOverlay profile={profile} device={device} dimmed={interacting || selectionNearAvatar || showSafeZones} />}
          {showSafeZones && <SafeZones />}
        </Layer>

        <Layer>
          {hoverNode && (
            <Rect
              listening={false}
              {...hoverNode.getAbsolutePosition()}
              width={hoverNode.width() * scale}
              height={hoverNode.height() * scale}
              rotation={hoverNode.rotation()}
              stroke={SELECT}
              strokeWidth={1.5}
            />
          )}
          <Transformer
            ref={trRef}
            enabledAnchors={anchors}
            keepRatio={!single || single.type !== 'shape'}
            flipEnabled={false}
            ignoreStroke
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
            rotationSnapTolerance={4}
            rotateAnchorOffset={26}
            anchorSize={10}
            anchorCornerRadius={3}
            anchorFill="#FFFFFF"
            anchorStroke={SELECT}
            anchorStrokeWidth={1.5}
            borderStroke={SELECT}
            borderStrokeWidth={1.5}
            anchorStyleFunc={styleAnchor}
            boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 8 || Math.abs(newBox.height) < 8 ? oldBox : newBox)}
            onTransformStart={() => (setInteracting(true), useView.getState().set({ frame: null }))}
            onTransform={onTransform}
            onTransformEnd={onTransformEnd}
          />
          {guides.map((guide) =>
            guide.axis === 'x' ? (
              <Line key={`x${guide.at}`} listening={false} points={[view.x + guide.at * scale, view.y - 24, view.x + guide.at * scale, view.y + H * scale + 24]} stroke="#FF4D8D" strokeWidth={1} />
            ) : (
              <Line key={`y${guide.at}`} listening={false} points={[view.x - 24, view.y + guide.at * scale, view.x + W * scale + 24, view.y + guide.at * scale]} stroke="#FF4D8D" strokeWidth={1} />
            ),
          )}
          {badge && (
            <Group listening={false} x={badge.x - 42} y={badge.y}>
              <Rect width={84} height={22} cornerRadius={6} fill={SELECT} />
              <Text width={84} height={22} align="center" verticalAlign="middle" text={badge.text} fontFamily="Geist Variable" fontStyle="600" fontSize={11} fill="#FFFFFF" />
            </Group>
          )}
          {marquee && <Rect listening={false} {...marquee} fill="rgba(15, 111, 236, 0.1)" stroke={SELECT} strokeWidth={1} />}
        </Layer>
      </Stage>

      {doc.elements.length === 0 && (
        <p
          className="pointer-events-none absolute flex items-center justify-center text-center text-sm font-medium text-white/70 mix-blend-difference"
          style={{ left: view.x + W * scale * 0.34, top: view.y, width: W * scale * 0.62, height: H * scale }}
        >
          Pick a template, or add text and elements from the toolbar below.
        </p>
      )}
      {children}
      {editing?.type === 'text' && <TextEditor el={editing} />}
      {(spaceDown || panning) && <div className="absolute inset-0 z-30" onPointerDown={startPan} />}
    </div>
      </ContextMenu.Trigger>
      <CanvasMenu />
    </ContextMenu.Root>
  )
}
