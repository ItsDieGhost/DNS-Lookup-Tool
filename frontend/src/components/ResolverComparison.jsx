export default function ResolverComparison({ comparisonData }) {
  if (!comparisonData) return null;
  const { domain, resolvers } = comparisonData;
  const resolverIps = Object.keys(resolvers);

  if (resolverIps.length === 0) {
    return <p className="text-gray-500 text-sm mt-4">Sin datos de comparación.</p>;
  }

  const allTypes = resolverIps[0]
    ? resolvers[resolverIps[0]].map(r => r.type)
    : [];

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-400 mb-3">
        Comparación de resolvers para <span className="text-gray-200">{domain}</span>
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
              <th className="text-left py-2 px-3 font-medium">Tipo</th>
              {resolverIps.map(ip => (
                <th key={ip} className="text-left py-2 px-3 font-medium">{ip}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allTypes.map((type, ti) => {
              const rowData = resolverIps.map(ip => {
                const rec = resolvers[ip].find(r => r.type === type);
                return rec;
              });
              const allEmpty = rowData.every(r => !r || r.error || !r.values || r.values.length === 0);
              if (allEmpty) return null;

              const maxValues = Math.max(...rowData.map(r => (r && r.values) ? r.values.length : 0));

              return (
                <tr key={ti} className="border-b border-gray-800/50">
                  <td className="py-2 px-3 font-mono text-xs text-gray-400 align-top">{type}</td>
                  {resolverIps.map((ip, ri) => {
                    const rec = rowData[ri];
                    if (!rec || rec.error) {
                      return (
                        <td key={ip} className="py-2 px-3 text-xs text-gray-600 italic align-top">
                          {rec ? rec.error : 'N/A'}
                        </td>
                      );
                    }
                    return (
                      <td key={ip} className="py-2 px-3 align-top">
                        <div className="space-y-1">
                          {rec.values.slice(0, 3).map((v, vi) => (
                            <div key={vi}>
                              <code className="text-xs text-gray-200 block break-all">
                                {v.priority != null && <span className="text-gray-500">[{v.priority}] </span>}
                                {v.value}
                              </code>
                              <span className="text-[10px] text-gray-600">
                                {v.ttlHuman ? `TTL ${v.ttlHuman}` : ''} · {rec.responseTimeMs}ms
                              </span>
                            </div>
                          ))}
                          {rec.values.length > 3 && (
                            <span className="text-[10px] text-gray-600">+{rec.values.length - 3} más</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
