import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  ArrowLeft, ArrowRight, Calendar, MapPin, Clock, User, Mail, 
  Phone, Briefcase, Search, CheckCircle2, Loader2, UserPlus, 
  UserCheck, Sparkles, PartyPopper, Star, ChevronDown
} from 'lucide-react'
import { format } from 'date-fns'

export default function RSVP() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [attendeeType, setAttendeeType] = useState('new')
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    contact: '', 
    status: 'Student', 
    attendee_id: '' 
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)

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

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  function handleSearch(e) {
    const q = e.target.value
    setSearchQuery(q)
    
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    
    setSearchLoading(true)
    axios.get(`/search_attendee?q=${encodeURIComponent(q)}`)
      .then(r => {
        setSearchResults(r.data.results)
        setSearchLoading(false)
      })
      .catch(() => {
        setSearchResults([])
        setSearchLoading(false)
      })
  }

  function pickResult(a) {
    setForm({
      name: a.name,
      email: a.email,
      contact: a.contact || '',
      status: a.status,
      attendee_id: a.id
    })
    setSearchResults([])
    setSearchQuery('')
  }

  function validate() {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!form.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function submit(e) {
    e.preventDefault()
    
    if (!validate()) return
    
    setSubmitting(true)
    axios.post('/api/rsvp', { ...form, event_id: id })
      .then(r => {
        if (r.data.success) {
          setSuccess(true)
        }
        setSubmitting(false)
      })
      .catch(err => {
        setSubmitting(false)
        const errorMessage = err.response?.data?.error || 'Failed to submit RSVP. Please try again.'
        setErrors({ submit: errorMessage })
      })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black pt-20">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin"></div>
            <Sparkles className="w-6 h-6 text-primary-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-400 mt-6">Loading...</p>
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
          <p className="text-gray-400 mb-10">The event you're looking for doesn't exist.</p>
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

  // Success State
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4 pt-20 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-[120px]"></div>
        </div>
        
        <div className="relative max-w-lg mx-auto text-center animate-scale-in">
          {/* Success Icon */}
          <div className="relative mb-10">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 mx-auto flex items-center justify-center shadow-2xl shadow-primary-500/40">
              <PartyPopper className="w-16 h-16 text-black" />
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-cyan-500/30 flex items-center justify-center animate-bounce">
              <Star className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="absolute -bottom-2 -left-2 w-10 h-10 rounded-full bg-primary-500/30 flex items-center justify-center animate-pulse">
              <Sparkles className="w-5 h-5 text-primary-400" />
            </div>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-4">You're All Set!</h2>
          <p className="text-xl text-gray-300 mb-2">
            Your RSVP for <span className="font-semibold gradient-text">{event.name}</span> has been confirmed.
          </p>
          <p className="text-gray-500 mb-10">
            We'll send a confirmation email to <span className="text-primary-400">{form.email}</span>
          </p>
          
          {/* Event Card */}
          <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1)] mb-10">
            <h3 className="font-semibold text-white mb-6 text-lg text-center">Event Details</h3>
            <div className="space-y-4">
              {eventDate && (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-primary-400" />
                  </div>
                  <span className="text-gray-300">{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
                </div>
              )}
              {eventDate && (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-gray-300">
                    {format(eventDate, 'h:mm a')}
                    {endDate && ` - ${format(endDate, 'h:mm a')}`}
                  </span>
                </div>
              )}
              {event.venue && (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </div>
                  <span className="text-gray-300">{event.venue}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={`/event/${event.id}`} className="btn-secondary">
              View Event Details
            </Link>
            <Link to="/" className="btn-primary">
              Browse More Events
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in bg-black min-h-screen pt-20">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 grid-pattern opacity-20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[150px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 mb-6 group text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-cyan-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Reserve Your Spot</h1>
              <p className="text-sm text-gray-400">Complete the form below to RSVP</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="p-6 md:p-8 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1)]">
              {/* Attendee Type Selection */}
              <div className="mb-8">
                <label className="text-sm font-medium text-gray-300 mb-3 block">Are you a new or returning attendee?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAttendeeType('new')
                      setForm({ name: '', email: '', contact: '', status: 'Student', attendee_id: '' })
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 group ${
                      attendeeType === 'new'
                        ? 'border-primary-500 bg-gradient-to-br from-primary-500/20 to-cyan-500/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      attendeeType === 'new' 
                        ? 'bg-gradient-to-br from-primary-500 to-cyan-500' 
                        : 'bg-white/5 border border-white/10'
                    }`}>
                      <UserPlus className={`w-5 h-5 ${attendeeType === 'new' ? 'text-black' : 'text-gray-400'}`} />
                    </div>
                    <span className={`text-sm font-medium ${attendeeType === 'new' ? 'text-white' : 'text-gray-300'}`}>New Attendee</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendeeType('returning')}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 group ${
                      attendeeType === 'returning'
                        ? 'border-primary-500 bg-gradient-to-br from-primary-500/20 to-cyan-500/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      attendeeType === 'returning' 
                        ? 'bg-gradient-to-br from-primary-500 to-cyan-500' 
                        : 'bg-white/5 border border-white/10'
                    }`}>
                      <UserCheck className={`w-5 h-5 ${attendeeType === 'returning' ? 'text-black' : 'text-gray-400'}`} />
                    </div>
                    <span className={`text-sm font-medium ${attendeeType === 'returning' ? 'text-white' : 'text-gray-300'}`}>Returning</span>
                  </button>
                </div>
              </div>

              {/* Search for Returning Attendee */}
              {attendeeType === 'returning' && (
                <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Search for your profile</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Type your name to search..."
                      value={searchQuery}
                      onChange={handleSearch}
                      className="input pl-11"
                    />
                    {searchLoading && (
                      <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400 animate-spin" />
                    )}
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/10">
                      {searchResults.map(a => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => pickResult(a)}
                          className="w-full px-5 py-4 text-left hover:bg-primary-500/10 transition-all duration-300 flex items-center gap-4"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/20 to-cyan-500/20 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{a.name}</p>
                            <p className="text-sm text-gray-500">{a.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
                    <p className="mt-4 text-sm text-gray-500 text-center py-4">
                      No matching profiles found. Fill in the form below to create one.
                    </p>
                  )}
                </div>
              )}

              {/* Form */}
              <form onSubmit={submit} className="space-y-5">
                {errors.submit && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {errors.submit}
                  </div>
                )}

                <input type="hidden" name="attendee_id" value={form.attendee_id} />

                {/* Name */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2 block">
                    <User className="w-4 h-4 text-gray-500" />
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={`input ${errors.name ? 'border-red-500/50 focus:ring-red-500/50' : ''}`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2 block">
                    <Mail className="w-4 h-4 text-gray-500" />
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={`input ${errors.email ? 'border-red-500/50 focus:ring-red-500/50' : ''}`}
                  />
                  {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email}</p>}
                </div>

                {/* Contact */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2 block">
                    <Phone className="w-4 h-4 text-gray-500" />
                    Phone Number <span className="text-gray-600 text-xs">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    name="contact"
                    value={form.contact}
                    onChange={handleChange}
                    placeholder="Your phone number"
                    className="input"
                  />
                </div>

                {/* Status */}
                <div className="relative">
                  <label className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2 block">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    className="input w-full flex items-center justify-between text-left"
                  >
                    <span>{form.status === 'Working' ? 'Working Professional' : form.status}</span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {statusDropdownOpen && (
                    <div className="absolute z-50 mt-2 w-full rounded-xl bg-gray-800 border border-white/10 shadow-xl shadow-black/50 overflow-hidden">
                      {[
                        { value: 'Student', label: 'Student' },
                        { value: 'Working', label: 'Working Professional' },
                        { value: 'Other', label: 'Other' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setForm(prev => ({ ...prev, status: option.value }))
                            setStatusDropdownOpen(false)
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-primary-500/20 transition-colors
                                      ${form.status === option.value ? 'bg-primary-500/10 text-primary-400' : 'text-gray-200'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-primary-500 to-cyan-500 text-black font-semibold text-lg
                             flex items-center justify-center gap-3 shadow-xl shadow-primary-500/30
                             hover:from-primary-400 hover:to-cyan-400 hover:shadow-primary-500/40 hover:scale-[1.02]
                             transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Confirm Attendance
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar - Event Info */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1)] overflow-hidden sticky top-28">
              {/* Event Image */}
              {event.poster ? (
                <img 
                  src={event.poster} 
                  alt={event.name} 
                  className="w-full h-52 object-cover"
                />
              ) : (
                <div className="h-52 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 grid-pattern opacity-20"></div>
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gray-600" />
                  </div>
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-6">{event.name}</h3>
                
                <div className="space-y-4">
                  {eventDate && (
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-primary-400" />
                      </div>
                      <span className="text-gray-300 text-sm">{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                  )}
                  {eventDate && (
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-cyan-400" />
                      </div>
                      <span className="text-gray-300 text-sm">
                        {format(eventDate, 'h:mm a')}
                        {endDate && ` - ${format(endDate, 'h:mm a')}`}
                      </span>
                    </div>
                  )}
                  {event.venue && (
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-gray-400" />
                      </div>
                      <span className="text-gray-300 text-sm">{event.venue}</span>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <Link 
                    to={`/event/${event.id}`}
                    className="text-sm text-primary-400 hover:text-primary-300 font-medium flex items-center gap-2 group"
                  >
                    View event details
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

