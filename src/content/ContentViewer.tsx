import { useState, useEffect } from 'react'
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

  useEffect(() => {
    getContentLibrary().then(setTopics)
  }, [])

  useEffect(() => {
    if (!topic || !file) return
    setLoading(true)
    setCurrentFile(file)
    fetch(`/content/${topic}/${file}`)
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
          {fileList.map((f) => {
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
              srcDoc={htmlContent}
              className="content-iframe"
              title="Content"
              sandbox="allow-scripts allow-same-origin"
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
