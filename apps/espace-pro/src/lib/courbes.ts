/**
 * Tracés de courbes lissées (interpolation cubique monotone, méthode Fritsch-Carlson).
 * La courbe passe par chaque point sans jamais dépasser les valeurs voisines :
 * pas de bosse ni de creux inventés, les données restent justes.
 */
export type Point = [number, number];

export function courbeLissee(points: Point[]): string {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M${f(points[0][0])} ${f(points[0][1])}`;
  if (n === 2) return `M${f(points[0][0])} ${f(points[0][1])}L${f(points[1][0])} ${f(points[1][1])}`;

  const dx: number[] = [];
  const pentes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1][0] - points[i][0];
    pentes[i] = dx[i] === 0 ? 0 : (points[i + 1][1] - points[i][1]) / dx[i];
  }
  const t: number[] = new Array(n);
  t[0] = pentes[0];
  t[n - 1] = pentes[n - 2];
  for (let i = 1; i < n - 1; i++) {
    t[i] = pentes[i - 1] * pentes[i] <= 0 ? 0 : (pentes[i - 1] + pentes[i]) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    if (pentes[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / pentes[i];
    const b = t[i + 1] / pentes[i];
    const h = a * a + b * b;
    if (h > 9) {
      const k = 3 / Math.sqrt(h);
      t[i] = k * a * pentes[i];
      t[i + 1] = k * b * pentes[i];
    }
  }

  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const c = dx[i] / 3;
    d += `C${f(x0 + c)} ${f(y0 + c * t[i])} ${f(x1 - c)} ${f(y1 - c * t[i + 1])} ${f(x1)} ${f(y1)}`;
  }
  return d;
}

/** Aire sous une courbe lissée, refermée sur la ligne de base. */
export function aireLissee(points: Point[], base: number): string {
  if (points.length < 2) return "";
  const dernier = points[points.length - 1];
  return `${courbeLissee(points)}L${f(dernier[0])} ${f(base)}L${f(points[0][0])} ${f(base)}Z`;
}

const f = (v: number) => v.toFixed(1);
