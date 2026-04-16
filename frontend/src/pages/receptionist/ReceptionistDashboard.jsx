import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { appointmentApi } from '../../services/api'
import { StatCard, StatusBadge, Spinner } from '../../components/common/UI'
import { Users, PlusCircle, BarChart3, ClipboardList, Activity, ArrowRight } from 'lucide-react'

const DEPT_ICONS = {
  'Cardiology':'🫀','Orthopedics':'🦴','Neurology':'🧠','General Medicine':'🩺','Pediatrics':'👶',
  'Dermatology':'🧴','ENT':'👂','Gynecology':'🌸','Ophthalmology':'👁','Psychiatry':'🧘',
}

export default function ReceptionistDashboard() {
  const { user } = useAuth()
  const { on }   = useSocket()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const hospitalId = user?.hospital?._id || user?.hospital

  const fetch = async () => {
    if (!hospitalId) return setLoading(false)
    try {
      const { data } = await appointmentApi.getHospital(hospitalId, { limit: 20 })
      setAppointments(data.appointments)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    fetch()
    const u1 = on('new_appointment', fetch)
    const u2 = on('queue_updated', fetch)
    return () => { u1?.(); u2?.() }
  }, [])

  const waiting   = appointments.filter(a => a.status === 'waiting').length
  const current   = appointments.filter(a => a.status === 'current').length
  const completed = appointments.filter(a => a.status === 'completed').length
  const unassigned = appointments.filter(a => a.status === 'waiting' && !a.doctor).length

  // Department summary
  const deptCounts = appointments.reduce((acc, a) => {
    if (!['completed','cancelled'].includes(a.status)) {
      acc[a.department] = (acc[a.department] || 0) + 1
    }
    return acc
  }, {})

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-teal-500" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Reception Dashboard</h1>
        <p className="text-slate-500 text-sm">
          {user?.hospital?.name || 'Hospital'} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Waiting"    value={waiting}    icon={Users}        color="amber" />
        <StatCard label="In Consult" value={current}    icon={Activity}     color="teal"  />
        <StatCard label="Completed"  value={completed}  icon={ClipboardList} color="green" />
        <StatCard label="Unassigned" value={unassigned} icon={Users}        color="red"   />
      </div>

      {unassigned > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
          <span className="text-lg">⚠️</span>
          <span><strong>{unassigned}</strong> patient{unassigned > 1 ? 's' : ''} waiting without a doctor assigned.</span>
          <Link to="/receptionist/queue" className="ml-auto text-xs underline">Assign now</Link>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { to: '/receptionist/walkin',    icon: PlusCircle,    label: 'Add Walk-In',  color: 'bg-teal-500/10 text-teal-400' },
          { to: '/receptionist/queue',     icon: ClipboardList, label: 'Manage Queue', color: 'bg-violet-500/10 text-violet-400' },
          { to: '/receptionist/analytics', icon: BarChart3,     label: 'Analytics',    color: 'bg-blue-500/10 text-blue-400' },
        ].map(({ to, icon: Icon, label, color }) => (
          <Link key={to} to={to}
            className="card p-5 flex flex-col items-center gap-3 hover:border-slate-700 transition-colors group">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100">{label}</span>
          </Link>
        ))}
      </div>

      {/* Department breakdown */}
      {Object.keys(deptCounts).length > 0 && (
        <div>
          <h2 className="section-title mb-3">Active by Department</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(deptCounts).map(([dept, count]) => (
              <div key={dept} className="card p-3 flex items-center gap-3">
                <span className="text-xl">{DEPT_ICONS[dept] || '🏥'}</span>
                <div>
                  <p className="text-xs font-medium text-slate-300">{dept}</p>
                  <p className="text-lg font-bold text-teal-400">{count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's recent queue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Today's Queue</h2>
          <Link to="/receptionist/queue" className="text-teal-400 text-sm flex items-center gap-1 hover:text-teal-300">
            Full view <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {appointments.length === 0
          ? <div className="card p-6 text-center text-slate-500 text-sm">No appointments today</div>
          : <div className="card divide-y divide-slate-800/50">
              {appointments.slice(0, 8).map(appt => (
                <div key={appt._id} className="flex items-center gap-3 p-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    appt.status === 'current' ? 'bg-teal-500/10 text-teal-400' :
                    appt.status === 'waiting' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'
                  }`}>#{appt.tokenNumber}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {appt.patient?.name || appt.patientName || 'Walk-in'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {DEPT_ICONS[appt.department]} {appt.department}
                      {appt.doctor ? ` · Dr. ${appt.doctor.name}` : ' · Unassigned'}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  )
}
