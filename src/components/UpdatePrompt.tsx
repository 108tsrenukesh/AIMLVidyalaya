import { useState, useEffect } from 'react'

/* Centered "Update available" popup.
 * Service-worker logic is unchanged: it detects a waiting SW (a new deploy),
 * and on "Update now" tells it to skip waiting; the controllerchange reload
 * then swaps in the new version. Styling is self-contained and theme-aware. */

const STYLE = `
  .vy-update-overlay {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    background: rgba(8, 11, 18, 0.55);
    -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
    animation: vyUpdFade .18s ease both;
  }
  .vy-update-card {
    width: 100%; max-width: 360px;
    background: var(--bg2, #161b26);
    color: var(--text, #f0f2f8);
    border: 1px solid var(--border, rgba(255,255,255,0.10));
    border-radius: 18px;
    padding: 26px 24px 20px;
    text-align: center;
    box-shadow: 0 18px 50px rgba(0,0,0,0.45);
    animation: vyUpdPop .2s cubic-bezier(.2,.8,.3,1) both;
  }
  .vy-update-icon {
    width: 52px; height: 52px; margin: 0 auto 14px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%;
    background: rgba(91,141,238,0.15);
    color: var(--accent, #5b8dee);
  }
  .vy-update-icon svg { width: 26px; height: 26px; }
  .vy-update-title { font-size: 18px; font-weight: 700; margin: 0 0 6px; }
  .vy-update-msg {
    font-size: 13.5px; line-height: 1.5;
    color: var(--text2, #b0bace); margin: 0 0 20px;
  }
  .vy-update-actions { display: flex; flex-direction: column; gap: 10px; }
  .vy-update-primary {
    width: 100%; min-height: 44px;
    border: 0; border-radius: 11px; cursor: pointer;
    font: inherit; font-size: 14px; font-weight: 600; color: #fff;
    background: linear-gradient(135deg, var(--accent, #5b8dee), var(--accent2, #7c3aed));
    transition: filter .15s, transform .05s;
  }
  .vy-update-primary:hover { filter: brightness(1.06); }
  .vy-update-primary:active { transform: translateY(1px); }
  .vy-update-secondary {
    width: 100%; min-height: 44px;
    border: 0; border-radius: 11px; cursor: pointer;
    font: inherit; font-size: 13.5px; color: var(--text2, #b0bace);
    background: transparent;
    transition: color .15s, background .15s;
  }
  .vy-update-secondary:hover { background: rgba(127,127,127,0.10); color: var(--text, #f0f2f8); }

  @keyframes vyUpdFade { from { opacity: 0 } to { opacity: 1 } }
  @keyframes vyUpdPop {
    from { opacity: 0; transform: translateY(8px) scale(.97) }
    to   { opacity: 1; transform: none }
  }
`

export default function UpdatePrompt() {
  const [show, setShow] = useState(false)
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then((reg) => {
      if (reg.waiting) {
        setWaiting(reg.waiting)
        setShow(true)
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaiting(newWorker)
            setShow(true)
          }
        })
      })
    })

    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })
  }, [])

  const handleUpdate = () => {
    waiting?.postMessage({ type: 'SKIP_WAITING' })
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      className="vy-update-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vy-update-title"
      onClick={() => setShow(false)}
    >
      <style>{STYLE}</style>
      <div className="vy-update-card" onClick={(e) => e.stopPropagation()}>
        <div className="vy-update-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <polyline points="21 3 21 9 15 9" />
          </svg>
        </div>
        <h2 className="vy-update-title" id="vy-update-title">Update available</h2>
        <p className="vy-update-msg">
          A new version of Vidyalaya is ready with the latest content. Reload to update.
        </p>
        <div className="vy-update-actions">
          <button className="vy-update-primary" onClick={handleUpdate}>
            Update now
          </button>
          <button className="vy-update-secondary" onClick={() => setShow(false)}>
            Later
          </button>
        </div>
      </div>
    </div>
  )
}
