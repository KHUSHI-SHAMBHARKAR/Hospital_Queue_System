import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { hospitalApi } from '../../services/api'
import { Spinner, EmptyState } from '../../components/common/UI'
import { Search, MapPin, Phone, ChevronRight, Navigation, Building2 } from 'lucide-react'

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [locating, setLocating]   = useState(false)
  const [userLoc, setUserLoc]     = useState(null)
  const navigate = useNavigate()

  const load = async (params = {}) => {
    setLoading(true)
    try {
      const { data } = await hospitalApi.getAll(params)
      setHospitals(data.hospitals)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e) => {
    setSearch(e.target.value)
    load({ search: e.target.value, ...(userLoc || {}) })
  }

  const useLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc = { lat: coords.latitude, lng: coords.longitude }
        setUserLoc(loc)
        load({ ...loc, radius: 50 })
        setLocating(false)
      },
      () => { setLocating(false) }
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Find Hospitals</h1>
        <p className="text-slate-500 text-sm">Select a hospital to book your appointment</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="field-input pl-9" placeholder="Search by name or city..."
            value={search} onChange={handleSearch} />
        </div>
        <button onClick={useLocation} disabled={locating} className="btn-secondary flex-shrink-0">
          {locating ? <Spinner className="w-4 h-4" /> : <Navigation className="w-4 h-4" />}
          <span className="hidden sm:inline">Nearby</span>
        </button>
      </div>

      {userLoc && (
        <p className="text-xs text-teal-400 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" /> Showing hospitals within 50 km
        </p>
      )}

      {loading
        ? <div className="flex justify-center py-16"><Spinner className="w-8 h-8 text-teal-500" /></div>
        : hospitals.length === 0
          ? <EmptyState icon={Building2} title="No hospitals found" description="Try a different search term" />
          : <div className="grid gap-4 md:grid-cols-2">
              {hospitals.map(h => (
                <button key={h._id} onClick={() => navigate(`/patient/book/${h._id}`)}
                  className="card p-5 text-left hover:border-slate-700 hover:bg-slate-800/50 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-100 group-hover:text-teal-300 transition-colors text-sm leading-snug">{h.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{h.address?.city}, {h.address?.state}
                        {h.distance != null && <span className="text-teal-400 ml-1">· {h.distance} km</span>}
                      </p>
                      {h.phone && (
                        <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />{h.phone}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 mt-1 flex-shrink-0" />
                  </div>
                  {h.departments?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {h.departments.slice(0, 4).map(d => (
                        <span key={d} className="badge text-xs">{d}</span>
                      ))}
                      {h.departments.length > 4 && <span className="badge text-xs">+{h.departments.length - 4}</span>}
                    </div>
                  )}
                </button>
              ))}
            </div>
      }
    </div>
  )
}
