import { useState, useCallback, useRef } from 'react';

const RECORD_TYPES = [
  { key: 'A', label: 'A', desc: 'IPv4', tooltip: 'Dirección IPv4 del servidor. Es el registro más básico: traduce un nombre a una dirección IP versión 4.' },
  { key: 'AAAA', label: 'AAAA', desc: 'IPv6', tooltip: 'Dirección IPv6 del servidor. Similar al registro A pero para IPv6, necesario para conectividad moderna.' },
  { key: 'MX', label: 'MX', desc: 'Mail', tooltip: 'Mail Exchange. Define los servidores que reciben correo del dominio, ordenados por prioridad (menor número = mayor prioridad).' },
  { key: 'TXT', label: 'TXT', desc: 'Texto', tooltip: 'Información de texto arbitraria. Se usa para SPF (autenticación de correo), verificación de dominios (Google, MS), y claves DKIM.' },
  { key: 'NS', label: 'NS', desc: 'Nameservers', tooltip: 'Name Servers. Define qué servidores DNS son autoritativos para este dominio, es decir, quién tiene la verdad oficial de sus registros.' },
  { key: 'CNAME', label: 'CNAME', desc: 'Alias', tooltip: 'Canonical Name. Alias que hace que un dominio apunte a otro dominio canónico. Ej: www.ejemplo.com → ejemplo.com.' },
  { key: 'SOA', label: 'SOA', desc: 'Autoridad', tooltip: 'Start of Authority. Registro administrativo que contiene el servidor primario, email del admin, serial de zona, e intervalos de refresh/retry/expire.' },
];

const PRESET_RESOLVERS = [
  { label: 'Google', ip: '8.8.8.8' },
  { label: 'Cloudflare', ip: '1.1.1.1' },
  { label: 'OpenDNS', ip: '208.67.222.222' },
  { label: 'Quad9', ip: '9.9.9.9' },
];

const DOMAIN_REGEX = /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const IPV4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function cleanInput(raw) {
  let s = raw.trim();
  try {
    if (s.startsWith('http://') || s.startsWith('https://')) {
      s = new URL(s).hostname;
    }
  } catch {}
  s = s.replace(/\/+$/, '');
  const slash = s.indexOf('/');
  if (slash > 0) s = s.substring(0, slash);
  return s;
}

function isValidIPv4(ip) {
  const m = ip.match(IPV4_REGEX);
  if (!m) return false;
  return m.slice(1).every(o => { const n = parseInt(o, 10); return n >= 0 && n <= 255; });
}

function isValidResolverIP(ip) {
  return isValidIPv4(ip.trim());
}

export default function DomainForm({ onSearch, onCompare, loading }) {
  const [input, setInput] = useState('');
  const [selectedTypes, setSelectedTypes] = useState(RECORD_TYPES.map(t => t.key));
  const [error, setError] = useState('');
  const [mode, setMode] = useState('lookup');
  const [customResolvers, setCustomResolvers] = useState(['8.8.8.8', '1.1.1.1', '208.67.222.222']);
  const [resolverInput, setResolverInput] = useState('');
  const [resolverError, setResolverError] = useState('');
  const [tooltip, setTooltip] = useState(null);
  const inputRef = useRef(null);

  const handleTypeToggle = useCallback((key) => {
    setSelectedTypes(prev =>
      prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
    );
  }, []);

  const validate = useCallback(() => {
    const cleaned = cleanInput(input);
    if (!cleaned) {
      setError('Ingresa un dominio o IP');
      return null;
    }
    if (isValidIPv4(cleaned)) return { value: cleaned, isIp: true };
    if (DOMAIN_REGEX.test(cleaned)) return { value: cleaned, isIp: false };
    setError('Formato inválido. Ej: google.com o 8.8.8.8');
    return null;
  }, [input]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setError('');
    const result = validate();
    if (!result) return;

    if (mode === 'compare') {
      onCompare(result.value, selectedTypes, customResolvers);
    } else {
      onSearch(result.value, selectedTypes, result.isIp);
    }
  }, [input, selectedTypes, mode, customResolvers, validate, onSearch, onCompare]);

  const handleAddResolver = useCallback(() => {
    const ip = resolverInput.trim();
    if (!ip) return;
    if (!isValidResolverIP(ip)) {
      setResolverError('IP inválida. Ej: 8.8.8.8');
      return;
    }
    if (customResolvers.includes(ip)) {
      setResolverError('Ya está agregado');
      return;
    }
    setCustomResolvers(prev => [...prev, ip]);
    setResolverInput('');
    setResolverError('');
  }, [resolverInput, customResolvers]);

  const handleRemoveResolver = useCallback((ip) => {
    setCustomResolvers(prev => prev.filter(r => r !== ip));
  }, []);

  const selectAll = useCallback(() => {
    setSelectedTypes(RECORD_TYPES.map(t => t.key));
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Dominio o IP</label>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(''); }}
          placeholder="ejemplo.com, 8.8.8.8"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
          autoFocus
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Tipos de registro</span>
          <button type="button" onClick={selectAll} className="text-xs text-cyan-400 hover:text-cyan-300 transition">
            Seleccionar todos
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {RECORD_TYPES.map(({ key, label, desc, tooltip: tt }) => (
            <div key={key} className="relative">
              <button
                type="button"
                onClick={() => handleTypeToggle(key)}
                onMouseEnter={() => setTooltip(key)}
                onMouseLeave={() => setTooltip(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                  selectedTypes.includes(key)
                    ? 'bg-cyan-900/50 border-cyan-600 text-cyan-300'
                    : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'
                }`}
              >
                {label}
              </button>
              {tooltip === key && (
                <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-700 text-gray-200 text-xs rounded-lg shadow-lg w-64 pointer-events-none">
                  <p className="font-medium mb-1">{label} - {desc}</p>
                  <p className="text-gray-300">{tt}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-700" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setMode('lookup')}
          className={`px-4 py-2 rounded-lg text-sm transition ${
            mode === 'lookup' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          Consulta normal
        </button>
        <button
          type="button"
          onClick={() => setMode('compare')}
          className={`px-4 py-2 rounded-lg text-sm transition ${
            mode === 'compare' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          Comparar resolvers
        </button>
      </div>

      {mode === 'compare' && (
        <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
          <span className="text-sm text-gray-400">Resolvers DNS</span>

          <div className="flex gap-2 pb-2 border-b border-gray-700/50">
            {PRESET_RESOLVERS.map(r => (
              <button
                key={r.ip}
                type="button"
                onClick={() => {
                  if (!customResolvers.includes(r.ip)) {
                    setCustomResolvers(prev => [...prev, r.ip]);
                    setResolverError('');
                  }
                }}
                className="px-2 py-1 text-xs bg-gray-800 text-gray-400 hover:text-gray-200 rounded border border-gray-700 transition"
              >
                +{r.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {customResolvers.map(ip => (
              <span key={ip} className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-900/30 text-cyan-300 text-xs rounded-lg border border-cyan-800/50">
                {ip}
                <button type="button" onClick={() => handleRemoveResolver(ip)} className="text-cyan-400 hover:text-red-400 transition">&times;</button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={resolverInput}
              onChange={(e) => { setResolverInput(e.target.value); setResolverError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddResolver(); } }}
              placeholder="Agregar IP de resolver..."
              className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-xs placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
            <button type="button" onClick={handleAddResolver} className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition">
              Agregar
            </button>
          </div>
          {resolverError && <p className="text-xs text-red-400">{resolverError}</p>}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !input.trim()}
        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? 'Consultando...' : mode === 'compare' ? 'Comparar resolvers DNS' : 'Consultar DNS'}
      </button>
    </form>
  );
}
