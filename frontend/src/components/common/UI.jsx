import clsx from 'clsx'
import { Star, Inbox } from 'lucide-react'

export const LoadingScreen = () => (
  <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-3 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">Loading...</p>
    </div>
  </div>
)

export const Spinner = ({ className = '' }) => (
  <div className={clsx('w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin', className)} />
)

export const StatusBadge = ({ status }) => {
  const map = {
    waiting:   'badge-waiting',
    current:   'badge-current',
    done:      'badge-done',
    skipped:   'badge-skipped',
    cancelled: 'badge-cancelled',
    emergency: 'badge-emergency',
  }
  const labels = {
    waiting: '● Waiting', current: '▶ In Consult', done: '✓ Done',
    skipped: '↷ Skipped', cancelled: '✕ Cancelled', emergency: '⚡ Emergency',
  }
  return <span className={map[status] || 'badge'}>{labels[status] || status}</span>
}

export const StarRating = ({ rating, max = 5, size = 'sm', interactive = false, onChange }) => {
  const sizeCls = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={clsx(sizeCls, 'transition-colors',
            i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-700',
            interactive && 'cursor-pointer hover:text-amber-300'
          )}
          onClick={() => interactive && onChange?.(i + 1)}
        />
      ))}
    </div>
  )
}

export const EmptyState = ({ icon: Icon = Inbox, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-slate-600" />
    </div>
    <h3 className="text-slate-300 font-medium mb-1">{title}</h3>
    {description && <p className="text-slate-500 text-sm max-w-xs mb-4">{description}</p>}
    {action}
  </div>
)

export const StatCard = ({ label, value, sub, icon: Icon, color = 'teal', trend }) => {
  const colorMap = {
    teal:   'text-teal-400 bg-teal-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
    blue:   'text-blue-400 bg-blue-500/10',
    amber:  'text-amber-400 bg-amber-500/10',
    red:    'text-red-400 bg-red-500/10',
    green:  'text-green-400 bg-green-500/10',
  }
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        {Icon && (
          <div className={clsx('p-2.5 rounded-xl', colorMap[color])}>
            <Icon className={clsx('w-5 h-5', colorMap[color].split(' ')[0])} />
          </div>
        )}
        {trend !== undefined && (
          <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full',
            trend >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-semibold text-slate-100">{value ?? '—'}</div>
        <div className="text-xs font-medium text-slate-400 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-slate-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export const QueueCard = ({ appointment, position, showActions, onStatus, onEmergency }) => {
  const isEmergency = appointment.priority === 'emergency'
  return (
    <div className={clsx(
      'p-4 rounded-xl border transition-all duration-200 animate-slide-in',
      appointment.status === 'current'
        ? 'bg-teal-500/5 border-teal-500/30 glow-teal'
        : isEmergency
        ? 'bg-red-500/5 border-red-500/30'
        : 'bg-slate-800/50 border-slate-800 hover:border-slate-700'
    )}>
      <div className="flex items-center justify-between gap-3">
        {/* Token + name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
            appointment.status === 'current' ? 'bg-teal-500/20 text-teal-400'
            : isEmergency ? 'bg-red-500/20 text-red-400'
            : 'bg-slate-700 text-slate-300'
          )}>
            {appointment.tokenNumber}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {appointment.patient?.name}
              {isEmergency && <span className="ml-2 text-red-400 text-xs">⚡ EMRG</span>}
            </p>
            <p className="text-xs text-slate-500 truncate">{appointment.patient?.phone}</p>
            {appointment.symptoms && (
              <p className="text-xs text-slate-600 truncate mt-0.5">{appointment.symptoms}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={appointment.status} />
          {showActions && (
            <div className="flex gap-1">
              {appointment.status === 'waiting' && (
                <>
                  <button onClick={() => onStatus(appointment._id, 'current')}
                    className="btn-primary py-1 px-2.5 text-xs">Call</button>
                  {!isEmergency && (
                    <button onClick={() => onEmergency(appointment._id)}
                      className="btn-emergency py-1 px-2 text-xs">⚡</button>
                  )}
                  <button onClick={() => onStatus(appointment._id, 'skipped')}
                    className="btn-ghost py-1 px-2 text-xs">Skip</button>
                </>
              )}
              {appointment.status === 'current' && (
                <button onClick={() => onStatus(appointment._id, 'done')}
                  className="btn-primary py-1 px-2.5 text-xs">✓ Done</button>
              )}
            </div>
          )}
        </div>
      </div>

      {position && appointment.status === 'waiting' && (
        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-600">Position #{position}</span>
          {appointment.estimatedWaitTime > 0 && (
            <span className="text-xs text-slate-500">~{appointment.estimatedWaitTime} min wait</span>
          )}
        </div>
      )}
    </div>
  )
}

export default LoadingScreen
