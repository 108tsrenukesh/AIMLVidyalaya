import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getContentLibrary, getTopicDescription, type ContentItem } from '../utils/content'

export default function ContentLibrary() {
  const [topics, setTopics] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getContentLibrary().then((t) => {
      setTopics(t)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner" /></div>
  }

  return (
    <div className="content-library">
      <div className="library-header">
        <h1>Topics</h1>
        <p>Choose a topic to start learning</p>
      </div>
      <div className="topic-grid">
        {topics.map((topic) => (
          <div key={topic.path} className="topic-card" onClick={() => navigate(`/content/${topic.path}/${topic.children?.[0]?.path.split('/')[1] || ''}`)}>
            <div className="topic-icon">
              {topic.path === 'clustering' ? '◎' : '⬡'}
            </div>
            <h2>{topic.name}</h2>
            <p>{getTopicDescription(topic.path)}</p>
            <div className="topic-count">{topic.children?.length || 0} lessons</div>
          </div>
        ))}
      </div>
    </div>
  )
}
