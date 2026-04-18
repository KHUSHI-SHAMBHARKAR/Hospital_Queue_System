import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { useTheme } from '../../context/ThemeContext'
import {
  LayoutDashboard, Building2, CalendarDays, ClipboardList,
  Users, PlusCircle, BarChart3, Stethoscope, LogOut,
  Wifi, WifiOff, Menu, X, Sun, Moon, Home,
} from 'lucide-react'
import { useState } from 'react'

const navConfig = {
  patient: [
    { to: '/patient',              icon: LayoutDashboard, label: 'Dashboard',       end: true },
    { to: '/patient/hospitals',    icon: Building2,       label: 'Find Hospitals'  },
    { to: '/patient/appointments', icon: CalendarDays,    label: 'My Appointments' },
  ],
  receptionist: [
    { to: '/receptionist',             icon: LayoutDashboard, label: 'Dashboard',    end: true },
    { to: '/receptionist/queue',       icon: ClipboardList,   label: 'Queue View'   },
    { to: '/receptionist/walkin',      icon: PlusCircle,      label: 'Add Walk-In'  },
    { to: '/receptionist/analytics',   icon: BarChart3,       label: 'Analytics'    },
  ],
  doctor: [
    { to: '/doctor',       icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/doctor/queue', icon: Stethoscope,     label: 'My Queue'  },
  ],
}

const roleMeta = {
  patient:      { badge: 'Patient',      badgeStyle: { background: 'rgba(20,184,166,0.12)', color: '#14b8a6' } },
  receptionist: { badge: 'Receptionist', badgeStyle: { background: 'rgba(139,92,246,0.12)', color: '#a78bfa' } },
  doctor:       { badge: 'Doctor',       badgeStyle: { background: 'rgba(59,130,246,0.12)', color: '#60a5fa' } },
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { connected }    = useSocket()
  const { isDark, toggleTheme } = useTheme()
  const navigate         = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const links = navConfig[user?.role] || []
  const meta  = roleMeta[user?.role] || {}

  const handleLogout = () => { logout(); navigate('/') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-surface)' }}>

      {/* Brand */}
      <div className="p-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Link to="/" className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>MediQueue</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1 }}>Nagpur</p>
          </div>
        </Link>

        {/* User card */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
          <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-sm font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={meta.badgeStyle}>
              {meta.badge}
            </span>
          </div>
          {/* Live dot */}
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-teal-400 animate-pulse' : 'bg-slate-600'}`} />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `nav-item${isActive ? ' active' : ''}`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer controls */}
      <div className="p-3 space-y-1" style={{ borderTop: '1px solid var(--border-color)' }}>
        {/* Connection status */}
        <div className="flex items-center gap-2 px-3 py-1.5">
          {connected
            ? <><Wifi className="w-3.5 h-3.5 text-teal-400" /><span className="text-xs text-teal-400">Live updates on</span></>
            : <><WifiOff className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Connecting…</span></>
          }
        </div>

        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="nav-item w-full"
          style={{ color: 'var(--text-muted)' }}>
          {isDark
            ? <><Sun className="w-4 h-4 text-amber-400" /><span>Light mode</span></>
            : <><Moon className="w-4 h-4 text-slate-500" /><span>Dark mode</span></>
          }
        </button>

        {/* Home link */}
        <Link to="/" className="nav-item" style={{ color: 'var(--text-muted)' }}>
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>

        {/* Logout */}
        <button onClick={handleLogout} className="nav-item w-full text-red-400 hover:text-red-300">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col flex-shrink-0"
        style={{ borderRight: '1px solid var(--border-color)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-60"
            style={{ borderRight: '1px solid var(--border-color)' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-2">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm text-gradient">MediQueue</span>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="btn-ghost p-2">
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
            </button>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-teal-400' : 'bg-slate-600'}`} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6" style={{ background: 'var(--bg-base)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
