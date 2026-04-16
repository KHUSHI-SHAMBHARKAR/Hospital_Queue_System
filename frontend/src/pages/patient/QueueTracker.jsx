import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'
import { queueApi } from '../../services/api'
import { StatusBadge, Spinner } from '../../components/common/UI'
import { Clock, Wifi, WifiOff, AlertTriangle, Users, ArrowLeft, Stethoscope } from 'lucide-react'

export default function QueueTracker() {
  const { hospitalId, department } = useParams()
  const { user } = useAuth()
  const { on, joinDeptRoom, leaveDeptRoom, connected } = useSocket()
  const navigate = useNavigate()

  const deptDecoded = decodeURIComponent(department)

  const [queue, setQueue]       = useState([])
  const [doctors, setDoctors]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [alerts, setAlerts]     = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchQueue = useCallback(async () => {
    try {
      const { data } = await queueApi.getDeptQueue(hospitalId, deptDecoded)
      setQueue(data.queue)
      setDoctors(data.doctors || [])
      setLastUpdated(new Date())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [hospitalId, deptDecoded])

  useEffect(() => {
    fetchQueue()
    joinDeptRoom(hospitalId, deptDecoded)
    return () => leaveDeptRoom(hospitalId, deptDecoded)
  }, [hospitalId, deptDecoded])

  useEffect(() => {
    const u1 = on('queue_updated', (data) => {
      if (data.hospitalId === hospitalId && data.department === deptDecoded) {
        setQueue(data.queue)
        setLastUpdated(new Date(data.timestamp))
      }
    })
    const u2 = on('emergency_alert', (data) => {
      setAlerts(p => [data, ...p].slice(0, 3))
      setTimeout(() => setAlerts(p => p.slice(1)), 7000)
    })
    const u3 = on('patient_called', (data) => {
      if (data.department === deptDecoded) fetchQueue()
    })
    return () => { u1?.(); u2?.(); u3?.() }
  }, [on, hospitalId, deptDecoded])

  // Find current user's position in queue
  const myToken = queue.find(q => q.patient?._id === user?._id)
  const current  = queue.find(q => q.status === 'current')
  const waiting  = queue.filter(q => q.status === 'waiting')

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-teal-500" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-100">Live Queue</h1>
          <p className="text-sm text-slate-500">{deptDecoded}</p>
        </div>
        <span className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
          connected ? 'text-teal-400 border-teal-500/30 bg-teal-500/10' : 'text-slate-500 border-slate-700 bg-slate-800'
        }`}>
          {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {connected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Alerts */}
      {alerts.map((a, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm animate-fade-in">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {a.message}
        </div>
      ))}

      {/* My token highlight */}
      {myToken && (
        <div className="card p-5 border-teal-500/50 bg-teal-500/5 animate-fade-in">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Your Token</p>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold text-teal-400 leading-none">#{myToken.tokenNumber}</div>
            <div className="flex-1">
              <StatusBadge status={myToken.status} />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-800 px-3 py-2 text-center">
                  <p className="text-xs text-slate-500">Position</p>
                  <p className="font-bold text-slate-100">{myToken.queuePosition}</p>
                </div>
                <div className="rounded-lg bg-slate-800 px-3 py-2 text-center">
                  <p className="text-xs text-slate-500">Est. wait</p>
                  <p className="font-bold text-amber-400">
                    {myToken.estimatedWaitTime > 0 ? `${myToken.estimatedWaitTime}m` : 'Soon'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {myToken.doctor && (
            <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-slate-800">
              <Stethoscope className="w-4 h-4 text-blue-400" />
              <p className="text-sm text-slate-300">
                Assigned to <span className="text-blue-400 font-medium">{myToken.doctor.name}</span>
              </p>
            </div>
          )}
          {!myToken.doctor && (
            <p className="text-xs text-slate-600 mt-2">
              Doctor will be assigned by receptionist on arrival
            </p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{waiting.length}</p>
          <p className="text-xs text-slate-500 mt-1">Waiting</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-teal-400">{current ? `#${current.tokenNumber}` : '—'}</p>
          <p className="text-xs text-slate-500 mt-1">Current Token</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{doctors.filter(d => d.isAvailable).length}</p>
          <p className="text-xs text-slate-500 mt-1">Doctors Active</p>
        </div>
      </div>

      {/* Current patient */}
      {current && (
        <div className="card p-4 border-l-4 border-l-teal-500" style={{borderRadius:'0 12px 12px 0'}}>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Now Seeing</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
              <span className="text-teal-400 font-bold">#{current.tokenNumber}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-100">{current.displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-xs text-teal-400">In consultation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Queue list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title flex items-center gap-2">
            <Users className="w-4 h-4" /> Waiting Queue
          </h2>
          {lastUpdated && (
            <span className="text-xs text-slate-600">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {waiting.length === 0
          ? <div className="card p-8 text-center">
              <p className="text-slate-400">Queue is empty</p>
              <p className="text-xs text-slate-600 mt-1">No patients waiting</p>
            </div>
          : <div className="card divide-y divide-slate-800/50">
              {waiting.map((appt, idx) => {
                const isMe = appt.patient?._id === user?._id
                return (
                  <div key={appt._id}
                    className={`flex items-center gap-4 p-4 ${isMe ? 'bg-teal-500/5' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      appt.priority === 'emergency' ? 'bg-red-500/10 text-red-400'
                        : idx === 0 ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {appt.priority === 'emergency' ? '⚡' : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-300">#{appt.tokenNumber}</span>
                        {isMe && <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">You</span>}
                        {appt.priority === 'emergency' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">EMERGENCY</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Est. wait: {appt.estimatedWaitTime > 0 ? `${appt.estimatedWaitTime}m` : 'Next'}
                      </p>
                    </div>
                    {appt.doctor && (
                      <span className="text-xs text-blue-400 flex-shrink-0">{appt.doctor.name}</span>
                    )}
                    {idx === 0 && (
                      <span className="text-xs text-amber-400 font-medium flex-shrink-0">Next</span>
                    )}
                  </div>
                )
              })}
            </div>
        }
      </div>
    </div>
  )
}
