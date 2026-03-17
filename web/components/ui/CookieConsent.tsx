'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'vlp_cookie_prefs_v1'

interface CookiePrefs {
  analytics: boolean
  ts: number
}

// Wire in Plausible/GA when analytics provider is confirmed
export function applyAnalyticsConsent(_enabled: boolean): void {
  // no-op for now
}

function getStoredPrefs(): CookiePrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CookiePrefs
  } catch {
    return null
  }
}

function savePrefs(prefs: CookiePrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // ignore
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [analyticsOn, setAnalyticsOn] = useState(false)

  useEffect(() => {
    const prefs = getStoredPrefs()
    if (!prefs) {
      setVisible(true)
    } else {
      setAnalyticsOn(prefs.analytics)
      applyAnalyticsConsent(prefs.analytics)
    }
  }, [])

  function acceptAll() {
    const prefs: CookiePrefs = { analytics: true, ts: Date.now() }
    savePrefs(prefs)
    applyAnalyticsConsent(true)
    setVisible(false)
  }

  function rejectAll() {
    const prefs: CookiePrefs = { analytics: false, ts: Date.now() }
    savePrefs(prefs)
    setVisible(false)
  }

  function savePreferences() {
    const prefs: CookiePrefs = { analytics: analyticsOn, ts: Date.now() }
    savePrefs(prefs)
    applyAnalyticsConsent(analyticsOn)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      id="vlp-cookie"
      aria-label="Cookie preferences"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-[9999] max-w-3xl rounded-2xl border border-white/10 bg-slate-950/90 p-4 shadow-2xl backdrop-blur md:left-6 md:right-auto md:p-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">We use cookies</p>
          <p className="mt-1 text-xs leading-relaxed text-white/70">
            We use essential cookies for site functionality, and optional analytics cookies to
            improve performance. You can accept, reject, or manage preferences at any time.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <button
              type="button"
              onClick={() => setPanelOpen((o) => !o)}
              className="text-xs font-bold text-brand-400 underline decoration-white/20 underline-offset-4 hover:text-brand-500"
            >
              Manage preferences
            </button>
            <a
              href="/privacy"
              className="text-xs font-semibold text-white/70 underline decoration-white/15 underline-offset-4 hover:text-white/90"
            >
              Privacy policy
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch md:gap-3">
          <button
            type="button"
            onClick={acceptAll}
            className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-xs font-bold text-ink-900 hover:bg-brand-400"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={rejectAll}
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-bold text-white/85 hover:border-white/25 hover:bg-white/10"
          >
            Reject non-essential
          </button>
        </div>
      </div>

      {panelOpen && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">Cookie preferences</p>
                <p className="mt-1 text-xs text-white/70">
                  Essential cookies are always on. Toggle analytics below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/80 hover:border-white/20 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">Essential</p>
                  <p className="mt-1 text-xs text-white/70">
                    Required for security, navigation, and saving your cookie choices.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-white/70">
                  Always on
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">Analytics</p>
                  <p className="mt-1 text-xs text-white/70">
                    Helps us understand usage and improve pages (e.g., anonymized metrics).
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={analyticsOn}
                  aria-label="Toggle analytics cookies"
                  onClick={() => setAnalyticsOn((v) => !v)}
                  className="relative h-8 w-14 flex-shrink-0 rounded-full border transition"
                  style={{
                    backgroundColor: analyticsOn ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.10)',
                    borderColor: analyticsOn ? 'rgba(249,115,22,0.45)' : 'rgba(255,255,255,0.15)',
                  }}
                >
                  <span
                    className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white/80 transition-transform"
                    style={{ transform: analyticsOn ? 'translateX(24px)' : 'translateX(0px)' }}
                  />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={savePreferences}
                className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-xs font-bold text-ink-900 hover:bg-brand-400"
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
