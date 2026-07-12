const { lookupDomain, reverseLookup } = require('../services/dnsService');
const { detectInputType } = require('../utils/validators');

const VALID_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA'];

async function lookupAll(req, res) {
  try {
    const { domain, types: typesParam } = req.query;

    if (!domain) {
      return res.status(400).json({ error: 'Domain parameter is required' });
    }

    const inputInfo = detectInputType(domain);
    if (inputInfo.type === 'invalid') {
      return res.status(400).json({
        error: 'Invalid domain format. Please enter a valid domain (e.g., example.com)',
      });
    }

    let types;
    if (typesParam) {
      types = typesParam.split(',').map(t => t.trim().toUpperCase()).filter(t => VALID_TYPES.includes(t));
      if (types.length === 0) {
        return res.status(400).json({ error: 'No valid DNS record types specified' });
      }
    } else {
      types = [...VALID_TYPES];
    }

    const result = await lookupDomain(inputInfo.cleaned, types);

    const response = {
      domain: inputInfo.cleaned,
      queryTimestamp: new Date().toISOString(),
      fromCache: result.fromCache,
      totalRecords: result.records.filter(r => !r.error).length,
      records: result.records,
    };

    return res.json(response);
  } catch (err) {
    console.error('Error in lookupAll:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

async function lookupByType(req, res) {
  try {
    const { domain, type } = req.params;

    if (!domain) {
      return res.status(400).json({ error: 'Domain parameter is required' });
    }

    const typeUpper = type.toUpperCase();
    if (!VALID_TYPES.includes(typeUpper)) {
      return res.status(400).json({
        error: `Unsupported record type: ${typeUpper}. Supported types: ${VALID_TYPES.join(', ')}`,
      });
    }

    const inputInfo = detectInputType(domain);
    if (inputInfo.type === 'invalid') {
      return res.status(400).json({ error: 'Invalid domain format' });
    }

    const result = await lookupDomain(inputInfo.cleaned, [typeUpper]);

    const response = {
      domain: inputInfo.cleaned,
      type: typeUpper,
      queryTimestamp: new Date().toISOString(),
      fromCache: result.fromCache,
      records: result.records,
    };

    return res.json(response);
  } catch (err) {
    console.error('Error in lookupByType:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

async function reverseLookupEndpoint(req, res) {
  try {
    const { ip } = req.query;

    if (!ip) {
      return res.status(400).json({ error: 'IP parameter is required' });
    }

    const result = await reverseLookup(ip);

    const response = {
      domain: ip,
      queryTimestamp: new Date().toISOString(),
      totalRecords: result.error ? 0 : (result.records ? result.records.length : 0),
      records: result.error
        ? [{ type: 'PTR', error: result.error, values: [], responseTimeMs: result.responseTimeMs }]
        : result.records,
    };

    return res.json(response);
  } catch (err) {
    console.error('Error in reverseLookup:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

async function compareResolvers(req, res) {
  try {
    const { domain, types: typesParam, resolvers: resolversParam } = req.query;

    if (!domain) {
      return res.status(400).json({ error: 'Domain parameter is required' });
    }
    if (!resolversParam) {
      return res.status(400).json({ error: 'At least one resolver IP is required' });
    }

    const inputInfo = detectInputType(domain);
    if (inputInfo.type === 'invalid') {
      return res.status(400).json({ error: 'Invalid domain format' });
    }

    let types;
    if (typesParam) {
      types = typesParam.split(',').map(t => t.trim().toUpperCase()).filter(t => VALID_TYPES.includes(t));
      if (types.length === 0) types = [...VALID_TYPES];
    } else {
      types = [...VALID_TYPES];
    }

    const resolverList = resolversParam.split(',').map(r => r.trim());

    const resolverResults = {};
    for (const resolverIp of resolverList) {
      const r = await lookupDomain(inputInfo.cleaned, types, [resolverIp]);
      resolverResults[resolverIp] = r.records;
    }

    const response = {
      domain: inputInfo.cleaned,
      queryTimestamp: new Date().toISOString(),
      resolvers: resolverResults,
    };

    return res.json(response);
  } catch (err) {
    console.error('Error in compareResolvers:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

module.exports = { lookupAll, lookupByType, reverseLookupEndpoint, compareResolvers };
