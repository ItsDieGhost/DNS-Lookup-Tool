export default function RecordSkeleton({ types }) {
  if (!types || types.length === 0) types = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA'];

  return (
    <div className="space-y-3">
      {types.map((type, i) => (
        <div key={i} className="animate-pulse bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-10 bg-gray-700/50 rounded" />
            <div className="h-3 w-20 bg-gray-700/50 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-800/50 rounded px-3 py-2">
              <div className="h-3 w-3/4 bg-gray-700/40 rounded" />
            </div>
            <div className="h-8 bg-gray-800/50 rounded px-3 py-2">
              <div className="h-3 w-1/2 bg-gray-700/40 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
