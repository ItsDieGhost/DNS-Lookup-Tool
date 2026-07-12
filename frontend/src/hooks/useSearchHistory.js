import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'dns-lookup-history';
const MAX_ITEMS = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  const addToHistory = useCallback((entry) => {
    setHistory(prev => {
      const filtered = prev.filter(e => e.query !== entry.query);
      const updated = [{ ...entry, timestamp: new Date().toISOString() }, ...filtered].slice(0, MAX_ITEMS);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return { history, addToHistory, clearHistory };
}
