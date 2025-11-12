// src/components/analytics/ServiceRevenueCharts.tsx
'use client';

import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Colores con estética del dashboard - fill pastel + stroke sólido
const CHART_COLORS = {
  primary: {
    fill: '#F5F5F5',    // neutral-100
    stroke: '#525252',   // neutral-600
  },
  green: {
    fill: '#ECFDF5',    // green-50
    stroke: '#22c55e',   // green-600
  },
  blue: {
    fill: '#EFF6FF',    // blue-50
    stroke: '#3b82f6',   // blue-600
  },
  purple: {
    fill: '#F5F3FF',    // purple-50
    stroke: '#a855f7',   // purple-600
  },
  orange: {
    fill: '#FFF7ED',    // orange-50
    stroke: '#f97316',   // orange-600
  },
  yellow: {
    fill: '#FEFCE8',    // yellow-50
    stroke: '#eab308',   // yellow-600
  },
  red: {
    fill: '#FEF2F2',    // red-50
    stroke: '#ef4444',   // red-600
  },
  cyan: {
    fill: '#ECFEFF',    // cyan-50
    stroke: '#0891b2',   // cyan-600
  },
  lime: {
    fill: '#F7FEE7',    // lime-50
    stroke: '#65a30d',   // lime-600
  },
};

const CATEGORY_COLORS: Record<string, { fill: string; stroke: string }> = {
  SPIRITUAL_ILLUMINATION: CHART_COLORS.purple,
  PHYSICAL_OPTIMISATION: CHART_COLORS.blue,
  MENTAL_EQUILIBRIUM: CHART_COLORS.green,
  CULINARY_EXPERIENCE: CHART_COLORS.orange,
  NATURE_CULTURE: CHART_COLORS.lime,
  WINE_EXPERIENCE: CHART_COLORS.purple,
  RELAXATION_NATURE: CHART_COLORS.cyan,
};

interface RevenueByServiceProps {
  data: Array<{
    serviceName: string;
    totalRevenue: number;
    bookingCount: number;
  }>;
}

export function RevenueByServiceChart({ data }: RevenueByServiceProps) {
  const sortedData = [...data].sort((a, b) => b.totalRevenue - a.totalRevenue);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-100 p-6">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={sortedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis 
            dataKey="serviceName" 
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tick={{ fill: '#525252', fontSize: 12 }}
          />
          <YAxis 
            tick={{ fill: '#525252', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString('es-AR')}`}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #d4d4d4',
              borderRadius: '8px'
            }}
          />
          <Bar 
            dataKey="totalRevenue" 
            fill={CHART_COLORS.primary.fill}
            stroke={CHART_COLORS.primary.stroke}
            strokeWidth={1}
            name="Ingresos"
            radius={[6, 6, 0, 0]}
            barSize={70}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface RevenueByTypeProps {
  data: Array<{
    type: string;
    totalRevenue: number;
    bookingCount: number;
  }>;
}

export function RevenueByTypeChart({ data }: RevenueByTypeProps) {
  const pieData = data.map((item) => ({
    name: item.type === 'SPA' ? 'Spa' : 'Experiencias',
    value: item.totalRevenue,
    bookings: item.bookingCount,
    // Spa = azul, Experiencias = violeta
    color: item.type === 'SPA' ? CHART_COLORS.blue : CHART_COLORS.purple,
  }));

  return (
    <div>
      <h3 className="text-lg font-semibold text-black mb-4">Ingresos por spa/experiencias</h3>
      <div className="bg-white rounded-lg shadow-sm border border-neutral-100 p-6">
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={160}
              paddingAngle={0}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color.fill}
                  stroke={entry.color.stroke}
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string, props: any) => [
                `$${value.toLocaleString('es-AR')} (${props.payload.bookings} reservas)`,
                name
              ]}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #d4d4d4',
                borderRadius: '8px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface RevenueByCategoryProps {
  data: Array<{
    category: string;
    type: string;
    totalRevenue: number;
    bookingCount: number;
  }>;
}

export function RevenueByCategoryChart({ data }: RevenueByCategoryProps) {
  const formattedData = data.map(item => ({
    ...item,
    categoryName: formatCategoryName(item.category),
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);

  return (
    <div> 
    <h3 className="text-lg font-semibold text-black mb-4">Ingresos por categoría</h3>
    <div className="bg-white rounded-lg shadow-sm border border-neutral-100 p-6">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={formattedData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis 
            type="number" 
            tick={{ fill: '#525252', fontSize: 12 }}
            allowDecimals={false}
          />
          <YAxis 
            dataKey="categoryName" 
            type="category" 
            width={150}
            tick={{ fill: '#525252', fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString('es-AR')}`}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #d4d4d4',
              borderRadius: '8px'
            }}
          />
          <Bar 
            dataKey="totalRevenue" 
            name="Ingresos"
            fill={CHART_COLORS.primary.fill}
            stroke={CHART_COLORS.primary.stroke}
            strokeWidth={1}
            radius={[0, 6, 6, 0]}
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
    </div>
  );
}

interface MonthlyTrendProps {
  data: Array<{
    month: string;
    totalRevenue: number;
    bookingCount: number;
    spaRevenue: number;
    experienceRevenue: number;
  }>;
}

export function MonthlyTrendChart({ data }: MonthlyTrendProps) {
  const formattedData = data.map(item => ({
    ...item,
    monthName: formatMonthName(item.month),
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-100 p-6">
      <h3 className="text-lg font-semibold text-black mb-4">Tendencia Mensual de Ingresos</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis 
            dataKey="monthName"
            tick={{ fill: '#525252', fontSize: 12 }}
          />
          <YAxis 
            tick={{ fill: '#525252', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString('es-AR')}`}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #d4d4d4',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="totalRevenue" 
            stroke={CHART_COLORS.primary.stroke}
            name="Total"
            strokeWidth={2}
            dot={{ fill: CHART_COLORS.primary.stroke, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="spaRevenue" 
            stroke={CHART_COLORS.green.stroke}
            name="Spa"
            strokeWidth={2}
            dot={{ fill: CHART_COLORS.green.stroke, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="experienceRevenue" 
            stroke={CHART_COLORS.blue.stroke}
            name="Experiencias"
            strokeWidth={2}
            dot={{ fill: CHART_COLORS.blue.stroke, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DailyTrendProps {
  data: Array<{
    date: string;
    totalRevenue: number;
    bookingCount: number;
  }>;
}

// ============= NUEVO COMPONENTE: GRÁFICO DE INGRESOS CON TOGGLE =============
interface RevenueTrendChartProps {
  monthlyData: Array<{
    month: string;
    totalRevenue: number;
    bookingCount: number;
    spaRevenue: number;
    experienceRevenue: number;
  }>;
  dailyData: Array<{
    date: string;
    totalRevenue: number;
    bookingCount: number;
  }>;
}

export function RevenueTrendChart({ monthlyData, dailyData }: RevenueTrendChartProps) {
  // Siempre usar vista mensual
  const chartData = monthlyData.map(item => ({
    name: formatMonthName(item.month),
    SPA: item.spaRevenue,
    Experiencias: item.experienceRevenue,
    Total: item.totalRevenue,
  }));
  const hasData = chartData.length > 0;

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-100">
        {hasData ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#404040', fontSize: 12 }}
                label={{
                  value: 'Mes',
                  position: 'insideBottom',
                  offset: -15,
                  style: { fontSize: 12, fill: '#404040', fontWeight: 500 }
                }}
              />
              <YAxis
                tick={{ fill: '#404040', fontSize: 12 }}
                label={{
                  value: 'Ingresos (ARS)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12, fill: '#404040', fontWeight: 500, textAnchor: 'middle' }
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #d4d4d4',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                formatter={(value: any) => [`ARS ${value.toLocaleString('es-AR')}`, '']}
              />
              
              {/* 3 líneas: SPA, Experiencias, Total */}
              <Line
                type="monotone"
                dataKey="SPA"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                name="SPA"
              />
              <Line
                type="monotone"
                dataKey="Experiencias"
                stroke="#a855f7"
                strokeWidth={2.5}
                dot={{ fill: '#a855f7', r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#a855f7', strokeWidth: 2, stroke: '#fff' }}
                name="Experiencias"
              />
              <Line
                type="monotone"
                dataKey="Total"
                stroke="#404040"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ fill: '#404040', r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#404040', strokeWidth: 2, stroke: '#fff' }}
                name="Total"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-neutral-400">
            No hay datos para mostrar
          </div>
        )}
      </div>
    </div>
  );
}

interface TopServicesProps {
  data: Array<{
    serviceName: string;
    totalRevenue: number;
    bookingCount: number;
    averageRevenue: number;
  }>;
}

export function TopServicesTable({ data }: TopServicesProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-neutral-200">
      <h3 className="text-lg font-semibold text-black mb-4">Top Servicios por Ingresos</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                Servicio
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-700">
                Ingresos Totales
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-700">
                Reservas
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-700">
                Promedio
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((service, index) => (
              <tr 
                key={index} 
                className="border-b border-neutral-100 hover:bg-neutral-50 transition"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-semibold text-neutral-600">
                      {index + 1}
                    </div>
                    <span className="font-medium text-neutral-900">
                      {service.serviceName}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center font-semibold text-neutral-900">
                  ${(service.totalRevenue / 1000).toFixed(0)}K
                </td>
                <td className="py-3 px-4 text-center text-neutral-600">
                  {service.bookingCount}
                </td>
                <td className="py-3 px-4 text-center text-neutral-600">
                  ${(service.averageRevenue / 1000).toFixed(0)}K
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Utilidades de formato
function formatCategoryName(category: string): string {
  const names: Record<string, string> = {
    SPIRITUAL_ILLUMINATION: 'Iluminación Espiritual',
    PHYSICAL_OPTIMISATION: 'Optimización Física',
    MENTAL_EQUILIBRIUM: 'Equilibrio Mental',
    CULINARY_EXPERIENCE: 'Experiencia Culinaria',
    NATURE_CULTURE: 'Naturaleza y Cultura',
    WINE_EXPERIENCE: 'Experiencia Vinos',
    RELAXATION_NATURE: 'Relajación y Naturaleza',
  };
  return names[category] || category;
}

function formatMonthName(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', { 
    day: '2-digit', 
    month: '2-digit' 
  });
}