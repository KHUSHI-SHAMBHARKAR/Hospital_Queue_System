import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import {
  LayoutDashboard, Building2, CalendarDays, ClipboardList,
  Users, PlusCircle, BarChart3, Stethoscope, LogOut,
  Wifi, WifiOff, Bell, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const navConfig = {
  patient: [
    { to: '/patient',             icon: LayoutDashboard, label: 'Dashboard',      end: true },
    { to: '/patient/hospitals',   icon: Building2,        label: 'Find Hospitals'  },
    { to: '/patient/appointments',icon: CalendarDays,    label: 'My Appointments' },
  ],
  receptionist: [
    { to: '/receptionist',            icon: LayoutDashboard, label: 'Dashboard',    end: true },
    { to: '/receptionist/queue',      icon: ClipboardList,   label: 'Queue View'   },
    { to: '/receptionist/walkin',     icon: PlusCircle,      label: 'Add Walk-In'  },
    { to: '/receptionist/analytics',  icon: BarChart3,       label: 'Analytics'    },
  ],
  doctor: [
    { to: '/doctor',       icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/doctor/queue', icon: Stethoscope,     label: 'My Queue'  },
  ],
}

const roleColors = { patient: 'text-teal-400', receptionist: 'text-violet-400', doctor: 'text-blue-400' }
const roleBadgeBg = { patient: 'bg-teal-500/10 border-teal-500/20 text-teal-400', receptionist: 'bg-violet-500/10 border-violet-500/20 text-violet-400', doctor: 'bg-blue-500/10 border-blue-500/20 text-blue-400' }

export default function Layout() {
  const { user, logout } = useAuth()
  const { connected }    = useSocket()
  const navigate         = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const links = navConfig[user?.role] || []

  const handleLogout = () => { logout(); navigate('/login') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-100 text-sm leading-tight">MediQueue</h1>
            <p className="text-xs text-slate-500">Queue Management</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-semibold text-teal-400">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <span className={clsx('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border capitalize', roleBadgeBg[user?.role])}>
              {user?.role}
            </span>
          </div>
          <div className={clsx('w-2 h-2 rounded-full', connected ? 'bg-teal-400' : 'bg-slate-600')} title={connected ? 'Live' : 'Offline'} />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => clsx('nav-item', isActive && 'active')}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          {connected
            ? <><Wifi className="w-3.5 h-3.5 text-teal-400" /><span className="text-xs text-teal-400">Live updates on</span></>
            : <><WifiOff className="w-3.5 h-3.5 text-slate-500" /><span className="text-xs text-slate-500">Connecting...</span></>
          }
        </div>
        <button onClick={handleLogout} className="nav-item w-full text-red-400 hover:bg-red-500/10 hover:text-red-300">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-slate-900 border-r border-slate-800 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-2">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm text-gradient">MediQueue</span>
          <div className={clsx('w-2 h-2 rounded-full', connected ? 'bg-teal-400' : 'bg-slate-600')} />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
