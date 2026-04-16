export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading MediQueue...</p>
      </div>
    </div>
  )
}
