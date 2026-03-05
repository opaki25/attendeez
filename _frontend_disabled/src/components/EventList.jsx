import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Search, Calendar, Sparkles, Zap, Shield, Users, ArrowRight } from 'lucide-react'
import EventCard from './EventCard'

export default function EventList() {
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState({ total_events: 0, total_attendees: 0, total_rsvps: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    // Fetch events and stats in parallel
    Promise.all([
      axios.get('/api/events'),
      axios.get('/api/stats')
    ])
      .then(([eventsRes, statsRes]) => {
        setEvents(eventsRes.data)
        setStats(statsRes.data)
        setLoading(false)
      })
      .catch(() => {
        setEvents([])
        setLoading(false)
      })
  }, [])

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterType === 'all') return matchesSearch
    
    const eventDate = new Date(event.datetime)
    const now = new Date()
    
    if (filterType === 'upcoming') return matchesSearch && eventDate >= now
    if (filterType === 'past') return matchesSearch && eventDate < now
    
    return matchesSearch
  })

  const features = [
    {
      icon: Zap,
      title: 'Instant RSVP',
      description: 'Register for events in seconds with our streamlined process'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Your data is protected with enterprise-grade security'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Connect with like-minded people at amazing events'
    }
  ]

  return (
    <div className="animate-fade-in">
      {/* Hero Section - Clean & Professional */}
      <div className="relative min-h-screen flex items-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-black">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 grid-pattern opacity-30"></div>
          
          {/* Floating glow orbs - more subtle */}
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary-500/20 rounded-full blur-[150px] animate-glow-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] bg-cyan-500/15 rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Abstract 3D shape - better positioned */}
          <div className="absolute right-[5%] top-1/2 transform -translate-y-1/2 hidden xl:block">
            <div className="relative w-[350px] h-[350px]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/30 via-cyan-500/25 to-primary-600/30 animate-morph animate-float"></div>
              <div className="absolute inset-10 bg-gradient-to-tr from-cyan-400/25 via-primary-500/15 to-transparent animate-morph" style={{ animationDelay: '1s' }}></div>
              <div className="absolute inset-20 bg-gradient-to-bl from-primary-400/30 to-transparent animate-morph" style={{ animationDelay: '2s' }}></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-32 pb-24 w-full">
          <div className="flex flex-col items-center text-center gap-16">
            {/* Text content */}
            <div className="flex-1">
              {/* Main heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] animate-slide-up">
                <span className="text-white">Discover &</span>
                <br />
                <span className="gradient-text">Experience</span>
                <br />
                <span className="text-white">Amazing Events</span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 text-lg md:text-xl text-gray-400 leading-relaxed animate-slide-up max-w-lg mx-auto" style={{ animationDelay: '0.2s' }}>
                The modern way to find, join, and manage events. Seamless registration, beautiful experiences.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-wrap justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <a href="#events" className="btn-primary group">
                  Explore Events
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-shrink-0 animate-slide-up w-full max-w-lg mx-auto" style={{ animationDelay: '0.4s' }}>
              <div className="grid grid-cols-3 gap-4 sm:gap-8 lg:gap-12">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{stats.total_events}</div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-1">Events Hosted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">500+</div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-1">Happy Attendees</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">99%</div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-1">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-primary-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Trusted By Section */}
      <div className="relative py-8 border-y border-white/5 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-6">
            <p className="text-xs text-gray-500 uppercase tracking-widest">Trusted by leading organizations</p>
            <div className="flex items-center gap-8 md:gap-12 opacity-40">
              {['Odd Shoes', 'Blue Ox Kampus', 'ZCode'].map((company, i) => (
                <span key={i} className="text-sm font-medium text-gray-400 whitespace-nowrap">{company}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-black relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20"></div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[600px] h-[300px] bg-primary-500/10 rounded-full blur-[150px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Unlock the Full Potential of
              <span className="gradient-text"> Your Events</span>
            </h2>
            <p className="mt-3 text-base text-gray-400 max-w-xl mx-auto">
              Tools and insights to create unforgettable experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="feature-card group animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-cyan-500/20 flex items-center justify-center mb-4 border border-primary-500/30 group-hover:scale-110 transition-transform duration-500 mx-auto">
                  <feature.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 text-center">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed text-center">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div id="events" className="py-20 bg-gradient-to-b from-black via-gray-950 to-black relative">
        <div className="absolute inset-0 dot-pattern opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Upcoming <span className="gradient-text">Experiences</span>
            </h2>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-10 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-12"
              />
            </div>
            
            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
              {['all', 'upcoming', 'past'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    filterType === type 
                      ? 'bg-gradient-to-r from-primary-500 to-cyan-500 text-black shadow-lg shadow-primary-500/30' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'upcoming' ? 'Upcoming' : 'Past'}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-center mb-8">
            <p className="text-sm text-gray-400">
              {loading ? 'Loading events...' : (
                <>
                  Showing <span className="font-semibold text-white">{filteredEvents.length}</span> event{filteredEvents.length !== 1 ? 's' : ''}
                  {searchTerm && <span className="text-primary-400"> for "{searchTerm}"</span>}
                </>
              )}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="card animate-pulse">
                  <div className="h-56 bg-white/5"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-white/5 rounded-full w-3/4"></div>
                    <div className="h-4 bg-white/5 rounded-full w-1/2"></div>
                    <div className="h-4 bg-white/5 rounded-full w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Events Grid */}
          {!loading && filteredEvents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event, index) => (
                <div 
                  key={event.id} 
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredEvents.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/5 border border-white/10 mb-8">
                <Calendar className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">No events found</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                {searchTerm 
                  ? `We couldn't find any events matching "${searchTerm}". Try adjusting your search.`
                  : "There are no events to display at the moment. Check back soon!"}
              </p>
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="btn-secondary mt-8">
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-cyan-500/5 to-primary-500/5"></div>
        
        <div className="relative max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            Join thousands of event enthusiasts and never miss out.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#events" className="btn-primary">
              Start Exploring
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
            <a href="/organizer" className="btn-secondary">
              Become an Organizer
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

