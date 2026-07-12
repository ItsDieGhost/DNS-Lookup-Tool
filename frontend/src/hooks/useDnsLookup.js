import { useState, useCallback } from 'react';
import { lookupAll, reverseLookup, compareResolvers } from '../services/api';

const RECORD_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA'];

export function useDnsLookup() {
  const [state, setState] = useState({
    loading: false,
    data: null,
    error: null,
    comparisonData: null,
  });

  const search = useCallback(async (input, selectedTypes = RECORD_TYPES, isIp = false) => {
    setState({ loading: true, data: null, error: null, comparisonData: null });
    try {
      const data = isIp
        ? await reverseLookup(input)
        : await lookupAll(input, selectedTypes);
      setState({ loading: false, data, error: null, comparisonData: null });
      return data;
    } catch (err) {
      setState({ loading: false, data: null, error: err.message, comparisonData: null });
      return null;
    }
  }, []);

  const compare = useCallback(async (input, selectedTypes = RECORD_TYPES, resolvers) => {
    setState({ loading: true, data: null, error: null, comparisonData: null });
    try {
      const data = await compareResolvers(input, selectedTypes, resolvers);
      setState({ loading: false, data: null, error: null, comparisonData: data });
      return data;
    } catch (err) {
      setState({ loading: false, data: null, error: err.message, comparisonData: null });
      return null;
    }
  }, []);

  return { ...state, search, compare };
}
