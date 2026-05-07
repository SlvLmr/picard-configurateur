// Thin client around Netlify's Git Gateway, which proxies the GitHub
// Contents API. Authentication uses the JWT issued by Netlify Identity
// after login. We commit straight to the `main` branch of the connected
// repository.

const BRANCH = 'main';
const BASE = '/.netlify/git/github';

function getToken() {
  const user = window.netlifyIdentity?.currentUser?.();
  if (!user) throw new Error('Not authenticated');
  return user.jwt();
}

async function authHeaders() {
  const token = await getToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// Convert a UTF-8 string to a base64 string (Git API expects base64).
function utf8ToBase64(input) {
  return btoa(unescape(encodeURIComponent(input)));
}

function base64ToUtf8(input) {
  return decodeURIComponent(escape(atob(input.replace(/\n/g, ''))));
}

async function readFile(path) {
  const headers = await authHeaders();
  const url = `${BASE}/contents/${encodeURI(path)}?ref=${BRANCH}`;
  const res = await fetch(url, { headers });
  if (res.status === 404) return { content: null, sha: null };
  if (!res.ok) throw new Error(`Git Gateway read ${path} failed: ${res.status}`);
  const json = await res.json();
  return { content: base64ToUtf8(json.content), sha: json.sha };
}

async function writeFile(path, contentString, sha, message) {
  const headers = await authHeaders();
  const url = `${BASE}/contents/${encodeURI(path)}`;
  const body = {
    message: message || `chore(admin): update ${path}`,
    branch: BRANCH,
    content: utf8ToBase64(contentString),
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Git Gateway write ${path} failed: ${res.status} ${txt}`);
  }
  return res.json();
}

async function writeBinaryFile(path, base64Content, sha, message) {
  const headers = await authHeaders();
  const url = `${BASE}/contents/${encodeURI(path)}`;
  const body = {
    message: message || `chore(admin): upload ${path}`,
    branch: BRANCH,
    content: base64Content,
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Git Gateway upload ${path} failed: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function loadCollection(file) {
  const { content, sha } = await readFile(file);
  if (!content) return { items: [], sha: null };
  const parsed = JSON.parse(content);
  return { items: parsed.items || [], sha };
}

export async function saveCollection(file, items, sha, message) {
  const json = JSON.stringify({ items }, null, 2) + '\n';
  return writeFile(file, json, sha, message);
}

// Read a binary file as base64 (no `data:...;base64,` prefix).
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || '';
      const base64 = String(result).split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function slugifyFileName(name) {
  const dotIdx = name.lastIndexOf('.');
  const ext = dotIdx >= 0 ? name.slice(dotIdx).toLowerCase() : '';
  const base = (dotIdx >= 0 ? name.slice(0, dotIdx) : name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base || 'image'}-${Date.now().toString(36)}${ext || '.jpg'}`;
}

export async function uploadAmbianceImage(file) {
  const fileName = slugifyFileName(file.name);
  const path = `public/ambiances/${fileName}`;
  const base64 = await fileToBase64(file);
  await writeBinaryFile(path, base64, null, `chore(admin): upload ambiance ${fileName}`);
  return fileName; // stored relative; resolveAmbianceImage prepends /ambiances/
}
