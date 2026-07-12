import { useState, useCallback } from 'react';
import DomainForm from '../components/DomainForm';
import RecordCard from '../components/RecordCard';
import RecordTable from '../components/RecordTable';
import LoadingSpinner from '../components/LoadingSpinner';
import RecordSkeleton from '../components/RecordSkeleton';
import ThemeToggle from '../components/ThemeToggle';
import ResponseTimeChart from '../components/ResponseTimeChart';
import SearchHistory from '../components/SearchHistory';
import ResolverComparison from '../components/ResolverComparison';
import { useDnsLookup } from '../hooks/useDnsLookup';
import { useSearchHistory } from '../hooks/useSearchHistory';

export default function Home() {
  const { loading, data, error, comparisonData, search, compare } = useDnsLookup();
  const { history, addToHistory, clearHistory } = useSearchHistory();
  const [viewMode, setViewMode] = useState('cards');
  const [copied, setCopied] = useState(false);
  const [lastSelectedTypes, setLastSelectedTypes] = useState(null);

  const handleSearch = useCallback(async (value, types, isIp) => {
    setLastSelectedTypes(types);
    const result = await search(value, types, isIp);
    if (result) {
      addToHistory({ query: value, isIp });
    }
  }, [search, addToHistory]);

  const handleCompare = useCallback(async (value, types, resolvers) => {
    setLastSelectedTypes(types);
    await compare(value, types, resolvers);
    addToHistory({ query: value, isIp: false });
  }, [compare, addToHistory]);

  const handleHistorySelect = useCallback((entry) => {
    handleSearch(entry.query, ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA'], entry.isIp);
  }, [handleSearch]);

  const handleExportJson = useCallback(() => {
    const exportData = data || comparisonData;
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dns-lookup-${(data?.domain || comparisonData?.domain || 'export')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, comparisonData]);

  const handleCopyJson = useCallback(async () => {
    const exportData = data || comparisonData;
    if (!exportData) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [data, comparisonData]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              DNS <span className="text-cyan-600 dark:text-cyan-400">Lookup</span> Tool
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Consulta registros DNS de cualquier dominio
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="space-y-6">
          <SearchHistory history={history} onSelect={handleHistorySelect} onClear={clearHistory} />

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <DomainForm onSearch={handleSearch} onCompare={handleCompare} loading={loading} />
          </div>

          {loading && lastSelectedTypes && (
            <RecordSkeleton types={lastSelectedTypes} />
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {data && data.records && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-200">
                    {data.domain}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {new Date(data.queryTimestamp).toLocaleString()} · {data.totalRecords} tipos encontrados
                    {data.fromCache && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        CACHE
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden text-xs">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-3 py-1.5 transition ${viewMode === 'cards' ? 'bg-cyan-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                      Cards
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1.5 transition ${viewMode === 'table' ? 'bg-cyan-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                      Tabla
                    </button>
                  </div>
                  <button
                    onClick={handleExportJson}
                    className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition"
                    title="Exportar a JSON"
                  >
                    Exportar
                  </button>
                  <button
                    onClick={handleCopyJson}
                    className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition"
                    title="Copiar al portapapeles"
                  >
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              <ResponseTimeChart records={data.records} />

              {viewMode === 'cards' ? (
                <div className="grid gap-3">
                  {data.records.map((rec, i) => (
                    <RecordCard key={i} record={rec} />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <RecordTable records={data.records} />
                </div>
              )}
            </div>
          )}

          {data && data.records && data.records.length === 0 && !error && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 text-center">
              <p className="text-gray-500 text-sm">No se encontraron registros</p>
            </div>
          )}

          <ResolverComparison comparisonData={comparisonData} />
        </div>
      </div>
    </div>
  );
}
