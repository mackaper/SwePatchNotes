import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Betankande from './pages/Betankande'
import SaFunkarRiksdagen from './pages/SaFunkarRiksdagen'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="text-3xl font-black tracking-tight" style={{ color: '#003366' }}>
            Riksdags<span className="text-yellow-500">kollen</span>
          </Link>
          <nav>
            <Link to="/sa-funkar-riksdagen" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Så funkar riksdagen
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/betankande/:dok_id" element={<Betankande />} />
          <Route path="/sa-funkar-riksdagen" element={<SaFunkarRiksdagen />} />
        </Routes>
      </main>

      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-center text-gray-400 text-xs">
          © 2025 Riksdagskollen. Data från Sveriges Riksdag.
        </div>
      </footer>
    </div>
  )
}
