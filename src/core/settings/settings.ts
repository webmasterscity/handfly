import { useSyncExternalStore } from 'react'
import type { ModuleId } from '../db/types'

export interface Settings {
  /** 'auto' sigue el idioma del teléfono (español si no es uno soportado). */
  language: 'auto' | 'es' | 'en'
  theme: 'system' | 'light' | 'dark'
  sounds: boolean
  haptics: boolean
  motion: boolean
  allowPaste: boolean
  reminderTime: string // 'HH:MM'
  sessionSize: number // tarjetas máximas por sesión diaria
  onboarded: boolean
  /** Habilidades que la persona quiere recuperar (la bienvenida). Vacío = todas. */
  focus: ModuleId[]
  /** Dónde queda casa, para el juego de la brújula. Solo vive en este dispositivo. */
  home?: { lat: number; lng: number }
  /** Caja rápida: nivel actual (1-3), mejor ronda y rondas jugadas hoy (hay tope diario). */
  calcLevel: 1 | 2 | 3
  calcBest?: { correct: number; seconds: number }
  calcRounds?: { date: string; count: number }
  /** Mejor puntuación en «¿Dónde está casa?». */
  compassBest?: number
  /** Ya se anotaron (sin celebrar) los rangos que existían antes de las celebraciones. */
  progressRecorded?: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'auto',
  theme: 'system',
  sounds: true,
  haptics: true,
  motion: true,
  allowPaste: false,
  reminderTime: '08:00',
  sessionSize: 15,
  onboarded: false,
  focus: [],
  calcLevel: 1,
}

const KEY = 'handfly:settings'
const listeners = new Set<() => void>()
let current: Settings = load()

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function getSettings(): Settings {
  return current
}

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // Sin almacenamiento (modo privado): los ajustes viven solo en esta pestaña.
  }
  applyDocumentSettings(current)
  listeners.forEach((l) => l())
}

export function replaceSettings(next: unknown) {
  if (next && typeof next === 'object') updateSettings({ ...DEFAULT_SETTINGS, ...(next as Partial<Settings>) })
}

export function resolveLanguage(s: Settings = current): 'es' | 'en' {
  if (s.language !== 'auto') return s.language
  const nav = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'es'
  return nav.startsWith('en') ? 'en' : 'es'
}

export function applyDocumentSettings(s: Settings = current) {
  const root = document.documentElement
  root.dataset.theme = s.theme
  root.dataset.motion = s.motion ? 'on' : 'off'
  // lang correcto = partición de palabras correcta en el texto justificado.
  root.lang = resolveLanguage(s)
  for (const l of languageListeners) l(root.lang as 'es' | 'en')
}

const languageListeners = new Set<(lang: 'es' | 'en') => void>()
export function onLanguageChange(listener: (lang: 'es' | 'en') => void) {
  languageListeners.add(listener)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, getSettings)
}
