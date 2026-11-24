/** « il y a 12 min », « il y a 3 h », « il y a 4 j » */
export function ilYa(iso: string, maintenant = Date.now()) {
  const min = Math.max(0, Math.round((maintenant - new Date(iso).getTime()) / 60000));
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}
