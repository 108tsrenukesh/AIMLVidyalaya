import { HashRouter, Routes, Route } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'
import ContentLibrary from './content/ContentLibrary'
import ContentViewer from './content/ContentViewer'
import Layout from './components/Layout'
import UpdatePrompt from './components/UpdatePrompt'

export default function App() {
  return (
    <HashRouter>
      <UpdatePrompt />
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/" element={<Layout />}>
          <Route path="library" element={<ContentLibrary />} />
          <Route path="content/:topic/:file" element={<ContentViewer />} />
        </Route>
        <Route path="*" element={<WelcomePage />} />
      </Routes>
    </HashRouter>
  )
}
