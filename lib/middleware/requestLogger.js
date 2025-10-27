const SENSITIVE_KEYS = [
  'password',
  'pass',
  'authorization',
  'token',
  'secret',
  'email',
  'set-cookie',
  'cookie',
  'api-key',
  'apikey'
];

function isSensitiveKey(key = '') {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some((entry) => lowerKey.includes(entry));
}

function maskEmail(value) {
  if (typeof value !== 'string') {
    return '[redacted]';
  }

  const [localPart, domain = ''] = value.split('@');
  if (!localPart) {
    return '***';
  }

  const start = localPart.slice(0, 1);
  const end = localPart.length > 1 ? localPart.slice(-1) : '';
  return `${start}***${end}@${domain}`;
}

function maskGeneric(value) {
  if (typeof value !== 'string') {
    return '[redacted]';
  }

  if (value.length <= 4) {
    return '*'.repeat(value.length);
  }

  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

function maskAuthorization(value) {
  if (typeof value !== 'string') {
    return '[redacted]';
  }

  const [scheme, token] = value.split(/\s+/, 2);
  if (!token) {
    return `${scheme ?? ''} ***`.trim();
  }

  return `${scheme} ${maskGeneric(token)}`;
}

function sanitizeValue(value, key = '') {
  if (value === null || value === undefined) {
    return value;
  }

  if (isSensitiveKey(key)) {
    if (key.toLowerCase().includes('email')) {
      return maskEmail(value);
    }

    if (key.toLowerCase().includes('authorization')) {
      return maskAuthorization(value);
    }

    return maskGeneric(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, key));
  }

  if (typeof value === 'object') {
    const result = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      result[childKey] = sanitizeValue(childValue, childKey);
    }
    return result;
  }

  return value;
}

export default async function requestLogger(ctx, next) {
  const start = Date.now();
  let error;

  try {
    await next();
  } catch (err) {
    error = err;
    throw err;
  } finally {
    const durationMs = Date.now() - start;
    const statusCode = error?.status ?? ctx.status ?? 404;

    const logEntry = {
      level: error ? 'error' : 'info',
      timestamp: new Date().toISOString(),
      request: {
        method: ctx.method,
        path: ctx.path,
        query: sanitizeValue(ctx.query),
        ip: ctx.ip,
        headers: sanitizeValue(ctx.headers),
        body: sanitizeValue(ctx.request.body)
      },
      response: {
        status: statusCode,
        length: ctx.length ?? 0,
        durationMs
      }
    };

    if (error) {
      logEntry.error = {
        message: error.message,
        name: error.name,
        stack: error.stack
      };
    }

    console.log(JSON.stringify(logEntry));
  }
}
