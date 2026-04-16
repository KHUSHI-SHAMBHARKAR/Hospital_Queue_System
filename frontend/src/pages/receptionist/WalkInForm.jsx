import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { appointmentApi, doctorApi } from "../../services/api";
import { Spinner } from "../../components/common/UI";
import { UserPlus, CheckCircle2, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

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

export default function WalkInForm() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    patientName: "",
    patientPhone: "",
    department: "",
    symptoms: "",
    doctorId: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);

  const hospitalId = user?.hospital?._id || user?.hospital;

  // Load doctors filtered by department
  useEffect(() => {
    if (!form.department) {
      setDoctors([]);
      return;
    }
    // Ensure doctors reload when hospitalId becomes available
    if (!hospitalId) {
      setDoctors([]);
      return;
    }
    doctorApi
      .getAll({ hospitalId, department: form.department })
      .then((r) => setDoctors(r.data.doctors))
      .catch(() => {});
    setForm((p) => ({ ...p, doctorId: "" }));
  }, [form.department, hospitalId]);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientName || !form.department) {
      return toast.error("Patient name and department are required");
    }
    setSaving(true);
    try {
      const { data } = await appointmentApi.addWalkIn({ ...form, hospitalId });
      setSuccess(data.appointment);
      toast.success("Walk-in patient added to queue!");
      setForm({
        patientName: "",
        patientPhone: "",
        department: "",
        symptoms: "",
        doctorId: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add patient");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-100">
          Add Walk-In Patient
        </h1>
        <p className="text-slate-500 text-sm">
          Register a patient directly at the reception
        </p>
      </div>

      {success && (
        <div className="card p-5 border-teal-500/30 bg-teal-500/5 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-6 h-6 text-teal-400" />
            <p className="font-semibold text-teal-300">Patient Added!</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center mb-3">
            <div className="rounded-xl bg-slate-800 py-3">
              <p className="text-xs text-slate-500">Token Number</p>
              <p className="text-3xl font-bold text-teal-400">
                #{success.tokenNumber}
              </p>
            </div>
            <div className="rounded-xl bg-slate-800 py-3">
              <p className="text-xs text-slate-500">Est. Wait</p>
              <p className="text-3xl font-bold text-amber-400">
                {success.estimatedWaitTime}m
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center">
            {success.department}
          </p>
          <button
            onClick={() => setSuccess(null)}
            className="btn-secondary w-full mt-3 text-sm"
          >
            Add Another Patient
          </button>
        </div>
      )}

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="field-group">
            <label className="field-label">
              Patient Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="patientName"
              className="field-input"
              placeholder="Full name"
              value={form.patientName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label">Phone Number</label>
            <input
              type="tel"
              name="patientPhone"
              className="field-input"
              placeholder="10-digit mobile number"
              value={form.patientPhone}
              onChange={handleChange}
            />
          </div>

          <div className="field-group">
            <label className="field-label">
              Department <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, department: dept }))}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    form.department === dept
                      ? "border-teal-500 bg-teal-500/10 text-teal-300"
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <span className="mr-1">{DEPT_ICONS[dept]}</span>
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">
              Assign Doctor{" "}
              <span className="text-slate-600 font-normal normal-case">
                (optional)
              </span>
            </label>
            <div className="relative">
              <select
                name="doctorId"
                className="field-input appearance-none pr-8"
                value={form.doctorId}
                onChange={handleChange}
                disabled={!form.department}
              >
                <option value="">
                  {form.department
                    ? "Select doctor (optional)"
                    : "Select department first"}
                </option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id} disabled={!d.isAvailable}>
                    {d.name}
                    {!d.isAvailable ? " (Unavailable)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
            {form.department && doctors.length === 0 && (
              <p className="text-xs text-slate-600 mt-1">
                No doctors found for {form.department}
              </p>
            )}
          </div>

          <div className="field-group">
            <label className="field-label">Symptoms / Notes</label>
            <textarea
              name="symptoms"
              className="field-input resize-none h-20"
              placeholder="Brief description..."
              value={form.symptoms}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full py-3"
          >
            {saving ? (
              <Spinner />
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Add to Queue
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
