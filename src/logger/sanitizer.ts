const SENSITIVE_PATTERNS = [
  /\b(token|apikey|api_key|apitoken|api_token|accesstoken|access_token|bearer)\b[:\s=]+[^\s,}\]]+/gi,
  /\b(password|passwd|pwd)\b[:\s=]+[^\s,}\]]+/gi,
  /\b(secret|private_key|privatekey)\b[:\s=]+[^\s,}\]]+/gi,
  /\b(authorization)\b[:\s=]+[^\s,}\]]+/gi,
  /\b(cookie)\b[:\s=]+[^\s,}\]]+/gi,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  /\b[A-Fa-f0-9]{32,}\b/g,
  /https?:\/\/[^\s]*\.s3[^\s]*\.amazonaws\.com[^\s]*/gi,
  /https?:\/\/s3[^\s]*\.amazonaws\.com[^\s]*/gi,
];

function sanitizeSensitiveMatch(match: string): string {
  const keyMatch = match.match(/^([^:=\s]+)[:\s=]+(.+)$/);
  if (!keyMatch) return "[REDACTED]";

  const [, key, value] = keyMatch;
  return value.startsWith("[REDACTED") ? match : `${key}: [REDACTED]`;
}

export function sanitizeText(text: string): string {
  let sanitized = text;

  for (const pattern of SENSITIVE_PATTERNS) {
    pattern.lastIndex = 0;
    sanitized = sanitized.replace(pattern, sanitizeSensitiveMatch);
  }

  return sanitized;
}

export function sanitizeValue(
  value: unknown,
  seen = new WeakSet<object>(),
): unknown {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string") return sanitizeText(value);

  if (Array.isArray(value)) {
    if (seen.has(value)) return { _circular: true };
    seen.add(value);
    return value.map((item) => sanitizeValue(item, seen));
  }

  if (value && typeof value === "object") {
    return sanitizeMetadata(value as Record<string, unknown>, seen);
  }

  return value;
}

export function sanitizeMetadata(
  obj: Record<string, unknown>,
  seen = new WeakSet<object>(),
): Record<string, unknown> {
  if (seen.has(obj)) return { _circular: true };
  seen.add(obj);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = sanitizeValue(value, seen);
  }
  return result;
}
