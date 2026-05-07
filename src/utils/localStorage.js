const PREFIX = 'picard_config_';
const EXPIRY_DAYS = 30;

function safeStorage() {
  try {
    if (typeof window === 'undefined') return null;
    const test = '__picard_test__';
    window.localStorage.setItem(test, '1');
    window.localStorage.removeItem(test);
    return window.localStorage;
  } catch (err) {
    return null;
  }
}

export function saveConfiguration(code, email, configuration) {
  const storage = safeStorage();
  if (!storage) return null;
  const now = Date.now();
  const payload = {
    code,
    email,
    configuration,
    createdAt: now,
    expiresAt: now + EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  };
  storage.setItem(PREFIX + code, JSON.stringify(payload));
  return payload;
}

export function loadConfiguration(code, email) {
  const storage = safeStorage();
  if (!storage) return { status: 'unavailable' };
  const raw = storage.getItem(PREFIX + code.toUpperCase());
  if (!raw) return { status: 'not_found' };
  try {
    const data = JSON.parse(raw);
    if (data.expiresAt && data.expiresAt < Date.now()) {
      storage.removeItem(PREFIX + code.toUpperCase());
      return { status: 'expired' };
    }
    if (email && data.email && data.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
      return { status: 'email_mismatch' };
    }
    return { status: 'ok', data };
  } catch (err) {
    return { status: 'corrupted' };
  }
}

export function listSavedCodes() {
  const storage = safeStorage();
  if (!storage) return [];
  const codes = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && key.startsWith(PREFIX)) {
      codes.push(key.slice(PREFIX.length));
    }
  }
  return codes;
}
