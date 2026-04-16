import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { hospitalApi, appointmentApi } from '../../services/api'
import { Spinner } from '../../components/common/UI'
import { ArrowLeft, CheckCircle2, Stethoscope, Clock, Users, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const DEPT_ICONS = {
  'Cardiology': '🫀', 'Orthopedics': '🦴', 'Neurology': '🧠',
  'General Medicine': '🩺', 'Pediatrics': '👶', 'Dermatology': '🧴',
  'ENT': '👂', 'Gynecology': '🌸', 'Ophthalmology': '👁', 'Psychiatry': '🧘',
}

export default function BookAppointment() {
  const { hospitalId } = useParams()
  const navigate = useNavigate()

  const [hospital, setHospital]       = useState(null)
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState('')
  const [symptoms, setSymptoms]       = useState('')
  const [loading, setLoading]         = useState(true)
  const [booking, setBooking]         = useState(false)
  const [booked, setBooked]           = useState(null) // confirmed appointment

  useEffect(() => {
    hospitalApi.getById(hospitalId)
      .then(({ data }) => {
        setHospital(data.hospital)
        setDepartments(data.hospital.departments || [])
      })
      .catch(() => toast.error('Failed to load hospital'))
      .finally(() => setLoading(false))
  }, [hospitalId])

  const handleBook = async () => {
    if (!selectedDept) return toast.error('Please select a department')
    setBooking(true)
    try {
      const { data } = await appointmentApi.book({ hospitalId, department: selectedDept, symptoms })
      setBooked(data.appointment)
      toast.success(`Token #${data.appointment.tokenNumber} confirmed!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally { setBooking(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-teal-500" /></div>

  // ── Success screen ─────────────────────────────────────────────────────────
  if (booked) return (
    <div className="flex flex-col items-center justify-center py-10 animate-fade-in max-w-sm mx-auto">
      <div className="w-20 h-20 rounded-full bg-teal-500/10 flex items-center justify-center mb-5">
        <CheckCircle2 className="w-10 h-10 text-teal-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-100 mb-1">You're Booked!</h2>
      <p className="text-slate-500 text-sm mb-6 text-center">Your token has been confirmed for {booked.department}</p>

      {/* Token display */}
      <div className="card p-6 w-full text-center mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Your Token Number</p>
        <div className="text-7xl font-bold text-teal-400 my-3 leading-none">
          #{booked.tokenNumber}
        </div>
        <div className="mt-3 space-y-1 text-sm">
          <p className="text-slate-300 font-medium">{hospital?.name}</p>
          <p className="text-slate-500">{booked.department}</p>
          {booked.estimatedWaitTime > 0 && (
            <div className="mt-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-300 font-medium flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Est. wait: {booked.estimatedWaitTime} minutes
              </p>
            </div>
          )}
          {booked.estimatedWaitTime === 0 && (
            <div className="mt-3 px-4 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
              <p className="text-teal-300 font-medium">You're next in line!</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 w-full">
        <button onClick={() => navigate('/patient')} className="btn-secondary flex-1">Dashboard</button>
        <button
          onClick={() => navigate(`/patient/queue/${hospitalId}/${encodeURIComponent(booked.department)}`)}
          className="btn-primary flex-1">
          <Users className="w-4 h-4" /> Track Queue
        </button>
      </div>
    </div>
  )

  // ── Booking form ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Book Appointment</h1>
          <p className="text-sm text-slate-500">{hospital?.name} · {hospital?.address?.city}</p>
        </div>
      </div>

      {/* Department selector */}
      <div>
        <h2 className="section-title mb-3">Select Department</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {departments.map(dept => (
            <button key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedDept === dept
                  ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                  : 'card hover:border-slate-600'
              }`}>
              <div className="text-2xl mb-2">{DEPT_ICONS[dept] || '🏥'}</div>
              <p className="text-sm font-medium text-slate-200">{dept}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Info card when dept selected */}
      {selectedDept && (
        <div className="card p-4 border-teal-500/30 bg-teal-500/5 animate-fade-in">
          <p className="text-xs text-slate-500 mb-1">Selected</p>
          <p className="font-semibold text-teal-300 flex items-center gap-2">
            <span>{DEPT_ICONS[selectedDept]}</span> {selectedDept}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            A doctor from this department will be assigned by the receptionist after you arrive.
          </p>
        </div>
      )}

      {/* Symptoms */}
      <div className="field-group">
        <label className="field-label">Symptoms / Reason <span className="text-slate-600 normal-case font-normal">(optional)</span></label>
        <textarea className="field-input resize-none h-24"
          placeholder="Briefly describe your symptoms to help the doctor prepare..."
          value={symptoms} onChange={e => setSymptoms(e.target.value)} maxLength={500} />
        <p className="text-xs text-slate-600 text-right">{symptoms.length}/500</p>
      </div>

      {!selectedDept && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Please select a department to continue
        </div>
      )}

      <button className="btn-primary w-full py-3 text-base" onClick={handleBook}
        disabled={!selectedDept || booking}>
        {booking ? <Spinner /> : 'Confirm Booking & Get Token'}
      </button>

      <p className="text-xs text-slate-600 text-center">
        A doctor will be assigned to you by the receptionist when you arrive at the hospital.
      </p>
    </div>
  )
}
