import {
  Bell, Target, Building2, ShoppingCart, Handshake, Boxes, Truck, Wallet,
  Shield, ShieldCheck, Users, Settings, Database,
} from 'lucide-react';

export interface Tone {
  text: string;
  bg: string;
  border: string;
  dot: string;
  soft: string;
  side: string;
  fill: string;
}

export const TONES: Record<string, Tone> = {
  blue:    { text: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100',    dot: 'bg-blue-500',    soft: 'text-blue-500',    side: 'text-blue-400',    fill: '#3b82f6' },
  indigo:  { text: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-100',  dot: 'bg-indigo-500',  soft: 'text-indigo-500',  side: 'text-indigo-400',  fill: '#6366f1' },
  sky:     { text: 'text-sky-600',     bg: 'bg-sky-50',     border: 'border-sky-100',     dot: 'bg-sky-500',     soft: 'text-sky-500',     side: 'text-sky-400',     fill: '#0ea5e9' },
  cyan:    { text: 'text-cyan-600',    bg: 'bg-cyan-50',    border: 'border-cyan-100',    dot: 'bg-cyan-500',    soft: 'text-cyan-500',    side: 'text-cyan-400',    fill: '#06b6d4' },
  emerald: { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-500', soft: 'text-emerald-500', side: 'text-emerald-400', fill: '#10b981' },
  green:   { text: 'text-green-600',   bg: 'bg-green-50',   border: 'border-green-100',   dot: 'bg-green-500',   soft: 'text-green-500',   side: 'text-green-400',   fill: '#22c55e' },
  teal:    { text: 'text-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-100',    dot: 'bg-teal-500',    soft: 'text-teal-500',    side: 'text-teal-400',    fill: '#14b8a6' },
  amber:   { text: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100',   dot: 'bg-amber-500',   soft: 'text-amber-500',   side: 'text-amber-400',   fill: '#f59e0b' },
  orange:  { text: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-100',  dot: 'bg-orange-500',  soft: 'text-orange-500',  side: 'text-orange-400',  fill: '#f97316' },
  red:     { text: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-100',     dot: 'bg-red-500',     soft: 'text-red-500',     side: 'text-red-400',     fill: '#ef4444' },
  rose:    { text: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-100',    dot: 'bg-rose-500',    soft: 'text-rose-500',    side: 'text-rose-400',    fill: '#f43f5e' },
  purple:  { text: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-100',  dot: 'bg-purple-500',  soft: 'text-purple-500',  side: 'text-purple-400',  fill: '#a855f7' },
  violet:  { text: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-100',  dot: 'bg-violet-500',  soft: 'text-violet-500',  side: 'text-violet-400',  fill: '#8b5cf6' },
  fuchsia: { text: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-100', dot: 'bg-fuchsia-500', soft: 'text-fuchsia-500', side: 'text-fuchsia-400', fill: '#d946ef' },
  slate:   { text: 'text-slate-600',   bg: 'bg-slate-100',  border: 'border-slate-200',   dot: 'bg-slate-500',   soft: 'text-slate-500',   side: 'text-slate-400',   fill: '#64748b' },
};

export interface CategoryMeta {
  icon: any;
  tone: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  oa:          { icon: Bell,          tone: 'blue' },
  market:      { icon: Target,        tone: 'orange' },
  engineering: { icon: Building2,     tone: 'indigo' },
  procurement: { icon: ShoppingCart,  tone: 'sky' },
  subcontract: { icon: Handshake,     tone: 'teal' },
  material:    { icon: Boxes,         tone: 'emerald' },
  equipment:   { icon: Truck,         tone: 'amber' },
  finance:     { icon: Wallet,        tone: 'purple' },
  safety:      { icon: Shield,        tone: 'red' },
  quality:     { icon: ShieldCheck,   tone: 'green' },
  hr:          { icon: Users,         tone: 'cyan' },
  platform:    { icon: Settings,      tone: 'slate' },
  resource:    { icon: Database,      tone: 'violet' },
};

export function categoryIcon(key: string): any {
  return (CATEGORY_META[key] || CATEGORY_META.resource).icon;
}

export function categoryTone(key: string): Tone {
  return TONES[(CATEGORY_META[key] || CATEGORY_META.resource).tone] || TONES.blue;
}