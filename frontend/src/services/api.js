const BASE_URL = '/api/dns';

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return data;
}

export async function lookupAll(domain, types) {
  const typesParam = types ? `&types=${types.join(',')}` : '';
  const response = await fetch(`${BASE_URL}/lookup?domain=${encodeURIComponent(domain)}${typesParam}`);
  return handleResponse(response);
}

export async function lookupByType(domain, type) {
  const response = await fetch(`${BASE_URL}/lookup/${encodeURIComponent(domain)}/${type}`);
  return handleResponse(response);
}

export async function reverseLookup(ip) {
  const response = await fetch(`${BASE_URL}/reverse?ip=${encodeURIComponent(ip)}`);
  return handleResponse(response);
}

export async function compareResolvers(domain, types, resolvers) {
  const response = await fetch(`${BASE_URL}/compare?domain=${encodeURIComponent(domain)}&types=${types.join(',')}&resolvers=${resolvers.join(',')}`);
  return handleResponse(response);
}
