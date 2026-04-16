import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { queueApi } from '../../services/api'
import { StatusBadge, Spinner } from '../../components/common/UI'
import { CheckCircle2, SkipForward, AlertTriangle, ArrowRight, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DoctorQueue() {
  const { user } = useAuth()
  const { on }   = useSocket()
  const [queue, setQueue]   = useState([])
  const [loading, setLoading] = useState(true)
  const [calling, setCalling] = useState(false)

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
    const u2 = on('doctor_assigned', fetchQueue)
    return () => { u1?.(); u2?.() }
  }, [on, user._id])

  const handleStatus = async (id, status) => {
    try {
      await queueApi.updateStatus(id, status)
      toast.success(`Marked as ${status}`)
    } catch { toast.error('Update failed') }
  }

  const handleEmergency = async (id) => {
    try {
      await queueApi.markEmergency(id)
      toast.success('Marked as emergency — moved to front', { icon: '⚡' })
    } catch { toast.error('Failed') }
  }

  const handleCallNext = async () => {
    setCalling(true)
    try {
      const { data } = await queueApi.callNextForDoctor()
      if (!data.next) toast('No more patients!', { icon: '✅' })
      else toast.success(`Calling #${data.next.tokenNumber}`)
    } catch { toast.error('Failed') } finally { setCalling(false) }
  }

  const current = queue.find(q => q.status === 'current')
  const waiting = queue.filter(q => q.status === 'waiting')

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-teal-500" /></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">My Queue</h1>
          <p className="text-slate-500 text-sm">{waiting.length} patients assigned to you</p>
        </div>
        <button onClick={handleCallNext} disabled={calling || waiting.length === 0}
          className="btn-primary text-xs py-2 px-4">
          {calling ? <Spinner className="w-3.5 h-3.5" /> : <><ArrowRight className="w-3.5 h-3.5" /> Next</>}
        </button>
      </div>

      {/* Current */}
      {current && (
        <div className="card p-5 border-l-4 border-l-teal-500" style={{borderRadius:'0 12px 12px 0'}}>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">In Consultation</p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 font-bold text-xl">
              #{current.tokenNumber}
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-slate-100">{current.displayName}</p>
              <p className="text-sm text-slate-500">{current.displayPhone}</p>
              <p className="text-xs text-slate-500">{current.department}</p>
              {current.symptoms && (
                <p className="text-xs text-slate-600 italic mt-1">"{current.symptoms}"</p>
              )}
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button onClick={() => handleStatus(current._id, 'completed')} className="btn-primary text-xs py-2 px-3">
                <CheckCircle2 className="w-3.5 h-3.5" /> Done
              </button>
              <button onClick={() => handleStatus(current._id, 'skipped')} className="btn-secondary text-xs py-2 px-3">
                <SkipForward className="w-3.5 h-3.5" /> Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waiting list */}
      {waiting.length === 0
        ? <div className="card p-10 text-center">
            <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No patients assigned</p>
            <p className="text-slate-600 text-sm mt-1">The receptionist will assign patients to you</p>
          </div>
        : <div className="card divide-y divide-slate-800/50">
            {waiting.map((appt, idx) => (
              <div key={appt._id}
                className={`flex items-center gap-4 p-4 ${appt.priority === 'emergency' ? 'bg-red-500/5' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  appt.priority === 'emergency' ? 'bg-red-500/10 text-red-400'
                    : idx === 0 ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {appt.priority === 'emergency' ? '⚡' : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-slate-300">#{appt.tokenNumber}</span>
                    <span className="text-slate-100 font-medium">{appt.displayName}</span>
                    {appt.priority === 'emergency' && (
                      <span className="text-xs px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-bold">EMERGENCY</span>
                    )}
                    {appt.isWalkIn && <span className="badge">Walk-in</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{appt.displayPhone}</p>
                  <p className="text-xs text-slate-500">{appt.department}</p>
                  {appt.symptoms && (
                    <p className="text-xs text-slate-600 mt-0.5 italic truncate">"{appt.symptoms}"</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => handleStatus(appt._id, 'current')}
                    className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors"
                    title="Set as current">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleEmergency(appt._id)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Mark emergency">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleStatus(appt._id, 'skipped')}
                    className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"
                    title="Skip">
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}
