const dns = require('dns');
const dnsPromises = dns.promises;
const { promisify } = require('util');
const { sanitize } = require('../utils/validators');

const CACHE_TTL = 30_000;
const cache = new Map();

function getCacheKey(domain, types, servers) {
  return `${domain}|${types.sort().join(',')}|${(servers || []).join(',')}`;
}

function getFromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  if (cache.size > 100) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

function ttlToHuman(seconds) {
  if (!seconds && seconds !== 0) return 'N/A';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}

function createResolverWithServers(servers) {
  const resolver = new dns.Resolver();
  if (servers && servers.length > 0) {
    resolver.setServers(servers);
  }
  const resolve4 = promisify(resolver.resolve4.bind(resolver));
  const resolve6 = promisify(resolver.resolve6.bind(resolver));
  const resolveMx = promisify(resolver.resolveMx.bind(resolver));
  const resolveTxt = promisify(resolver.resolveTxt.bind(resolver));
  const resolveNs = promisify(resolver.resolveNs.bind(resolver));
  const resolveCname = promisify(resolver.resolveCname.bind(resolver));
  const resolveSoa = promisify(resolver.resolveSoa.bind(resolver));

  return { resolve4, resolve6, resolveMx, resolveTxt, resolveNs, resolveCname, resolveSoa };
}

async function resolveWithTiming(resolver, type, domain) {
  const start = performance.now();
  try {
    let result;
    switch (type) {
      case 'A':
        result = await resolver.resolve4(domain, { ttl: true });
        break;
      case 'AAAA':
        result = await resolver.resolve6(domain, { ttl: true });
        break;
      case 'MX':
        result = await resolver.resolveMx(domain);
        break;
      case 'TXT':
        result = await resolver.resolveTxt(domain);
        break;
      case 'NS':
        result = await resolver.resolveNs(domain);
        break;
      case 'CNAME':
        result = await resolver.resolveCname(domain);
        break;
      case 'SOA':
        result = await resolver.resolveSoa(domain);
        break;
      default:
        throw new Error(`Unsupported record type: ${type}`);
    }
    const elapsed = Math.round(performance.now() - start);
    return { success: true, data: result, responseTimeMs: elapsed };
  } catch (err) {
    const elapsed = Math.round(performance.now() - start);
    if (err.code === 'ENOTFOUND' || err.code === 'NXDOMAIN') {
      return { success: false, error: 'NXDOMAIN - Domain does not exist', code: err.code, responseTimeMs: elapsed };
    }
    if (err.code === 'ENODATA') {
      return { success: false, error: 'No records of this type', code: err.code, responseTimeMs: elapsed };
    }
    if (err.code === 'ETIMEOUT') {
      return { success: false, error: 'DNS query timed out', code: err.code, responseTimeMs: elapsed };
    }
    return { success: false, error: err.message, code: err.code || 'UNKNOWN', responseTimeMs: elapsed };
  }
}

function formatRecord(type, result) {
  const base = {
    type,
    values: [],
    responseTimeMs: result.responseTimeMs,
  };

  if (!result.success) {
    base.error = result.error;
    return base;
  }

  switch (type) {
    case 'A':
    case 'AAAA':
      base.values = result.data.map(entry => ({
        value: entry.address,
        ttl: entry.ttl,
        ttlHuman: ttlToHuman(entry.ttl),
      }));
      break;
    case 'MX':
      base.values = result.data.map(entry => ({
        priority: entry.priority,
        value: entry.exchange,
        ttl: entry.ttl || null,
        ttlHuman: entry.ttl ? ttlToHuman(entry.ttl) : 'N/A',
      }));
      break;
    case 'TXT':
      base.values = result.data.map(entry => ({
        value: entry.join(' '),
      }));
      break;
    case 'NS':
      base.values = result.data.map(value => ({ value }));
      break;
    case 'CNAME':
      base.values = [{ value: result.data }];
      break;
    case 'SOA': {
      const s = result.data;
      base.values = [{
        nsname: s.nsname,
        hostmaster: s.hostmaster,
        serial: s.serial,
        refresh: s.refresh,
        retry: s.retry,
        expire: s.expire,
        minttl: s.minttl,
        ttl: s.minttl,
        ttlHuman: ttlToHuman(s.minttl),
      }];
      break;
    }
  }

  return base;
}

async function lookupDomain(domain, types, resolverServers = null) {
  const sanitizedDomain = sanitize(domain);
  if (!sanitizedDomain) throw new Error('Invalid domain input');

  const cacheKey = getCacheKey(sanitizedDomain, types, resolverServers);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return { records: cached, fromCache: true };
  }

  const resolver = createResolverWithServers(resolverServers);
  const results = [];
  for (const type of types) {
    const raw = await resolveWithTiming(resolver, type, sanitizedDomain);
    results.push(formatRecord(type, raw));
  }

  setCache(cacheKey, results);
  return { records: results, fromCache: false };
}

async function reverseLookup(ip) {
  const start = performance.now();
  try {
    const hostnames = await dnsPromises.reverse(ip);
    const elapsed = Math.round(performance.now() - start);
    return {
      responseTimeMs: elapsed,
      records: [{
        type: 'PTR',
        values: hostnames.map(hostname => ({ value: hostname })),
        responseTimeMs: elapsed,
      }],
    };
  } catch (err) {
    const elapsed = Math.round(performance.now() - start);
    const errorMsg = err.code === 'ENOTFOUND' || err.code === 'NXDOMAIN'
      ? 'No PTR record found for this IP'
      : err.message;
    return { responseTimeMs: elapsed, error: errorMsg, records: [] };
  }
}

module.exports = { lookupDomain, reverseLookup, ttlToHuman };
