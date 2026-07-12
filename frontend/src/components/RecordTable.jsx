export default function RecordTable({ records }) {
  if (!records || records.length === 0) return null;

  const rows = [];
  for (const record of records) {
    if (record.error) {
      rows.push({ type: record.type, value: record.error, priority: '-', ttl: '-', time: record.responseTimeMs, isError: true });
    } else if (record.values) {
      for (const v of record.values) {
        if (record.type === 'SOA') {
          rows.push({ type: 'SOA', value: `NS: ${v.nsname}`, priority: '-', ttl: v.ttlHuman || '-', time: record.responseTimeMs });
          rows.push({ type: '', value: `Admin: ${v.hostmaster}`, priority: '-', ttl: '-', time: null });
          rows.push({ type: '', value: `Serial: ${v.serial}`, priority: '-', ttl: '-', time: null });
        } else {
          rows.push({
            type: record.type,
            value: v.value,
            priority: v.priority != null ? v.priority : '-',
            ttl: v.ttlHuman || '-',
            time: record.responseTimeMs,
          });
        }
      }
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
            <th className="text-left py-2 px-3 font-medium">Tipo</th>
            <th className="text-left py-2 px-3 font-medium">Valor</th>
            <th className="text-right py-2 px-3 font-medium">Prioridad</th>
            <th className="text-right py-2 px-3 font-medium">TTL</th>
            <th className="text-right py-2 px-3 font-medium">Tiempo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-b border-gray-800/50 ${row.isError ? 'text-gray-500 italic' : 'text-gray-200'}`}>
              <td className="py-2 px-3 font-mono text-xs">{row.type}</td>
              <td className="py-2 px-3 font-mono text-xs break-all">{row.value}</td>
              <td className="py-2 px-3 text-right font-mono text-xs">{row.priority}</td>
              <td className="py-2 px-3 text-right font-mono text-xs">{row.ttl}</td>
              <td className="py-2 px-3 text-right font-mono text-xs">{row.time != null ? `${row.time}ms` : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
