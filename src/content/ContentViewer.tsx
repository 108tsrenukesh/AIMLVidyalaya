import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getContentLibrary, getTopicLabel, type ContentItem } from '../utils/content'

export default function ContentViewer() {
  const { topic, file } = useParams()
  const navigate = useNavigate()
  const [topics, setTopics] = useState<ContentItem[]>([])
  const [currentFile, setCurrentFile] = useState<string>(file || '')
  const [htmlContent, setHtmlContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    getContentLibrary().then(setTopics)
  }, [])

  useEffect(() => {
    if (!topic || !file) return
    setLoading(true)
    setCurrentFile(file)
    fetch(`${import.meta.env.BASE_URL}content/${topic}/${file}`)
      .then(r => r.text())
      .then(html => {
        setHtmlContent(html)
        setLoading(false)
      })
      .catch(() => {
        setHtmlContent('<h2>Content not found</h2>')
        setLoading(false)
      })
  }, [topic, file])

  const findTopicForFile = useCallback((filename: string): ContentItem | undefined => {
    return topics.find(t => t.children?.some(c => c.path.split('/')[1] === filename))
  }, [topics])

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument) return

    const doc = iframe.contentDocument

    doc.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return

      const href = target.getAttribute('href')
      if (!href) return

      if (href.startsWith('http://') || href.startsWith('https://')) {
        const url = new URL(href, doc.baseURI)
        if (url.origin !== window.location.origin) {
          e.preventDefault()
          window.open(href, '_blank', 'noopener')
          return
        }
      }

      if (href.endsWith('.html') || href.includes('.html#')) {
        e.preventDefault()
        const filename = href.split('/').pop()!.split('#')[0]
        const anchor = href.includes('#') ? href.split('#')[1] : null

        const fileTopic = findTopicForFile(filename)
        if (fileTopic) {
          navigate(`/content/${fileTopic.path}/${filename}${anchor ? `#${anchor}` : ''}`)
        }
        return
      }

      if (href.startsWith('#')) {
        e.preventDefault()
        const el = doc.getElementById(href.slice(1))
        if (el) el.scrollIntoView({ behavior: 'smooth' })
        return
      }

      e.preventDefault()
    }, true)

    doc.querySelectorAll('a[target="_blank"]').forEach(a => {
      const href = a.getAttribute('href')
      if (!href) return
      if (href.startsWith('http://') || href.startsWith('https://')) {
        const url = new URL(href, doc.baseURI)
        if (url.origin === window.location.origin) {
          a.removeAttribute('target')
        }
      } else {
        a.removeAttribute('target')
      }
    })

    if (topic) {
      const hash = window.location.hash
      if (hash.includes('#') && !hash.endsWith('#')) {
        const anchor = hash.split('#').pop()
        if (anchor) {
          setTimeout(() => {
            const el = doc.getElementById(anchor)
            if (el) el.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }
      }
    }
  }, [topic, findTopicForFile, navigate])

  const currentTopic = topics.find(t => t.path === topic)
  const fileList = currentTopic?.children || []
  const currentIndex = fileList.findIndex(f => f.path.split('/')[1] === currentFile)
  const prevFile = currentIndex > 0 ? fileList[currentIndex - 1] : null
  const nextFile = currentIndex < fileList.length - 1 ? fileList[currentIndex + 1] : null

  return (
    <div className="content-viewer">
      <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <aside className={`viewer-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <h3 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            ← {getTopicLabel(topic || '')}
          </h3>
        </div>
        <nav className="sidebar-nav">
          {fileList.map((f, i) => {
            const fileName = f.path.split('/')[1]
            const isActive = fileName === currentFile
            return (
              <button
                key={f.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => {
                  navigate(`/content/${topic}/${fileName}`)
                }}
              >
                <span className="sidebar-num">{i + 1}</span>
                {f.name}
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="viewer-content">
        {loading ? (
          <div className="loading-screen"><div className="loading-spinner" /></div>
        ) : (
          <>
            <iframe
              ref={iframeRef}
              srcDoc={htmlContent}
              className="content-iframe"
              title="Content"
              sandbox="allow-scripts allow-same-origin"
              onLoad={handleIframeLoad}
            />
            <div className="viewer-nav">
              {prevFile ? (
                <button className="nav-btn prev" onClick={() => navigate(`/content/${topic}/${prevFile.path.split('/')[1]}`)}>
                  ← Previous
                </button>
              ) : <div />}
              {nextFile ? (
                <button className="nav-btn next" onClick={() => navigate(`/content/${topic}/${nextFile.path.split('/')[1]}`)}>
                  Next →
                </button>
              ) : <div />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
