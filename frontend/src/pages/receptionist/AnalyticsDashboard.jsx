import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { analyticsApi } from '../../services/api'
import { StatCard, StarRating, Spinner } from '../../components/common/UI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from 'recharts'
import { Users, Clock, CheckCircle2, TrendingUp } from 'lucide-react'

const DEPT_ICONS = {'Cardiology':'🫀','Orthopedics':'🦴','Neurology':'🧠','General Medicine':'🩺','Pediatrics':'👶','Dermatology':'🧴','ENT':'👂','Gynecology':'🌸','Ophthalmology':'👁','Psychiatry':'🧘'}
const DEPT_COLORS = ['#14b8a6','#8b5cf6','#3b82f6','#f59e0b','#ec4899','#22c55e','#06b6d4','#a855f7','#ef4444','#84cc16']

export default function AnalyticsDashboard() {
  const { user } = useAuth()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  const hospitalId = user?.hospital?._id || user?.hospital

  useEffect(() => {
    if (!hospitalId) return
    analyticsApi.getHospital(hospitalId)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-teal-500" /></div>
  if (!data) return <div className="card p-8 text-center text-slate-500">No analytics data available</div>

  const { today, deptBreakdown = [], doctors = [], weeklyTrend = [] } = data

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="card px-3 py-2 text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Analytics</h1>
        <p className="text-slate-500 text-sm">Today's hospital performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Today"  value={today.total}     icon={Users}        color="teal"  />
        <StatCard label="Completed"    value={today.completed} icon={CheckCircle2} color="green" />
        <StatCard label="Waiting"      value={today.waiting}   icon={Clock}        color="amber" />
        <StatCard label="Avg Wait"     value={`${today.avgWaitTime}m`} icon={TrendingUp} color="blue" />
      </div>

      {/* Department breakdown */}
      {deptBreakdown.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-4">Patients by Department</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptBreakdown} barSize={28}>
              <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false}
                tickFormatter={n => n.split(' ')[0]} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" radius={[4,4,0,0]} name="Total">
                {deptBreakdown.map((_, idx) => (
                  <Cell key={idx} fill={DEPT_COLORS[idx % DEPT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
            {deptBreakdown.map((d, idx) => (
              <div key={d._id} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ background: DEPT_COLORS[idx % DEPT_COLORS.length] }} />
                <span className="text-slate-400">{DEPT_ICONS[d._id]} {d._id}</span>
                <span className="font-medium text-slate-200 ml-auto">{d.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-day trend */}
      {weeklyTrend.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-4">7-Day Patient Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2}
                dot={{ fill: '#14b8a6', r: 3 }} name="Total" />
              <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2}
                dot={{ fill: '#22c55e', r: 3 }} name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Doctor performance */}
      {doctors.length > 0 && (
        <div>
          <h2 className="section-title mb-3">Doctor Performance</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {doctors.map(doc => (
              <div key={doc._id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-100">{doc.name}</p>
                    <p className="text-xs text-slate-500">{doc.department}</p>
                    <StarRating rating={doc.avgRating || 0} />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    doc.isAvailable ? 'bg-teal-500/10 text-teal-400' : 'bg-slate-700 text-slate-500'
                  }`}>
                    {doc.isAvailable ? '● Online' : '○ Offline'}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-slate-800 py-2">
                    <p className="text-sm font-bold text-amber-400">{doc.queueLength}</p>
                    <p className="text-xs text-slate-600">Waiting</p>
                  </div>
                  <div className="rounded-lg bg-slate-800 py-2">
                    <p className="text-sm font-bold text-green-400">{doc.completedToday}</p>
                    <p className="text-xs text-slate-600">Done Today</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
