import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { Sun, Moon, Building2, Clock, Users, Stethoscope, BarChart3, Wifi,
         Shield, ChevronRight, CheckCircle2, ArrowRight, Star, Phone,
         MapPin, Activity, Ticket, UserCheck } from 'lucide-react'

const FEATURES = [
  {
    icon: Ticket,
    color: 'bg-teal-500/10 text-teal-500',
    title: 'Instant Token Generation',
    desc: 'Get a queue token the moment you book. No waiting at reception — your place is reserved before you arrive.',
  },
  {
    icon: Wifi,
    color: 'bg-blue-500/10 text-blue-500',
    title: 'Real-Time Live Queue',
    desc: 'Watch your position move in real time via Socket.IO. Know exactly how many patients are ahead of you.',
  },
  {
    icon: Clock,
    color: 'bg-amber-500/10 text-amber-500',
    title: 'Smart Wait Estimation',
    desc: 'AI-powered wait time that adjusts dynamically based on department load and doctor consultation speed.',
  },
  {
    icon: UserCheck,
    color: 'bg-violet-500/10 text-violet-500',
    title: 'Department-Based Booking',
    desc: 'Select your department first. The receptionist assigns the right doctor — no guesswork for patients.',
  },
  {
    icon: Activity,
    color: 'bg-rose-500/10 text-rose-500',
    title: 'Emergency Priority',
    desc: 'Emergency cases are instantly moved to the front of the queue. No bureaucracy during critical moments.',
  },
  {
    icon: BarChart3,
    color: 'bg-green-500/10 text-green-500',
    title: 'Analytics Dashboard',
    desc: 'Receptionists and doctors get live stats — patients seen, wait times, department load — all in one view.',
  },
]

const ROLES = [
  {
    role: 'Patient',
    emoji: '🧑‍⚕️',
    color: 'border-teal-500/30',
    accent: 'text-teal-400',
    bg: 'bg-teal-500/5',
    steps: [
      'Register or log in',
      'Find a nearby hospital',
      'Choose your department',
      'Get your token instantly',
      'Track live queue from your phone',
    ],
  },
  {
    role: 'Receptionist',
    emoji: '💁',
    color: 'border-violet-500/30',
    accent: 'text-violet-400',
    bg: 'bg-violet-500/5',
    steps: [
      'View all department queues',
      'Add walk-in patients',
      'Assign doctors to patients',
      'Handle emergency cases',
      'Monitor analytics in real time',
    ],
  },
  {
    role: 'Doctor',
    emoji: '👨‍⚕️',
    color: 'border-blue-500/30',
    accent: 'text-blue-400',
    bg: 'bg-blue-500/5',
    steps: [
      'Log in and go online',
      'See your assigned patients',
      'Call next patient in one click',
      'Mark consultations complete',
      'Toggle availability anytime',
    ],
  },
]

const HOSPITALS = [
  { name: 'SevenStar Hospital', area: 'Ramdaspeth', rating: 4.8 },
  { name: 'Orange City Hospital', area: 'Khamla', rating: 4.7 },
  { name: 'Wockhardt Hospital', area: 'Trimurti Nagar', rating: 4.6 },
  { name: 'Alexis Multispeciality', area: 'Manish Nagar', rating: 4.5 },
]

const STATS = [
  { value: '4', label: 'Hospitals', suffix: '' },
  { value: '40', label: 'Doctors', suffix: '+' },
  { value: '10', label: 'Departments', suffix: '' },
  { value: '0', label: 'Paper Forms', suffix: '' },
]

export default function LandingPage() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh' }}>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav style={{ borderBottom: '1px solid var(--border-color)', background: 'color-mix(in srgb, var(--bg-base) 85%, transparent)', backdropFilter: 'blur(12px)' }}
        className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>MediQueue</span>
              <span className="text-xs block" style={{ color: 'var(--text-muted)', lineHeight: 1 }}>Nagpur</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            <a href="#features" className="hover:text-teal-500 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-teal-500 transition-colors">How it works</a>
            <a href="#hospitals" className="hover:text-teal-500 transition-colors">Hospitals</a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {isDark
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <Link to="/login"
              className="hidden sm:flex btn text-sm py-2 px-4"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              Sign In
            </Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 pt-20 pb-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8"
          style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)', color: '#14b8a6' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse inline-block" />
          Live in 4 hospitals across Nagpur
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Skip the{' '}
          <span className="text-gradient">waiting room.</span>
          <br />
          Not the care.
        </h1>

        <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
          MediQueue is Nagpur's real-time hospital queue management system.
          Book your slot from anywhere, track your position live, and arrive just in time for your consultation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <Link to="/register" className="btn-primary text-base px-7 py-3 w-full sm:w-auto">
            Book an Appointment
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#how-it-works"
            className="btn text-base px-7 py-3 w-full sm:w-auto"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            See How It Works
          </a>
        </div>

        {/* Hero stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {STATS.map(s => (
            <div key={s.label} className="card p-5 text-center">
              <p className="text-3xl font-bold text-teal-400">{s.value}{s.suffix}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-teal-500 text-sm font-semibold uppercase tracking-widest mb-2">Workflow</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">One platform, three roles</h2>
            <p style={{ color: 'var(--text-muted)' }}>Every person in the hospital journey gets a purpose-built dashboard</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {ROLES.map((r) => (
              <div key={r.role} className={`card p-6 ${r.bg}`} style={{ border: `1px solid`, borderColor: r.color.replace('border-', '').replace('/30', '') }}>
                <div className="text-4xl mb-3">{r.emoji}</div>
                <h3 className={`text-lg font-bold mb-4 ${r.accent}`}>{r.role}</h3>
                <ul className="space-y-2.5">
                  {r.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <div className="w-5 h-5 rounded-full bg-teal-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-teal-400 text-xs font-bold">{i + 1}</span>
                      </div>
                      {step}
                    </li>
                  ))}
                </ul>
                <Link to="/register"
                  className="mt-5 flex items-center gap-1.5 text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#14b8a6'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                  Get started as {r.role} <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-teal-500 text-sm font-semibold uppercase tracking-widest mb-2">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything you need, nothing you don't</h2>
            <p style={{ color: 'var(--text-muted)' }}>Built for real hospital workflows — not just a prototype</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="card p-6 hover:border-teal-500/30 transition-all group"
                  style={{ transition: 'border-color 0.2s, transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Department list ───────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-10">
            <p className="text-teal-500 text-sm font-semibold uppercase tracking-widest mb-2">Departments</p>
            <h2 className="text-3xl font-bold">All specialties covered</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {['🫀 Cardiology','🦴 Orthopedics','🧠 Neurology','🩺 General Medicine','👶 Pediatrics',
              '🧴 Dermatology','👂 ENT','🌸 Gynecology','👁 Ophthalmology','🧘 Psychiatry'].map(d => (
              <div key={d} className="card px-5 py-2.5 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hospitals ────────────────────────────────────────────────────── */}
      <section id="hospitals" className="py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-teal-500 text-sm font-semibold uppercase tracking-widest mb-2">Nagpur Network</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Partner hospitals</h2>
            <p style={{ color: 'var(--text-muted)' }}>MediQueue is live at four of Nagpur's leading hospitals</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOSPITALS.map((h) => (
              <div key={h.name} className="card p-5">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-teal-500" />
                </div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{h.name}</h3>
                <p className="text-xs mb-3 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <MapPin className="w-3 h-3" /> {h.area}, Nagpur
                </p>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(h.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                  ))}
                  <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>{h.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial / Trust strip ─────────────────────────────────────── */}
      <section className="py-16" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-4xl mx-auto px-5">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: 'I tracked my queue from home and arrived just as my token was called. No waiting room stress!', name: 'Priya S.', role: 'Patient' },
              { quote: 'The walk-in form and doctor assignment feature cut our reception work in half. Amazing tool.', name: 'Sneha P.', role: 'Receptionist' },
              { quote: 'Seeing only my assigned patients keeps my workflow clean. I can focus entirely on the patient in front of me.', name: 'Dr. Rahul M.', role: 'Orthopedics' },
            ].map(t => (
              <div key={t.name} className="card p-5">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm leading-relaxed mb-4 italic" style={{ color: 'var(--text-muted)' }}>"{t.quote}"</p>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-teal-500/30">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to skip the queue?
          </h2>
          <p className="mb-8 text-lg" style={{ color: 'var(--text-muted)' }}>
            Join thousands of patients in Nagpur who book smarter with MediQueue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn-primary text-base px-8 py-3">
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login"
              className="btn text-base px-8 py-3"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              Sign In
            </Link>
          </div>
          <p className="text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
            Free for patients · No app download required · Works on all devices
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-elevated)' }}
        className="py-10">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>MediQueue</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nagpur, Maharashtra</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Link to="/login" className="hover:text-teal-500 transition-colors">Sign In</Link>
              <Link to="/register" className="hover:text-teal-500 transition-colors">Register</Link>
              <a href="#features" className="hover:text-teal-500 transition-colors">Features</a>
              <a href="#hospitals" className="hover:text-teal-500 transition-colors">Hospitals</a>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} MediQueue. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}