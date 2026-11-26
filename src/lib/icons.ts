import { createElement, useEffect, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Anchor, ArrowRight, ArrowUpRight, AtSign, Atom, Award, BadgeCheck, Banknote, Bike, BookOpen, Bot, Box, Brain,
  Briefcase, Brush, Building2, Calendar, Camera, ChartBar, ChartLine, ChartPie, Check, CircleCheck, Clock, Cloud,
  Code, Coffee, Cog, Compass, Cpu, Crown, Database, Dna, DollarSign, Dumbbell, Eye, Feather, Flag, Flame,
  FlaskConical, Gamepad2, Gavel, Gem, Globe, GraduationCap, Hammer, Handshake, Hash, Headphones, Heart, HeartPulse,
  Infinity as InfinityIcon, Key, Laptop, Layers, Leaf, Lightbulb, Link, Lock, Mail, MapPin, Medal, Megaphone,
  MessageCircle, MessagesSquare, Mic, Monitor, Moon, Mountain, MoveRight, Music, Newspaper, Package, Palette,
  PenTool, Pencil, Phone, PiggyBank, Plane, Play, Podcast, Puzzle, Quote, Rocket, Rss, Scale, Search, Send, Server,
  Share2, Shield, ShoppingBag, Smartphone, Smile, Sparkles, Star, Stethoscope, Store, Sun, Target, Terminal,
  ThumbsUp, TrendingUp, Trophy, Truck, User, UserCheck, Users, Video, WandSparkles, Wrench, Zap,
  type LucideIcon,
} from 'lucide-react'
import { loadImage } from './util'

/** Icons offered on the canvas, keyed by the name stored in a design. */
export const ICONS: Record<string, LucideIcon> = {
  Rocket, Briefcase, Code, Terminal, Mail, Globe, Phone, MapPin, Link, AtSign, Calendar, Sparkles, Star, Heart, Zap,
  Target, TrendingUp, ChartBar, ChartLine, ChartPie, Lightbulb, Brain, Bot, Cpu, Database, Cloud, Server, Laptop,
  Monitor, Smartphone, PenTool, Palette, Brush, Pencil, Feather, Camera, Video, Mic, Podcast, Headphones, Music,
  Megaphone, MessageCircle, MessagesSquare, Send, Share2, Rss, Users, User, UserCheck, Handshake, Award, Trophy,
  Medal, Crown, Gem, BadgeCheck, GraduationCap, BookOpen, Newspaper, Quote, Hash, Building2, Store, ShoppingBag,
  DollarSign, Banknote, PiggyBank, Scale, Gavel, Stethoscope, HeartPulse, Dna, FlaskConical, Atom, Wrench, Hammer,
  Cog, Layers, Box, Package, Truck, Plane, Compass, Anchor, Mountain, Leaf, Sun, Moon, Flame, Coffee, Flag, Shield,
  Lock, Key, Check, CircleCheck, ThumbsUp, Smile, Eye, Search, Clock, Play, Puzzle, Gamepad2, Dumbbell, Bike,
  WandSparkles, Infinity: InfinityIcon, ArrowRight, ArrowUpRight, MoveRight,
}

export const ICON_NAMES = Object.keys(ICONS)

const cache = new Map<string, HTMLImageElement>()
const pending = new Map<string, Promise<void>>()

function iconKey(name: string, color: string, strokeWidth: number) {
  return `${name}|${color}|${strokeWidth}`
}

function loadIcon(name: string, color: string, strokeWidth: number): Promise<void> {
  const key = iconKey(name, color, strokeWidth)
  let promise = pending.get(key)
  if (!promise) {
    const icon = ICONS[name]
    if (!icon) return Promise.resolve()
    // A large intrinsic size keeps the rasterised SVG sharp at any canvas scale.
    const svg = renderToStaticMarkup(createElement(icon, { color, strokeWidth, size: 512 }))
    promise = loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`).then(
      (image) => void cache.set(key, image),
      () => {},
    )
    pending.set(key, promise)
  }
  return promise
}

export function useIconImage(name: string, color: string, strokeWidth: number): HTMLImageElement | undefined {
  const key = iconKey(name, color, strokeWidth)
  const [, bump] = useState(0)
  useEffect(() => {
    if (cache.has(key)) return
    let live = true
    loadIcon(name, color, strokeWidth).then(() => live && bump((n) => n + 1))
    return () => {
      live = false
    }
  }, [key, name, color, strokeWidth])
  return cache.get(key)
}
