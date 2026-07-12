export default function SearchHistory({ history, onSelect, onClear }) {
  if (history.length === 0) return null;

  return (
    <div className="bg-gray-800/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-400">Historial reciente</h3>
        <button onClick={onClear} className="text-xs text-gray-500 hover:text-red-400 transition">
          Limpiar
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {history.map((entry, i) => (
          <button
            key={i}
            onClick={() => onSelect(entry)}
            className="px-3 py-1.5 bg-gray-800 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition border border-gray-700/50"
          >
            {entry.query}
            <span className="ml-2 text-gray-600">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
