import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  Calendar, MapPin, Clock, ArrowLeft, ArrowRight, Share2, 
  Image as ImageIcon, CheckCircle2, Loader2, Users, Star, Sparkles
} from 'lucide-react'
import { format, isPast } from 'date-fns'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    axios.get(`/api/events/${id}`)
      .then(r => {
        setEvent(r.data)
        setLoading(false)
      })
      .catch(() => {
        setEvent(null)
        setLoading(false)
      })
  }, [id])

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black pt-20">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin"></div>
            <Sparkles className="w-6 h-6 text-primary-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-400 mt-6">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black pt-20">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8">
            <Calendar className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Event Not Found</h2>
          <p className="text-gray-400 mb-10">The event you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="btn-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  const eventDate = event.datetime ? new Date(event.datetime) : null
  const endDate = event.end_datetime ? new Date(event.end_datetime) : null
  const isPastEvent = eventDate ? isPast(eventDate) : false

  return (
    <div className="animate-fade-in bg-black min-h-screen pt-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 grid-pattern opacity-20"></div>
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary-500/15 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 mb-8 group text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Events</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Content */}
            <div className="order-2 lg:order-1">
              {isPastEvent && (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700 text-gray-400 text-sm mb-6">
                  <Clock className="w-4 h-4" />
                  This event has ended
                </span>
              )}
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-8 leading-tight">
                {event.name}
              </h1>

              {/* Event Info Cards */}
              <div className="grid grid-cols-1 gap-4 mb-10">
                {eventDate && (
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-white/[0.05] to-transparent border border-white/10 backdrop-blur-sm group hover:border-primary-500/30 transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-cyan-500/20 border border-primary-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Date</p>
                      <p className="text-lg text-white font-semibold">{format(eventDate, 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                  </div>
                )}
                
                {eventDate && (
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-white/[0.05] to-transparent border border-white/10 backdrop-blur-sm group hover:border-cyan-500/30 transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-primary-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Clock className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Time</p>
                      <p className="text-lg text-white font-semibold">
                        {format(eventDate, 'h:mm a')}
                        {endDate && ` - ${format(endDate, 'h:mm a')}`}
                      </p>
                    </div>
                  </div>
                )}
                
                {event.venue && (
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-white/[0.05] to-transparent border border-white/10 backdrop-blur-sm group hover:border-white/20 transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <MapPin className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Venue</p>
                      <p className="text-lg text-white font-semibold">{event.venue}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                {!isPastEvent && (
                  <Link 
                    to={`/rsvp/${event.id}`} 
                    className="px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-gradient-to-r from-primary-500 to-cyan-500 text-black font-semibold 
                               flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 text-sm sm:text-base
                               hover:from-primary-400 hover:to-cyan-400 hover:shadow-xl hover:shadow-primary-500/40 
                               hover:scale-105 transition-all duration-300"
                  >
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    RSVP Now
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                <button 
                  onClick={handleShare}
                  className={`px-5 sm:px-6 py-3 sm:py-4 rounded-full border font-medium flex items-center justify-center gap-2 transition-all duration-300 text-sm sm:text-base
                    ${copied 
                      ? 'bg-green-500/20 border-green-500/30 text-green-400' 
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  {copied ? 'Link Copied!' : 'Share Event'}
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="order-1 lg:order-2 lg:sticky lg:top-32">
              {event.poster ? (
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10 group">
                  <img 
                    src={event.poster} 
                    alt={event.name} 
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-900 to-black rounded-3xl flex items-center justify-center border border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 grid-pattern opacity-20"></div>
                  <div className="relative text-center">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="w-10 h-10 text-gray-600" />
                    </div>
                    <span className="text-gray-600">No event image</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="relative py-20">
        <div className="absolute inset-0 dot-pattern opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-500/20 to-cyan-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">About This Event</h2>
            </div>
            
            <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1)]">
              {event.description ? (
                <p className="text-gray-300 leading-relaxed text-base sm:text-lg whitespace-pre-wrap">
                  {event.description}
                </p>
              ) : (
                <p className="text-gray-500 italic">No description provided for this event.</p>
              )}
            </div>
          </div>

          {/* CTA Section */}
          {!isPastEvent && (
            <div className="mt-12 sm:mt-20 p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-primary-500/10 via-cyan-500/10 to-primary-500/10 border border-primary-500/20 relative overflow-hidden">
              <div className="absolute inset-0 grid-pattern opacity-20"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-[100px]"></div>
              
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 text-center md:text-left">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Ready to attend?</h3>
                  <p className="text-gray-400 text-base sm:text-lg">Secure your spot now and don't miss this amazing event!</p>
                </div>
                <Link 
                  to={`/rsvp/${event.id}`} 
                  className="px-8 sm:px-10 py-4 sm:py-5 rounded-full bg-gradient-to-r from-primary-500 to-cyan-500 text-black font-semibold 
                             flex items-center gap-2 sm:gap-3 shadow-xl shadow-primary-500/30 whitespace-nowrap text-sm sm:text-base
                             hover:from-primary-400 hover:to-cyan-400 hover:scale-105 transition-all duration-300"
                >
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  RSVP Now
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

