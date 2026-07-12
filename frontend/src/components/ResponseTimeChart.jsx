const TYPE_COLORS = {
  A: 'bg-emerald-500',
  AAAA: 'bg-violet-500',
  MX: 'bg-amber-500',
  TXT: 'bg-pink-500',
  NS: 'bg-blue-500',
  CNAME: 'bg-orange-500',
  SOA: 'bg-rose-500',
  PTR: 'bg-cyan-500',
};

export default function ResponseTimeChart({ records }) {
  if (!records || records.length === 0) return null;

  const maxTime = Math.max(...records.map(r => r.responseTimeMs || 0), 1);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-3">Tiempo de respuesta por tipo</h3>
      <div className="space-y-2">
        {records.map((rec, i) => {
          if (!rec.responseTimeMs && rec.responseTimeMs !== 0) return null;
          const width = Math.max((rec.responseTimeMs / maxTime) * 100, 4);
          const barColor = TYPE_COLORS[rec.type] || 'bg-gray-500';
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-400 w-12 shrink-0">{rec.type}</span>
              <div className="flex-1 h-5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className="text-xs font-mono text-gray-500 w-14 text-right shrink-0">
                {rec.responseTimeMs}ms
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
