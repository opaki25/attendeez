import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ExternalLink, Sparkles, Github, Twitter, Instagram, Mail, ArrowUpRight, MessageCircle } from 'lucide-react'
import EventList from './components/EventList'
import EventDetail from './components/EventDetail'
import RSVP from './components/RSVP'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (path) => location.pathname === path

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
      {/* Glass container */}
      <div className={`relative rounded-2xl transition-all duration-500 ${
        scrolled 
          ? 'bg-white/[0.08] shadow-2xl shadow-black/40' 
          : 'bg-white/[0.05]'
      } backdrop-blur-xl border border-white/[0.15]`}>
        {/* Inner glow effects */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.15] to-transparent pointer-events-none"></div>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/[0.05] via-transparent to-cyan-500/[0.05] pointer-events-none"></div>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent skew-x-12 animate-shimmer"></div>
        </div>
        
        {/* Crystal edge highlights */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      
      <div className="relative px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src="/logoo.svg" 
              alt="Attendeez" 
              className="brand-logo w-10 h-10 object-contain"
            />
            <span className="brand-name text-xl">
              ATTENDEEZ
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => {
                if (location.pathname !== '/') {
                  navigate('/');
                  setTimeout(() => {
                    document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive('/') 
                  ? 'bg-white/15 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Events
            </button>
            <a
              href="/organizer"
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-1.5"
            >
              Organizer Portal
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <div className="w-px h-5 bg-white/10 mx-1"></div>
            <button
              onClick={() => {
                if (location.pathname !== '/') {
                  navigate('/');
                  setTimeout(() => {
                    document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-500 to-cyan-500 text-black hover:from-primary-400 hover:to-cyan-400 transition-all duration-300 shadow-lg shadow-primary-500/25 cursor-pointer"
            >
              Get Started
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 border border-white/10"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-6 border-t border-white/10 animate-fade-in">
            <nav className="flex flex-col space-y-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (location.pathname !== '/') {
                    navigate('/');
                    setTimeout(() => {
                      document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  } else {
                    document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`px-5 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 text-left ${
                  isActive('/') 
                    ? 'bg-white/10 text-white border border-white/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Events
              </button>
              <a
                href="/organizer"
                className="px-5 py-3.5 rounded-2xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 flex items-center gap-2"
              >
                Organizer Portal
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (location.pathname !== '/') {
                    navigate('/');
                    setTimeout(() => {
                      document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  } else {
                    document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-5 py-3.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-primary-500 to-cyan-500 text-black text-center mt-2 cursor-pointer w-full"
              >
                Get Started
              </button>
            </nav>
          </div>
        )}
      </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="relative bg-black border-t border-white/10 overflow-hidden">
      {/* Background elements */}
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-16 flex flex-col items-center text-center">
          {/* Brand */}
          <Link to="/" className="flex items-center space-x-4 mb-6">
            <img src="/logoo.svg" alt="Attendeez" className="brand-logo w-12 h-12 object-contain" />
            <span className="brand-name text-2xl">
              ATTENDEEZ
            </span>
          </Link>
          <p className="text-gray-400 leading-relaxed max-w-md mb-6">
            The modern platform for discovering and managing events. Join thousands creating unforgettable experiences.
          </p>
          <div className="flex items-center gap-4">
            {/* WhatsApp */}
            <a 
              href="https://wa.me/256777038299" 
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-12 h-12 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-green-500/20 hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/20"
              title="WhatsApp"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.15] to-transparent pointer-events-none"></div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-green-400 transition-colors relative z-10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
            {/* X (Twitter) */}
            <a 
              href="https://x.com/AttendeeZ_intl" 
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-12 h-12 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-white/20 hover:border-white/40 hover:shadow-lg hover:shadow-white/10"
              title="X"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.15] to-transparent pointer-events-none"></div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors relative z-10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            {/* Email */}
            <a 
              href="mailto:attendeez101@gmail.com" 
              className="group relative w-12 h-12 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-red-500/20 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/20"
              title="Email"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.15] to-transparent pointer-events-none"></div>
              <Mail className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors relative z-10" />
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/10 flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} ATTENDEEZ. All rights reserved.
          </p>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <span className="text-primary-400">📞</span> 0777038299
          </p>
          <p className="text-sm text-gray-400">
            Product of <span className="text-primary-400 font-semibold">ZCode</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<EventList />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/rsvp/:id" element={<RSVP />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
