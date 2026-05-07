// Resolve an image filename stored in the catalog into a usable URL
// honouring Vite's BASE_URL.
export function resolveAmbianceImage(filename) {
  if (!filename) return null;
  if (/^https?:\/\//i.test(filename) || filename.startsWith('/')) {
    return filename;
  }
  return `${import.meta.env.BASE_URL}ambiances/${filename}`;
}
