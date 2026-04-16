import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { appointmentApi, feedbackApi } from '../../services/api'
import { StatusBadge, StarRating, EmptyState, Spinner } from '../../components/common/UI'
import { CalendarDays, X, MessageSquare, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const DEPT_ICONS = {
  'Cardiology':'🫀','Orthopedics':'🦴','Neurology':'🧠','General Medicine':'🩺',
  'Pediatrics':'👶','Dermatology':'🧴','ENT':'👂','Gynecology':'🌸','Ophthalmology':'👁','Psychiatry':'🧘',
}

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [feedback, setFeedback] = useState(null)
  const navigate = useNavigate()

  const fetch = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const { data } = await appointmentApi.getMy({ ...params, limit: 50 })
      setAppointments(data.appointments)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [filter])

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return
    try {
      await appointmentApi.cancel(id)
      toast.success('Appointment cancelled')
      fetch()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const tabs = [
    { val: 'all',       label: 'All' },
    { val: 'waiting',   label: 'Waiting' },
    { val: 'current',   label: 'In Progress' },
    { val: 'completed', label: 'Completed' },
    { val: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-100">My Appointments</h1>
        <p className="text-slate-500 text-sm">Full appointment history</p>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {tabs.map(t => (
          <button key={t.val} onClick={() => setFilter(t.val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === t.val ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}>{t.label}</button>
        ))}
      </div>

      {loading
        ? <div className="flex justify-center py-16"><Spinner className="w-8 h-8 text-teal-500" /></div>
        : appointments.length === 0
          ? <EmptyState icon={CalendarDays} title="No appointments found"
              action={<Link to="/patient/hospitals" className="btn-primary">Find Hospitals</Link>} />
          : <div className="space-y-3">
              {appointments.map(appt => (
                <div key={appt._id} className="card p-5 animate-fade-in">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                        appt.status === 'current' ? 'bg-teal-500/10 text-teal-400' :
                        appt.status === 'waiting' ? 'bg-amber-500/10 text-amber-400' :
                        appt.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                        'bg-slate-800 text-slate-500'
                      }`}>
                        #{appt.tokenNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{DEPT_ICONS[appt.department] || '🏥'}</span>
                          <p className="font-semibold text-slate-100">{appt.department}</p>
                        </div>
                        <p className="text-xs text-slate-500">{appt.hospital?.name}</p>
                        {appt.doctor
                          ? <p className="text-xs text-blue-400 mt-0.5">Dr. {appt.doctor.name}</p>
                          : <p className="text-xs text-slate-600 mt-0.5">Doctor not yet assigned</p>
                        }
                        <p className="text-xs text-slate-600">{new Date(appt.appointmentDate).toLocaleString()}</p>
                      </div>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>

                  {appt.status === 'waiting' && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-slate-800 px-3 py-2 text-center">
                        <p className="text-xs text-slate-500">Ahead of you</p>
                        <p className="font-bold text-slate-100">{appt.patientsAhead ?? '—'}</p>
                      </div>
                      <div className="rounded-lg bg-slate-800 px-3 py-2 text-center">
                        <p className="text-xs text-slate-500">Est. wait</p>
                        <p className="font-bold text-amber-400">
                          {appt.estimatedWaitTime > 0 ? `${appt.estimatedWaitTime}m` : 'Soon'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex gap-2 flex-wrap">
                    {['waiting', 'current'].includes(appt.status) && appt.hospital?._id && (
                      <button
                        onClick={() => navigate(`/patient/queue/${appt.hospital._id}/${encodeURIComponent(appt.department)}`)}
                        className="btn-secondary text-xs py-1.5">
                        <Users className="w-3.5 h-3.5" /> Live Queue
                      </button>
                    )}
                    {appt.status === 'waiting' && (
                      <button onClick={() => handleCancel(appt._id)}
                        className="btn text-xs py-1.5 text-red-400 bg-red-500/10 hover:bg-red-500/20">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                    {appt.status === 'completed' && !appt.feedback && (
                      <button onClick={() => setFeedback(appt)}
                        className="btn-secondary text-xs py-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Leave Feedback
                      </button>
                    )}
                    {appt.feedback && (
                      <span className="text-xs text-teal-400 flex items-center gap-1">✓ Feedback given</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
      }

      {feedback && (
        <FeedbackModal appt={feedback}
          onClose={() => setFeedback(null)}
          onDone={() => { setFeedback(null); fetch() }} />
      )}
    </div>
  )
}

function FeedbackModal({ appt, onClose, onDone }) {
  const [rating, setRating]   = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving]   = useState(false)

  const submit = async () => {
    if (!rating) return toast.error('Please select a rating')
    if (!appt.doctor) return toast.error('No doctor assigned to rate')
    setSaving(true)
    try {
      await feedbackApi.submit({ appointmentId: appt._id, rating, comment })
      toast.success('Thank you for your feedback!')
      onDone()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-100">Rate your visit</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          {appt.doctor
            ? <>How was your experience with <strong className="text-slate-200">Dr. {appt.doctor.name}</strong>?</>
            : <>Rate your visit to <strong className="text-slate-200">{appt.department}</strong></>
          }
        </p>
        <div className="flex justify-center mb-5">
          <StarRating rating={rating} interactive onChange={setRating} size="lg" />
        </div>
        <textarea className="field-input resize-none h-24 mb-4"
          placeholder="Share your experience..."
          value={comment} onChange={e => setComment(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={submit} disabled={saving || !rating} className="btn-primary flex-1">
            {saving ? <Spinner /> : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
