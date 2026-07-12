import { useState } from 'react';

const TYPE_COLORS = {
  A: 'border-l-emerald-500',
  AAAA: 'border-l-violet-500',
  MX: 'border-l-amber-500',
  TXT: 'border-l-pink-500',
  NS: 'border-l-blue-500',
  CNAME: 'border-l-orange-500',
  SOA: 'border-l-rose-500',
  PTR: 'border-l-cyan-500',
};

const INITIAL_VISIBLE = 10;

export default function RecordCard({ record }) {
  const { type, values, error, responseTimeMs } = record;
  const borderColor = TYPE_COLORS[type] || 'border-l-gray-500';
  const [expanded, setExpanded] = useState(false);

  if (error) {
    return (
      <div className={`border-l-4 ${borderColor} bg-gray-800/50 dark:bg-gray-800/50 rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-gray-300">{type}</span>
          {responseTimeMs != null && (
            <span className="text-xs text-gray-500">{responseTimeMs}ms</span>
          )}
        </div>
        <p className="text-sm text-gray-500 italic">{error}</p>
      </div>
    );
  }

  if (!values || values.length === 0) return null;

  const hasMore = values.length > INITIAL_VISIBLE;
  const visibleValues = expanded ? values : values.slice(0, INITIAL_VISIBLE);

  return (
    <div className={`border-l-4 ${borderColor} bg-gray-800/50 dark:bg-gray-800/50 rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-300">{type}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{values.length} registro{values.length !== 1 ? 's' : ''}</span>
          {responseTimeMs != null && (
            <span className="text-xs text-gray-500">{responseTimeMs}ms</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {visibleValues.map((v, i) => (
          <div key={i} className="bg-gray-900/50 dark:bg-gray-900/50 rounded px-3 py-2 text-sm">
            <div className="flex items-start justify-between gap-4">
              <code className="text-gray-200 break-all font-mono text-xs leading-relaxed">
                {type === 'SOA' ? (
                  <span>
                    <span className="text-gray-400">Servidor: </span>{v.nsname}<br />
                    <span className="text-gray-400">Admin: </span>{v.hostmaster}<br />
                    <span className="text-gray-400">Serial: </span>{v.serial}<br />
                    <span className="text-gray-400">Refresh: </span>{v.refresh}s | <span className="text-gray-400">Retry: </span>{v.retry}s<br />
                    <span className="text-gray-400">Expire: </span>{v.expire}s | <span className="text-gray-400">Min TTL: </span>{v.minttl}s
                  </span>
                ) : (
                  <span>
                    {v.priority != null && (
                      <span className="text-gray-400 mr-2">Prio {v.priority}</span>
                    )}
                    {v.value}
                  </span>
                )}
              </code>
              <div className="shrink-0 text-right">
                {v.ttlHuman && (
                  <span className="text-xs text-gray-500 block">TTL {v.ttlHuman}</span>
                )}
                {v.ttl != null && (
                  <span className="text-xs text-gray-600">({v.ttl}s)</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition"
        >
          {expanded
            ? `Mostrar menos (${values.length - INITIAL_VISIBLE} ocultos)`
            : `Ver ${values.length - INITIAL_VISIBLE} más`}
        </button>
      )}
    </div>
  );
}
