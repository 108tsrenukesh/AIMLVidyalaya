import { useState, useEffect } from 'react'

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
    <div className="update-toast">
      <span>New content available!</span>
      <button className="update-btn" onClick={handleUpdate}>
        Update
      </button>
      <button className="update-dismiss" onClick={() => setShow(false)}>
        Later
      </button>
    </div>
  )
}
