import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { appointmentApi, queueApi, doctorApi } from "../../services/api";
import { StatusBadge, Spinner } from "../../components/common/UI";
import {
  Search,
  AlertTriangle,
  X,
  ChevronDown,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

const DEPT_ICONS = {
  Cardiology: "🫀",
  Orthopedics: "🦴",
  Neurology: "🧠",
  "General Medicine": "🩺",
  Pediatrics: "👶",
  Dermatology: "🧴",
  ENT: "👂",
  Gynecology: "🌸",
  Ophthalmology: "👁",
  Psychiatry: "🧘",
};
const DEPARTMENTS = [
  "Cardiology",
  "Orthopedics",
  "Neurology",
  "General Medicine",
  "Pediatrics",
  "Dermatology",
  "ENT",
  "Gynecology",
  "Ophthalmology",
  "Psychiatry",
];

export default function HospitalQueue() {
  const { user } = useAuth();
  const { on, joinDeptRoom } = useSocket();

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assigningId, setAssigningId] = useState(null);

  const hospitalId = user?.hospital?._id || user?.hospital;

  const fetchAppointments = useCallback(async () => {
    if (!hospitalId) return;
    try {
      const params = {};
      if (deptFilter) params.department = deptFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await appointmentApi.getHospital(hospitalId, params);
      setAppointments(data.appointments);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [hospitalId, deptFilter, statusFilter]);

  useEffect(() => {
    fetchAppointments();
    // Load all doctors for assignment dropdown when hospitalId is available
    if (hospitalId) {
      doctorApi
        .getAll({ hospitalId })
        .then((r) => setDoctors(r.data.doctors))
        .catch(() => {});
    }
  }, [hospitalId, deptFilter, statusFilter]);

  useEffect(() => {
    // Subscribe to dept rooms for real-time updates when hospitalId available
    if (!hospitalId) return;
    DEPARTMENTS.forEach((d) => joinDeptRoom(hospitalId, d));
    const u1 = on("queue_updated", fetchAppointments);
    const u2 = on("new_appointment", fetchAppointments);
    return () => {
      u1?.();
      u2?.();
    };
  }, [on, hospitalId, fetchAppointments]);

  const handleAssignDoctor = async (appointmentId, doctorId) => {
    if (!doctorId) return;
    setAssigningId(appointmentId);
    try {
      await appointmentApi.assignDoctor(appointmentId, doctorId);
      toast.success("Doctor assigned successfully");
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Assignment failed");
    } finally {
      setAssigningId(null);
    }
  };

  const handleCallNext = async (dept) => {
    try {
      const { data } = await queueApi.callNextInDept(hospitalId, dept);
      if (!data.next) toast("No more patients in " + dept, { icon: "✅" });
      else toast.success(`Called: Token #${data.next.tokenNumber}`);
      fetchAppointments();
    } catch {
      toast.error("Failed to call next");
    }
  };

  const handleEmergency = async (id) => {
    try {
      await queueApi.markEmergency(id);
      toast.success("Marked as emergency");
      fetchAppointments();
    } catch {
      toast.error("Failed");
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await appointmentApi.cancel(id);
      toast.success("Appointment cancelled");
      fetchAppointments();
    } catch {
      toast.error("Failed");
    }
  };

  // Filter by search term client-side
  const filtered = appointments.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = (a.patient?.name || a.patientName || "").toLowerCase();
    const phone = a.patient?.phone || a.patientPhone || "";
    return (
      name.includes(q) || phone.includes(q) || String(a.tokenNumber).includes(q)
    );
  });

  // Group by department for "Call Next" buttons
  const activeDepts = [
    ...new Set(
      appointments
        .filter((a) => ["waiting", "current"].includes(a.status))
        .map((a) => a.department)
    ),
  ];

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-8 h-8 text-teal-500" />
      </div>
    );

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Hospital Queue</h1>
        <p className="text-slate-500 text-sm">
          {filtered.length} appointments today
        </p>
      </div>

      {/* Call Next buttons per dept */}
      {activeDepts.length > 0 && (
        <div>
          <p className="section-title mb-2">Call Next Patient</p>
          <div className="flex flex-wrap gap-2">
            {activeDepts.map((dept) => (
              <button
                key={dept}
                onClick={() => handleCallNext(dept)}
                className="btn-secondary text-xs py-2 px-3"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                {DEPT_ICONS[dept]} {dept}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className="field-input pl-9 text-sm"
            placeholder="Search patient, phone or token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="field-input text-sm w-auto"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {DEPT_ICONS[d]} {d}
            </option>
          ))}
        </select>
        <select
          className="field-input text-sm w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          {["waiting", "current", "completed", "skipped", "cancelled"].map(
            (s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            )
          )}
        </select>
        {(search || deptFilter || statusFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setDeptFilter("");
              setStatusFilter("");
            }}
            className="btn-secondary text-xs py-2 px-3"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Queue table */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          No appointments match your filters
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((appt) => {
            const deptDoctors = doctors.filter(
              (d) =>
                d.department === appt.department ||
                d.specialization === appt.department
            );
            const displayName =
              appt.patient?.name || appt.patientName || "Walk-in";

            return (
              <div
                key={appt._id}
                className={`card p-4 ${
                  appt.priority === "emergency"
                    ? "border-red-500/40 bg-red-500/5"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3 flex-wrap">
                  {/* Token */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      appt.priority === "emergency"
                        ? "bg-red-500/10 text-red-400"
                        : appt.status === "current"
                        ? "bg-teal-500/10 text-teal-400"
                        : appt.status === "waiting"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    #{appt.tokenNumber}
                  </div>

                  {/* Patient info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-200">
                        {displayName}
                      </p>
                      {appt.isWalkIn && (
                        <span className="badge text-xs">Walk-in</span>
                      )}
                      {appt.priority === "emergency" && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                          ⚡ EMERGENCY
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {appt.patient?.phone || appt.patientPhone || "—"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {DEPT_ICONS[appt.department]} {appt.department}
                      {appt.symptoms && (
                        <span className="italic ml-2">
                          · "{appt.symptoms.slice(0, 40)}
                          {appt.symptoms.length > 40 ? "…" : ""}"
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={appt.status} />
                  </div>
                </div>

                {/* Doctor assignment row */}
                {["waiting", "current"].includes(appt.status) && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {appt.doctor ? (
                      <span className="text-xs text-blue-400 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" /> Dr.{" "}
                        {appt.doctor.name}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-400">
                        No doctor assigned
                      </span>
                    )}

                    {/* Assign/change doctor dropdown */}
                    <div className="relative ml-auto">
                      <select
                        className="field-input text-xs py-1.5 pr-7 appearance-none cursor-pointer"
                        defaultValue=""
                        onChange={(e) =>
                          handleAssignDoctor(appt._id, e.target.value)
                        }
                        disabled={assigningId === appt._id}
                      >
                        <option value="" disabled>
                          {assigningId === appt._id
                            ? "Assigning…"
                            : appt.doctor
                            ? "Change doctor"
                            : "Assign doctor"}
                        </option>
                        {deptDoctors.map((d) => (
                          <option
                            key={d._id}
                            value={d._id}
                            disabled={!d.isAvailable}
                          >
                            {d.name}
                            {!d.isAvailable ? " (Unavailable)" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                    </div>

                    {/* Actions */}
                    {appt.priority !== "emergency" && (
                      <button
                        onClick={() => handleEmergency(appt._id)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Mark emergency"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleCancel(appt._id)}
                      className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
