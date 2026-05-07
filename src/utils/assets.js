// Resolve an image filename stored in the catalog into a usable URL
// honouring Vite's BASE_URL (so the same code works on GitHub Pages
// behind /picard-configurateur/ and on a custom domain at /).
export function resolveDecorImage(filename) {
  if (!filename) return null;
  if (/^https?:\/\//i.test(filename) || filename.startsWith('/')) {
    return filename;
  }
  return `${import.meta.env.BASE_URL}decors/${filename}`;
}
