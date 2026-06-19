import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getContentLibrary, getTopicLabel, type ContentItem } from '../utils/content'

/* ------------------------------------------------------------------ *
 * Lesson viewer
 *  - App-level section navigation (sidebar lists each lesson's sections).
 *  - Live theme sync into the lesson + softened light palette.
 *  - In-app cross-lesson links ("Go deeper → …") + scroll to their section.
 *
 * The lessons' cross-links use target="_blank" (a leftover from when they were
 * standalone files). Inside our sandboxed iframe a new tab is blocked, so we
 * intercept any link pointing to one of our lessons and navigate IN-APP instead,
 * regardless of target="_blank". True external links still open in a new tab.
 *
 * iframe = sandbox="allow-scripts allow-same-origin" → parent can read/update it.
 * ------------------------------------------------------------------ */

interface Section {
  id: string
  label: string
}

const LESSON_INJECT_CSS = `
  nav,
  .theme-toggle,
  .toc-toggle,
  .toc-backdrop,
  .toc { display: none !important; }
  .main-layout { grid-template-columns: 1fr !important; }

  /* Softer, shaded light theme (overrides the lesson's pure-white defaults). */
  html[data-theme="light"] {
    --bg:      #e7ebf1;
    --bg2:     #f6f7fa;
    --bg3:     #edf0f5;
    --bg4:     #dfe4ed;
    --border:  rgba(15,23,42,0.10);
    --border2: rgba(15,23,42,0.18);
    --text:    #1f2733;
    --text2:   #3c4654;
    --text3:   #69727f;
    --shadow:  0 2px 14px rgba(15,23,42,0.08);
  }
  html[data-theme="light"] body { background: var(--bg); color: var(--text); }

  /* "Level up" callouts: stack on narrow screens so the link can't squeeze
     the text into a one-word-per-line column or overflow off the edge. */
  @media (max-width: 600px) {
    .levelup { flex-direction: column; align-items: flex-start; }
    .levelup a { white-space: normal; }
  }
`

const SECTION_LIST_CSS = `
  .content-viewer .sidebar-nav {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 88px;
  }

  .vy-section-block { margin: 2px 0 14px 24px; }
  .vy-section-head {
    display: flex; align-items: center; gap: 8px; width: 100%;
    background: none; border: 0; cursor: pointer; font: inherit;
    font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--text3, #6b7594); padding: 6px 8px; border-radius: 8px;
    transition: color .15s, background .15s;
  }
  .vy-section-head:hover { color: var(--text2, #b0bace); background: rgba(255,255,255,0.04); }
  .vy-chevron { font-size: 9px; width: 10px; flex-shrink: 0; }
  .vy-count { margin-left: auto; font-size: 10px; opacity: 0.7; font-weight: 600; }

  .vy-section-list {
    display: flex; flex-direction: column; margin-top: 2px;
    padding-left: 10px; border-left: 1px solid rgba(255,255,255,0.12);
  }
  .vy-section-link {
    position: relative; text-align: left; background: none; border: 0;
    cursor: pointer; font: inherit; font-size: 12.5px;
    color: var(--text2, #b0bace); padding: 7px 10px; border-radius: 8px;
    line-height: 1.35; transition: color .15s, background .15s;
  }
  .vy-section-link:hover { color: var(--text, #f0f2f8); background: rgba(255,255,255,0.05); }
  .vy-section-link.active {
    color: var(--accent, #5b8dee); background: rgba(91,141,238,0.14); font-weight: 600;
  }
  .vy-section-link.active::before {
    content: ""; position: absolute; left: -11px; top: 50%;
    transform: translateY(-50%); width: 2px; height: 16px;
    border-radius: 2px; background: var(--accent, #5b8dee);
  }

  [data-theme="light"] .vy-section-list { border-left-color: rgba(15,23,42,0.14); }
  [data-theme="light"] .vy-section-head:hover { background: rgba(15,23,42,0.05); }
  [data-theme="light"] .vy-section-link:hover { background: rgba(15,23,42,0.06); color: #1f2733; }
`

function readAppTheme(): string {
  if (typeof document !== 'undefined') {
    return document.documentElement.getAttribute('data-theme') || 'dark'
  }
  return 'dark'
}

function withInjectedCss(html: string): string {
  const style = `<style id="vidyalaya-shell">${LESSON_INJECT_CSS}</style>`
  if (html.includes('</head>')) return html.replace('</head>', `${style}</head>`)
  return style + html
}

function deriveLabel(section: Element, id: string): string {
  const heading = section.querySelector('h1, h2, h3, h4, .section-title, [class*="title"]')
  const text = heading?.textContent?.replace(/\s+/g, ' ').trim()
  if (text) return text.slice(0, 80)
  return id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function ContentViewer() {
  const { topic, file } = useParams()
  const navigate = useNavigate()
  const [topics, setTopics] = useState<ContentItem[]>([])
  const [currentFile, setCurrentFile] = useState<string>(file || '')
  const [htmlContent, setHtmlContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [sections, setSections] = useState<Section[]>([])
  const [activeSection, setActiveSection] = useState<string>('')
  const [sectionsCollapsed, setSectionsCollapsed] = useState(false)
  const [appTheme, setAppTheme] = useState<string>(readAppTheme)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  // Section to scroll to after a cross-lesson link loads a new lesson.
  const pendingAnchorRef = useRef<string | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    getContentLibrary().then(setTopics)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const update = () => setAppTheme(root.getAttribute('data-theme') || 'dark')
    update()
    const obs = new MutationObserver(update)
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return
    try {
      doc.documentElement.setAttribute('data-theme', appTheme)
    } catch {
      /* ignore */
    }
  }, [appTheme, htmlContent, loading])

  useEffect(() => {
    if (!topic || !file) return
    setLoading(true)
    setCurrentFile(file)
    setSidebarOpen(false)
    setSections([])
    setActiveSection('')
    setSectionsCollapsed(false)
    fetch(`${import.meta.env.BASE_URL}content/${topic}/${file}`)
      .then((r) => r.text())
      .then((html) => {
        setHtmlContent(withInjectedCss(html))
        setLoading(false)
      })
      .catch(() => {
        setHtmlContent('<h2>Content not found</h2>')
        setLoading(false)
      })
  }, [topic, file])

  const findTopicForFile = useCallback(
    (filename: string): ContentItem | undefined => {
      // Prefer the current topic if it contains this filename. Lesson filenames
      // are no longer globally unique (e.g. "3_projects_guide.html" exists in
      // several topics), and cross-lesson links are always within the same
      // topic — so resolve against the current topic first, then fall back.
      const current = topics.find((t) => t.path === topic)
      if (current?.children?.some((c) => c.path.split('/')[1] === filename)) return current
      return topics.find((t) => t.children?.some((c) => c.path.split('/')[1] === filename))
    },
    [topics, topic],
  )

  const scrollToSection = useCallback(
    (id: string) => {
      const doc = iframeRef.current?.contentDocument
      const el = doc?.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      if (isMobile) setSidebarOpen(false)
    },
    [isMobile],
  )

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current
    const doc = iframe?.contentDocument
    if (!doc) return

    try {
      doc.documentElement.setAttribute('data-theme', readAppTheme())
    } catch {
      /* ignore */
    }

    doc.addEventListener(
      'click',
      (e) => {
        const target = (e.target as HTMLElement).closest('a')
        if (!target) return
        const href = target.getAttribute('href')
        if (!href) return

        // In-page anchor (#section) → scroll within this lesson.
        if (href.startsWith('#')) {
          e.preventDefault()
          const el = doc.getElementById(href.slice(1))
          if (el) el.scrollIntoView({ behavior: 'smooth' })
          return
        }

        // Link to one of our lessons (e.g. "Go deeper → reference.html#methods").
        // Always navigate IN-APP, even if it has target="_blank".
        if (href.endsWith('.html') || href.includes('.html#')) {
          const filename = href.split('/').pop()!.split('#')[0]
          const anchor = href.includes('#') ? href.split('#')[1] : null
          const fileTopic = findTopicForFile(filename)
          if (fileTopic) {
            e.preventDefault()
            // Same lesson + anchor present → just scroll here.
            if (anchor && doc.getElementById(anchor)) {
              doc.getElementById(anchor)!.scrollIntoView({ behavior: 'smooth' })
              return
            }
            // Different lesson → navigate, then scroll to the anchor after load.
            pendingAnchorRef.current = anchor
            navigate(`/content/${fileTopic.path}/${filename}`)
            return
          }
          // Not one of our lessons (e.g. an external .html) → fall through.
        }

        // External links → open in a new tab (window.open runs in the parent).
        if (href.startsWith('http://') || href.startsWith('https://')) {
          e.preventDefault()
          window.open(href, '_blank', 'noopener')
          return
        }
      },
      true,
    )

    // Build the section list for the sidebar.
    try {
      const found = Array.from(doc.querySelectorAll<HTMLElement>('section.section[id]'))
        .map((el) => ({ id: el.id, label: deriveLabel(el, el.id) }))
        .filter((s) => s.id)
      setSections(found)

      if (found.length) {
        const win = doc.defaultView
        const spy = () => {
          let current = found[0].id
          for (const s of found) {
            const el = doc.getElementById(s.id)
            if (el && el.getBoundingClientRect().top <= 120) current = s.id
          }
          setActiveSection(current)
        }
        spy()
        win?.addEventListener('scroll', spy, { passive: true })
      }
    } catch {
      setSections([])
    }

    // If we arrived here via a cross-lesson link, scroll to the requested section.
    if (pendingAnchorRef.current) {
      const targetId = pendingAnchorRef.current
      pendingAnchorRef.current = null
      setTimeout(() => {
        const el = doc.getElementById(targetId)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 80)
    }
  }, [findTopicForFile, navigate])

  const currentTopic = topics.find((t) => t.path === topic)
  const fileList = currentTopic?.children || []
  const currentIndex = fileList.findIndex((f) => f.path.split('/')[1] === currentFile)
  const prevFile = currentIndex > 0 ? fileList[currentIndex - 1] : null
  const nextFile = currentIndex < fileList.length - 1 ? fileList[currentIndex + 1] : null

  return (
    <div className="content-viewer">
      <style>{SECTION_LIST_CSS}</style>

      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay visible" onClick={() => setSidebarOpen(false)} />
      )}
      <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <aside
        className={`viewer-sidebar ${
          isMobile ? (sidebarOpen ? 'open' : 'collapsed') : sidebarOpen ? '' : 'collapsed'
        }`}
      >
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
              <div key={f.path}>
                <button
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    navigate(`/content/${topic}/${fileName}`)
                    setSidebarOpen(false)
                  }}
                >
                  <span className="sidebar-num">{i + 1}</span>
                  {f.name}
                </button>

                {isActive && sections.length > 0 && (
                  <div className="vy-section-block">
                    <button
                      className="vy-section-head"
                      onClick={() => setSectionsCollapsed((c) => !c)}
                      aria-expanded={!sectionsCollapsed}
                      aria-label={sectionsCollapsed ? 'Show sections' : 'Hide sections'}
                    >
                      <span className="vy-chevron">{sectionsCollapsed ? '▶' : '▼'}</span>
                      On this page
                      <span className="vy-count">{sections.length}</span>
                    </button>

                    {!sectionsCollapsed && (
                      <div className="vy-section-list">
                        {sections.map((s) => (
                          <button
                            key={s.id}
                            className={`vy-section-link ${activeSection === s.id ? 'active' : ''}`}
                            onClick={() => scrollToSection(s.id)}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </aside>

      <div className="viewer-content">
        {loading ? (
          <div className="loading-screen">
            <div className="loading-spinner" />
          </div>
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
                <button
                  className="nav-btn prev"
                  onClick={() => navigate(`/content/${topic}/${prevFile.path.split('/')[1]}`)}
                >
                  ← Previous
                </button>
              ) : (
                <div />
              )}
              {nextFile ? (
                <button
                  className="nav-btn next"
                  onClick={() => navigate(`/content/${topic}/${nextFile.path.split('/')[1]}`)}
                >
                  Next →
                </button>
              ) : (
                <div />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
