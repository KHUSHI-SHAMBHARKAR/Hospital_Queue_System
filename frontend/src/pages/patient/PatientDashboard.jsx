import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { appointmentApi } from '../../services/api'
import { StatCard, StatusBadge, EmptyState, Spinner } from '../../components/common/UI'
import { CalendarDays, Clock, Users, Building2, ArrowRight, CheckCircle2, Ticket } from 'lucide-react'

const DEPT_ICONS = {
  'Cardiology':'🫀','Orthopedics':'🦴','Neurology':'🧠','General Medicine':'🩺',
  'Pediatrics':'👶','Dermatology':'🧴','ENT':'👂','Gynecology':'🌸','Ophthalmology':'👁','Psychiatry':'🧘',
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const { on, joinDeptRoom } = useSocket()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    try {
      const { data } = await appointmentApi.getMy({ limit: 10 })
      setAppointments(data.appointments)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  useEffect(() => {
    const active = appointments.filter(a => ['waiting','current'].includes(a.status))
    active.forEach(a => {
      if (a.hospital?._id && a.department) joinDeptRoom(a.hospital._id, a.department)
    })
  }, [appointments])

  useEffect(() => {
    const u1 = on('queue_updated', () => fetch())
    const u2 = on('doctor_assigned', () => fetch())
    return () => { u1?.(); u2?.() }
  }, [on])

  const active  = appointments.filter(a => ['waiting','current'].includes(a.status))
  const done    = appointments.filter(a => a.status === 'completed').length
  const waiting = appointments.filter(a => a.status === 'waiting').length

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-teal-500" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
            <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Here's your health queue status</p>
        </div>
        <Link to="/patient/hospitals" className="btn-primary hidden sm:flex">
          <Building2 className="w-4 h-4" /> Book Appointment
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Bookings" value={active.length}  icon={Ticket}       color="teal"  />
        <StatCard label="In Queue"        value={waiting}        icon={Clock}        color="amber" />
        <StatCard label="Completed"       value={done}           icon={CheckCircle2} color="green" />
        <StatCard label="Total Visits"    value={appointments.length} icon={CalendarDays} color="blue" />
      </div>

      {active.length > 0 && (
        <div>
          <h2 className="section-title mb-3">Active Appointments</h2>
          <div className="space-y-3">
            {active.map(appt => <ActiveCard key={appt._id} appt={appt} navigate={navigate} />)}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Recent History</h2>
          <Link to="/patient/appointments" className="text-teal-400 text-sm hover:text-teal-300 flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {appointments.filter(a => !['waiting','current'].includes(a.status)).length === 0
          ? <EmptyState icon={CalendarDays} title="No visit history yet"
              description="Book your first appointment to get started"
              action={<Link to="/patient/hospitals" className="btn-primary"><Building2 className="w-4 h-4" /> Find Hospitals</Link>}
            />
          : <div className="card divide-y divide-slate-800/50">
              {appointments.filter(a => !['waiting','current'].includes(a.status)).map(appt => (
                <div key={appt._id} className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">{DEPT_ICONS[appt.department] || '🏥'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{appt.department}</p>
                    <p className="text-xs text-slate-500">{appt.hospital?.name} · {new Date(appt.appointmentDate).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
        }
      </div>

      <Link to="/patient/hospitals" className="btn-primary w-full sm:hidden justify-center">
        <Building2 className="w-4 h-4" /> Find & Book Hospital
      </Link>
    </div>
  )
}

function ActiveCard({ appt, navigate }) {
  const isCurrent = appt.status === 'current'
  const hospitalId = appt.hospital?._id
  const dept = appt.department

  const handleCancel = async () => {
    if (!confirm('Cancel this appointment?')) return
    try {
      await appointmentApi.cancel(appt._id)
    } catch {}
  }

  return (
    <div className={`card p-5 ${isCurrent ? 'border-l-4 border-l-teal-500' : 'border-l-4 border-l-amber-500'}`}
      style={{borderRadius: '0 12px 12px 0'}}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl ${
            isCurrent ? 'bg-teal-500/10 text-teal-400' : 'bg-amber-500/10 text-amber-400'
          }`}>
            #{appt.tokenNumber}
          </div>
          <div>
            <p className="font-semibold text-slate-100">{appt.department}</p>
            <p className="text-xs text-slate-500">{appt.hospital?.name}</p>
            {appt.doctor && (
              <p className="text-xs text-blue-400 mt-0.5">Dr. {appt.doctor.name}</p>
            )}
            {!appt.doctor && (
              <p className="text-xs text-slate-600 mt-0.5">Doctor pending assignment</p>
            )}
          </div>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      {appt.status === 'waiting' && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-800 px-3 py-2.5 text-center">
            <p className="text-xs text-slate-500">Patients Ahead</p>
            <p className="text-xl font-bold text-slate-100 mt-0.5">{appt.patientsAhead ?? '—'}</p>
          </div>
          <div className="rounded-xl bg-slate-800 px-3 py-2.5 text-center">
            <p className="text-xs text-slate-500">Est. Wait</p>
            <p className="text-xl font-bold text-amber-400 mt-0.5">
              {appt.estimatedWaitTime > 0 ? `${appt.estimatedWaitTime}m` : 'Soon'}
            </p>
          </div>
        </div>
      )}

      {isCurrent && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <p className="text-sm text-teal-300 font-medium">You are currently being seen by the doctor</p>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {hospitalId && dept && (
          <button onClick={() => navigate(`/patient/queue/${hospitalId}/${encodeURIComponent(dept)}`)}
            className="btn-secondary text-xs flex-1 justify-center">
            <Users className="w-3.5 h-3.5" /> Live Queue
          </button>
        )}
        {appt.status === 'waiting' && (
          <button onClick={handleCancel} className="btn text-xs py-1.5 px-3 text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
