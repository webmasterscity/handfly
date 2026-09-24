import { ChartLine, Home, Layers, Plus, Settings as SettingsIcon, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { dismissToast, useToasts } from '../core/feedback/feedback'
import { CelebrationOverlay } from '../ui/Celebration'
import { Button } from '../ui/primitives/Button'

const NAV = [
  { to: '/', key: 'today', icon: Home, end: true },
  { to: '/practice', key: 'practice', icon: Layers },
  { to: '/log', key: 'log', icon: Plus, primary: true },
  { to: '/progress', key: 'progress', icon: ChartLine },
  { to: '/settings', key: 'settings', icon: SettingsIcon },
]

const FOCUS_PATHS = ['/session', '/welcome', '/m/calculation/practice', '/m/navigation/compass', '/m/people/quiz']

export function Shell() {
  const { t } = useTranslation()
  const location = useLocation()
  // Pantallas de concentración (bienvenida, sesión, juegos): sin barra de pestañas.
  const focusMode = FOCUS_PATHS.includes(location.pathname)
  const mainRef = useRef<HTMLElement>(null)

  // Al cambiar de pantalla: arriba del todo y el foco al contenido (lectores de pantalla).
  useEffect(() => {
    if (location.hash) return
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [location.pathname, location.hash])

  return (
    <div className="min-h-dvh lg:flex">
      <a href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus() }} className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent">
        {t('nav.skip')}
      </a>

      {!focusMode && (
        <nav aria-label={t('nav.label')} className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-60 lg:shrink-0 lg:flex-col lg:gap-1 lg:border-r lg:border-line lg:px-3 lg:py-6">
          <p className="mb-6 px-3 font-display text-xl font-bold">Handfly</p>
          {NAV.map(({ to, key, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-12 items-center gap-3 rounded-xl px-3 font-display font-bold ${isActive ? 'bg-panel-2 text-ink' : 'text-ink-dim hover:text-ink'}`
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
              {t(`nav.${key}`)}
            </NavLink>
          ))}
        </nav>
      )}

      <main id="main" ref={mainRef} tabIndex={-1} className={`min-w-0 flex-1 pt-safe outline-none ${focusMode ? '' : 'pb-28 lg:pb-8'}`}>
        <Outlet />
      </main>

      {!focusMode && (
        <nav aria-label={t('nav.labelTabs')} className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur lg:hidden">
          <ul className="mx-auto grid max-w-xl grid-cols-5">
            {NAV.map(({ to, key, icon: Icon, end, primary }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex min-h-16 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-bold ${isActive ? 'text-ink' : 'text-ink-dim'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={
                          primary
                            ? 'grid h-10 w-10 place-items-center rounded-full bg-accent text-on-accent'
                            : `grid h-8 w-12 place-items-center rounded-full ${isActive ? 'bg-panel-2' : ''}`
                        }
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      {t(`nav.${key}`)}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <Toasts />
      <CelebrationOverlay />
      <UpdatePrompt />
    </div>
  )
}

// Arriba: abajo quedan la barra de pestañas y los botones principales, al alcance del pulgar.
function Toasts() {
  const toasts = useToasts()
  const { t } = useTranslation()
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(0.75rem+env(safe-area-inset-top))] z-40 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-pop pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
            toast.tone === 'success' ? 'border-green bg-panel' : 'border-line bg-panel'
          }`}
        >
          <p className="flex-1">{toast.text}</p>
          <button type="button" onClick={() => dismissToast(toast.id)} aria-label={t('common.close')} className="-m-1 grid h-9 w-9 place-items-center rounded-lg text-ink-dim">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  )
}

function UpdatePrompt() {
  const { t } = useTranslation()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  if (!needRefresh) return null
  return (
    <div role="alert" className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-md flex-col gap-3 rounded-2xl border border-accent bg-panel p-4 shadow-lg">
      <p>{t('update.available')}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => setNeedRefresh(false)}>
          {t('update.later')}
        </Button>
        <Button onClick={() => void updateServiceWorker(true)}>{t('update.reload')}</Button>
      </div>
    </div>
  )
}
