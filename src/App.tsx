import { Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { PokedexPage } from './pages/PokedexPage'
import { TierPage } from './pages/TierPage'
import { TiersIndexPage } from './pages/TiersIndexPage'
import './styles/globals.css'

export default function App() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <Routes>
        <Route path="/" element={<PokedexPage />} />
        <Route path="/tiers" element={<TiersIndexPage />} />
        <Route path="/tiers/:slug" element={<TierPage />} />
      </Routes>
    </div>
  )
}
