'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

type NewsletterCategoryType =
  | 'PROMOCIONES' | 'NOVEDADES' | 'EVENTOS'
  | 'TEMPORADA'  | 'CONSEJOS'  | 'GENERAL';

const LABELS: Record<NewsletterCategoryType, string> = {
  PROMOCIONES: 'Promociones',
  NOVEDADES:   'Novedades',
  EVENTOS:     'Eventos',
  TEMPORADA:   'Temporada',
  CONSEJOS:    'Consejos',
  GENERAL:     'General',
};

const CATEGORY_CLASSES: Record<NewsletterCategoryType, string> = {
  PROMOCIONES: "bg-green-50 border border-green-200 text-green-800",
  NOVEDADES:   "bg-blue-50 border border-blue-200 text-blue-800",
  EVENTOS:     "bg-red-50 border border-red-200 text-red-800",
  TEMPORADA:   "bg-orange-50 border border-orange-200 text-orange-800",
  CONSEJOS:    "bg-purple-50 border border-purple-200 text-purple-800",
  GENERAL:     "bg-gray-50 border border-gray-200 text-gray-800",
};


const COLORS: Record<NewsletterCategoryType, string> = {
  PROMOCIONES: '#008236',
  NOVEDADES:   '#2563eb',
  EVENTOS:     '#dc2626',
  TEMPORADA:   '#ea580c',
  CONSEJOS:    '#7c3aed',
  GENERAL:     '#404040',
};

// aclara el color hacia un pastel tipo "#FEFCE8"
function tintHex(hex: string, t = 0.9) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const [r, g, b] = [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)];
  const mix = (c: number) => Math.round(c + (255 - c) * t);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function buildData(items: { category: NewsletterCategoryType }[]) {
  const counts: Record<NewsletterCategoryType, number> =
    { PROMOCIONES:0, NOVEDADES:0, EVENTOS:0, TEMPORADA:0, CONSEJOS:0, GENERAL:0 };
  items.forEach(n => { counts[n.category] += 1; });
  return (Object.keys(counts) as NewsletterCategoryType[])
    .filter(k => counts[k] > 0)
    .map(k => ({ name: LABELS[k], value: counts[k], color: COLORS[k] }));
}

export default function CategoryPieStyled({
  newsletters,
}: {
  newsletters: { category: NewsletterCategoryType }[];
}) {
  const data = useMemo(() => buildData(newsletters), [newsletters]);

  return (
    <div>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="h-64" tabIndex={-1}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={0}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={tintHex(d.color, 0.9)} stroke={d.color} strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
