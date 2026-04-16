import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { queueApi } from '../../services/api'
import { StatCard, StarRating, Spinner } from '../../components/common/UI'
import { Users, Clock, CheckCircle2, Power, ArrowRight, SkipForward, Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DoctorDashboard() {
  const { user, setUser } = useAuth()
  const { on } = useSocket()
  const [queue, setQueue]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [calling, setCalling]   = useState(false)
  const [toggling, setToggling] = useState(false)

  const fetchQueue = async () => {
    try {
      const { data } = await queueApi.getMyDoctorQueue()
      setQueue(data.queue)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    fetchQueue()
    const u1 = on('doctor_queue_updated', (data) => {
      if (data.doctorId === user._id) setQueue(data.queue)
    })
    const u2 = on('doctor_assigned', () => fetchQueue())
    return () => { u1?.(); u2?.() }
  }, [on, user._id])

  const handleCallNext = async () => {
    setCalling(true)
    try {
      const { data } = await queueApi.callNextForDoctor()
      if (!data.next) toast('Your queue is empty!', { icon: '✅' })
      else toast.success(`Calling: Token #${data.next.tokenNumber} — ${data.next.displayName || data.next.patient?.name}`)
    } catch { toast.error('Failed') } finally { setCalling(false) }
  }

  const handleStatus = async (apptId, status) => {
    try {
      await queueApi.updateStatus(apptId, status)
      toast.success(`Marked as ${status}`)
    } catch { toast.error('Failed') }
  }

  const handleToggle = async () => {
    setToggling(true)
    try {
      const { data } = await queueApi.toggleAvailability()
      setUser(prev => ({ ...prev, isAvailable: data.isAvailable }))
      toast.success(data.isAvailable ? 'You are now available' : 'You are now offline')
    } catch { toast.error('Failed') } finally { setToggling(false) }
  }

  const current = queue.find(q => q.status === 'current')
  const waiting = queue.filter(q => q.status === 'waiting')

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-teal-500" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">
            Welcome, <span className="text-gradient">{user?.name}</span>
          </h1>
          <p className="text-slate-500 text-sm">{user?.department} · {user?.specialization}</p>
          <StarRating rating={user?.avgRating || 0} />
        </div>
        <button onClick={handleToggle} disabled={toggling}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-all ${
            user?.isAvailable
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 hover:bg-teal-500/20'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
          }`}>
          {toggling ? <Spinner className="w-4 h-4" /> : <Power className="w-4 h-4" />}
          {user?.isAvailable ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Assigned"   value={queue.length}  icon={Users}        color="amber" />
        <StatCard label="In Queue"   value={waiting.length} icon={Clock}       color="blue"  />
        <StatCard label="Rating"     value={`${user?.avgRating || 0}★`} icon={CheckCircle2} color="teal" />
        <StatCard label="Status"     value={user?.isAvailable ? 'Active' : 'Offline'} icon={Power}
          color={user?.isAvailable ? 'green' : 'red'} />
      </div>

      {/* Current patient */}
      {current
        ? <div className="card p-5 border-l-4 border-l-teal-500" style={{borderRadius:'0 12px 12px 0'}}>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Currently Seeing</p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 font-bold text-2xl">
                #{current.tokenNumber}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-100 text-lg">{current.displayName}</p>
                <p className="text-sm text-slate-500">{current.displayPhone}</p>
                <p className="text-xs text-slate-500">{current.department}</p>
                {current.symptoms && (
                  <p className="text-xs text-slate-600 mt-1 italic">"{current.symptoms}"</p>
                )}
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button onClick={() => handleStatus(current._id, 'completed')} className="btn-primary text-xs py-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                </button>
                <button onClick={() => handleStatus(current._id, 'skipped')} className="btn-secondary text-xs py-2">
                  <SkipForward className="w-3.5 h-3.5" /> Skip
                </button>
              </div>
            </div>
          </div>
        : <div className="card p-6 text-center border-dashed">
            <Stethoscope className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No patient in consultation</p>
            {!user?.isAvailable && (
              <p className="text-xs text-amber-400 mt-1">You are currently offline</p>
            )}
          </div>
      }

      {/* Call next button */}
      <button onClick={handleCallNext} disabled={calling || waiting.length === 0}
        className="btn-primary w-full py-3.5 text-base">
        {calling ? <Spinner /> : <><ArrowRight className="w-5 h-5" /> Call Next Patient ({waiting.length} waiting)</>}
      </button>

      {/* Upcoming */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Assigned Queue ({waiting.length})</h2>
          <Link to="/doctor/queue" className="text-teal-400 text-sm hover:text-teal-300 flex items-center gap-1">
            Full View <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {waiting.length === 0
          ? <div className="card p-6 text-center text-slate-500 text-sm">No patients assigned to you yet</div>
          : <div className="space-y-1">
              {waiting.slice(0, 5).map((appt, i) => (
                <div key={appt._id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                  <span className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">
                      #{appt.tokenNumber} — {appt.displayName}
                    </p>
                    <p className="text-xs text-slate-600">{appt.symptoms || 'No symptoms noted'}</p>
                  </div>
                  {appt.priority === 'emergency' && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded">EMRG</span>
                  )}
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  )
}
