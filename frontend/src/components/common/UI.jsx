import { Star, Inbox } from 'lucide-react'

export const LoadingScreen = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading MediQueue…</p>
    </div>
  </div>
)

export const Spinner = ({ className = '' }) => (
  <div className={`w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin ${className}`} />
)

export const StatusBadge = ({ status }) => {
  const map = {
    waiting:   'badge-waiting',
    current:   'badge-current',
    completed: 'badge-done',
    done:      'badge-done',
    skipped:   'badge-skipped',
    cancelled: 'badge-cancelled',
    emergency: 'badge-emergency',
  }
  const labels = {
    waiting: '● Waiting', current: '▶ In Consult', completed: '✓ Done',
    done: '✓ Done', skipped: '↷ Skipped', cancelled: '✕ Cancelled', emergency: '⚡ Emergency',
  }
  return <span className={`badge ${map[status] || 'badge'}`}>{labels[status] || status}</span>
}

export const StarRating = ({ rating, max = 5, size = 'sm', interactive = false, onChange }) => {
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`${sz} transition-colors ${
            i < Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-600'
          } ${interactive ? 'cursor-pointer hover:text-amber-300' : ''}`}
          onClick={() => interactive && onChange?.(i + 1)}
        />
      ))}
    </div>
  )
}

export const EmptyState = ({ icon: Icon = Inbox, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
      style={{ background: 'var(--bg-elevated)' }}>
      <Icon className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
    </div>
    <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
    {description && <p className="text-sm max-w-xs mb-4" style={{ color: 'var(--text-muted)' }}>{description}</p>}
    {action}
  </div>
)

export const StatCard = ({ label, value, sub, icon: Icon, color = 'teal' }) => {
  const colorMap = {
    teal:   { icon: 'rgba(20,184,166,0.12)',   text: '#14b8a6' },
    violet: { icon: 'rgba(139,92,246,0.12)',    text: '#a78bfa' },
    blue:   { icon: 'rgba(59,130,246,0.12)',    text: '#60a5fa' },
    amber:  { icon: 'rgba(245,158,11,0.12)',    text: '#fbbf24' },
    red:    { icon: 'rgba(239,68,68,0.12)',     text: '#f87171' },
    green:  { icon: 'rgba(34,197,94,0.12)',     text: '#4ade80' },
  }
  const c = colorMap[color] || colorMap.teal

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        {Icon && (
          <div className="p-2.5 rounded-xl" style={{ background: c.icon }}>
            <Icon className="w-5 h-5" style={{ color: c.text }} />
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: c.text }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
        {sub && <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{sub}</p>}
      </div>
    </div>
  )
}