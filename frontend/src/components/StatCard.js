export default function StatCard({ label, value, unit, icon }) {
  return (
    <div className="bg-slate-800 rounded-2xl p-5 flex flex-col gap-1 border border-slate-700">
      <span className="text-2xl">{icon}</span>
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-3xl font-bold text-orange-400">
        {value} <span className="text-base text-slate-400">{unit}</span>
      </span>
    </div>
  );
}
