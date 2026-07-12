const DOMAIN_REGEX = /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const IPV4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const ASCII_REGEX = /^[\x00-\x7F]+$/;
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const MAX_DOMAIN_LENGTH = 253;
const MAX_IP_LENGTH = 15;
const MAX_INPUT_LENGTH = 500;

function sanitize(input) {
  if (!input || typeof input !== 'string') return null;
  let s = input.trim();
  if (s.length > MAX_INPUT_LENGTH) return null;
  s = s.replace(CONTROL_CHARS_REGEX, '');
  if (!ASCII_REGEX.test(s)) return null;
  return s;
}

function cleanDomain(input) {
  const sanitized = sanitize(input);
  if (!sanitized) return null;
  let cleaned = sanitized;
  try {
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      const url = new URL(cleaned);
      cleaned = url.hostname;
    }
  } catch {
    return null;
  }
  cleaned = cleaned.replace(/\/+$/, '');
  const pathIndex = cleaned.indexOf('/');
  if (pathIndex > 0) cleaned = cleaned.substring(0, pathIndex);
  if (cleaned.length > MAX_DOMAIN_LENGTH) return null;
  return cleaned;
}

function isValidDomain(domain) {
  return DOMAIN_REGEX.test(domain);
}

function isValidIPv4(ip) {
  if (ip.length > MAX_IP_LENGTH) return false;
  const match = ip.match(IPV4_REGEX);
  if (!match) return false;
  return match.slice(1).every(octet => {
    const num = parseInt(octet, 10);
    return num >= 0 && num <= 255;
  });
}

function detectInputType(input) {
  if (!input || typeof input !== 'string') return { type: 'invalid', cleaned: null };
  const cleaned = cleanDomain(input);
  if (!cleaned) return { type: 'invalid', cleaned: null };
  if (isValidIPv4(cleaned)) return { type: 'ip', cleaned };
  if (isValidDomain(cleaned)) return { type: 'domain', cleaned };
  return { type: 'invalid', cleaned: null };
}

function isValidResolverIP(ip) {
  return isValidIPv4(ip);
}

module.exports = { cleanDomain, isValidDomain, isValidIPv4, detectInputType, sanitize, isValidResolverIP };
