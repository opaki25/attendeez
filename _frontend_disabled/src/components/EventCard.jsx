import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Clock, Image as ImageIcon } from 'lucide-react'
import { format, isPast, isToday, isTomorrow } from 'date-fns'

function getDateBadge(dateString) {
  if (!dateString) return null
  const date = new Date(dateString)
  
  if (isPast(date)) return { text: 'Past Event', class: 'bg-white/10 text-gray-400 border-white/10' }
  if (isToday(date)) return { text: '🔥 Today', class: 'bg-gradient-to-r from-primary-500/20 to-cyan-500/20 text-primary-300 border-primary-500/30' }
  if (isTomorrow(date)) return { text: 'Tomorrow', class: 'bg-primary-500/20 text-primary-400 border-primary-500/30' }
  return null
}

export default function EventCard({ event }) {
  const dateBadge = getDateBadge(event.datetime)
  const eventDate = event.datetime ? new Date(event.datetime) : null
  const endDate = event.end_datetime ? new Date(event.end_datetime) : null
  const isPastEvent = eventDate ? isPast(eventDate) : false

  return (
    <div className={`group h-full flex flex-col rounded-2xl overflow-hidden 
                     bg-white/[0.03] backdrop-blur-xl
                     border border-white/10
                     shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1)]
                     transition-all duration-300 
                     hover:border-primary-500/30 hover:shadow-xl hover:shadow-primary-500/5
                     hover:-translate-y-1
                     ${isPastEvent ? 'opacity-60' : ''}`}>
      
      {/* Image Section */}
      <div className="relative overflow-hidden">
        {event.poster ? (
          <img 
            src={event.poster} 
            alt={event.name} 
            className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-48 bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 grid-pattern opacity-20"></div>
            <div className="relative text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-2">
                <ImageIcon className="w-6 h-6 text-gray-600" />
              </div>
              <span className="text-xs text-gray-600">No image</span>
            </div>
          </div>
        )}
        
        {/* Date Badge */}
        {dateBadge && (
          <div className="absolute top-4 left-4">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${dateBadge.class}`}>
              {dateBadge.text}
            </span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center pb-6">
          <Link 
            to={`/event/${event.id}`}
            className="px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium 
                       translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500
                       hover:bg-white/20"
          >
            Quick View
          </Link>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1 text-center">
        {/* Event Title */}
        <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 group-hover:text-primary-400 transition-colors duration-300">
          {event.name}
        </h3>
        
        {/* Event Meta */}
        <div className="space-y-2 mb-4">
          {eventDate && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <span className="text-gray-300">{format(eventDate, 'EEE, MMM d, yyyy')}</span>
            </div>
          )}
          {eventDate && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="text-gray-300">
                {format(eventDate, 'h:mm a')}
                {endDate && ` - ${format(endDate, 'h:mm a')}`}
              </span>
            </div>
          )}
          {event.venue && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-400 truncate">{event.venue}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-2 mt-auto pt-4 border-t border-white/10">
          <Link 
            to={`/event/${event.id}`} 
            className="flex-1 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium text-center
                       hover:bg-white/10 transition-all duration-300"
          >
            Details
          </Link>
          {!isPastEvent && (
            <Link 
              to={`/rsvp/${event.id}`} 
              className="flex-1 px-3 py-2.5 rounded-lg bg-gradient-to-r from-primary-500 to-cyan-500 text-black text-sm font-semibold text-center
                         shadow-lg shadow-primary-500/20
                         hover:from-primary-400 hover:to-cyan-400 transition-all duration-300"
            >
              RSVP
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

