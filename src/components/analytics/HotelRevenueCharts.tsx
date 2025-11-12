// src/components/analytics/HotelRevenueCharts.tsx
'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Colores con estética del dashboard - fill pastel + stroke sólido
const COLORS = {
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
  // Array para tipos de habitación
  roomTypes: [
    { fill: '#EFF6FF', stroke: '#3b82f6' },  // blue
    { fill: '#ECFDF5', stroke: '#22c55e' },  // green
    { fill: '#FFF7ED', stroke: '#f97316' },  // orange
    { fill: '#FEF2F2', stroke: '#ef4444' },  // red
  ],
};

// Formatter para moneda
const formatCurrency = (value: number) => `$${(value / 1000).toFixed(0)}K`;
const formatCurrencyFull = (value: number) => `ARS ${value.toLocaleString('es-AR')}`;

// Formatter para números
const formatNumber = (value: number) => value.toLocaleString('es-AR');

// ============================================
// 1. GRÁFICO DE INGRESOS POR TIPO DE HABITACIÓN
// ============================================
interface RevenueByRoomTypeData {
  roomType: string;
  totalRevenue: number;
  bookingCount: number;
  averageRevenue: number;
}

export function RevenueByRoomTypeChart({ data }: { data: RevenueByRoomTypeData[] }) {
  const roomTypeLabels: Record<string, string> = {
    SUITE_SINGLE: 'Suite Single',
    SUITE_DOUBLE: 'Suite Double',
    VILLA_PETIT: 'Villa Petit',
    VILLA_GRANDE: 'Villa Grande',
  };

  const chartData = data.map(item => ({
    ...item,
    name: roomTypeLabels[item.roomType] || item.roomType,
  }));

  return (
    <div>
      <h3 className="text-lg font-semibold text-black mb-4">Ingresos y reservas por Tipo de Habitación</h3>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
        <div className="flex justify-center">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#525252', fontSize: 12 }}
            angle={-15}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fill: '#525252', fontSize: 12 }}
            tickFormatter={formatCurrency}
            allowDecimals={false}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#525252', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              name === 'totalRevenue' ? formatCurrencyFull(value) : formatNumber(value),
              name === 'totalRevenue' ? 'Ingresos Totales' : 'Cantidad de Reservas'
            ]}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #d4d4d4',
              borderRadius: '8px',
            }}
          />
          <Bar 
            yAxisId="left"
            dataKey="totalRevenue" 
            fill={COLORS.blue.fill}
            stroke={COLORS.blue.stroke}
            strokeWidth={1}
            name="totalRevenue"
            radius={[6, 6, 0, 0]}
            barSize={70}
          />
          <Bar 
            yAxisId="right"
            dataKey="bookingCount" 
            fill={COLORS.green.fill}
            stroke={COLORS.green.stroke}
            strokeWidth={1}
            name="bookingCount"
            radius={[6, 6, 0, 0]}
            barSize={70}
          />
        </BarChart>
      </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 2. GRÁFICO DE DISTRIBUCIÓN DE INGRESOS (PIE)
// ============================================
export function RevenueDistributionChart({ data }: { data: RevenueByRoomTypeData[] }) {
  const roomTypeLabels: Record<string, string> = {
    SUITE_SINGLE: 'Suite Single',
    SUITE_DOUBLE: 'Suite Double',
    VILLA_PETIT: 'Villa Petit',
    VILLA_GRANDE: 'Villa Grande',
  };

  const chartData = data.map((item, index) => ({
    name: roomTypeLabels[item.roomType] || item.roomType,
    value: item.totalRevenue,
    color: COLORS.roomTypes[index % COLORS.roomTypes.length],
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // Función de renderizado personalizada para el label
  const renderLabel = (entry: any) => {
    const percent = entry.percent || 0;
    const name = entry.name || '';
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-black mb-4">Distribución de Ingresos por Tipo de Habitación</h3>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
      <div className="flex justify-center">
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            innerRadius={80}
            outerRadius={160}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color.fill}
                stroke={entry.color.stroke}
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => formatCurrencyFull(value)}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #d4d4d4',
              borderRadius: '8px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      </div>
      </div>
    </div>
  );
}

// ============================================
// 3. TENDENCIA MENSUAL DE INGRESOS
// ============================================
interface MonthlyRevenueData {
  month: string;
  totalRevenue: number;
  bookingCount: number;
  averageRevenue: number;
  totalNights: number;
}

export function MonthlyRevenueTrendChart({ data }: { data: MonthlyRevenueData[] }) {
  const monthLabels: Record<string, string> = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
  };

  const chartData = data.map(item => ({
    ...item,
    name: monthLabels[item.month.split('-')[1]] || item.month,
  }));

  return (
    <div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#525252', fontSize: 12 }}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fill: '#525252', fontSize: 12 }}
            tickFormatter={formatCurrency}
            allowDecimals={false}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#525252', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              name === 'totalRevenue' || name === 'averageRevenue' 
                ? formatCurrencyFull(value) 
                : formatNumber(value),
              name === 'totalRevenue' ? 'Ingresos Totales' : 
              name === 'bookingCount' ? 'Reservas' :
              name === 'totalNights' ? 'Noches Totales' :
              'Promedio por Reserva'
            ]}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #d4d4d4',
              borderRadius: '8px',
            }}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="totalRevenue" 
            stroke={COLORS.blue.stroke}
            strokeWidth={2.5}
            dot={{ fill: COLORS.blue.stroke, r: 4, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, fill: COLORS.blue.stroke, strokeWidth: 2, stroke: '#fff' }}
            name="totalRevenue"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="bookingCount" 
            stroke={COLORS.green.stroke}
            strokeWidth={2.5}
            dot={{ fill: COLORS.green.stroke, r: 4, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, fill: COLORS.green.stroke, strokeWidth: 2, stroke: '#fff' }}
            name="bookingCount"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="totalNights" 
            stroke={COLORS.orange.stroke}
            strokeWidth={2.5}
            dot={{ fill: COLORS.orange.stroke, r: 4, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, fill: COLORS.orange.stroke, strokeWidth: 2, stroke: '#fff' }}
            name="totalNights"
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================
// 4. TENDENCIA DIARIA DE INGRESOS
// ============================================
interface DailyRevenueData {
  date: string;
  totalRevenue: number;
  bookingCount: number;
  checkIns: number;
}

export function DailyRevenueTrendChart({ data }: { data: DailyRevenueData[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-black mb-4">Tendencia Diaria de Ingresos</h3>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#525252', fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fill: '#525252', fontSize: 12 }}
            tickFormatter={formatCurrency}
            allowDecimals={false}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#525252', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              name === 'totalRevenue' ? formatCurrencyFull(value) : formatNumber(value),
              name === 'totalRevenue' ? 'Ingresos' : 
              name === 'bookingCount' ? 'Reservas' :
              'Check-ins'
            ]}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #d4d4d4',
              borderRadius: '8px',
            }}
          />
          <Legend 
            formatter={(value) => 
              value === 'totalRevenue' ? 'Ingresos' : 
              value === 'bookingCount' ? 'Reservas' :
              'Check-ins'
            }
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="totalRevenue" 
            stroke={COLORS.blue.stroke}
            strokeWidth={2}
            dot={{ fill: COLORS.blue.stroke, r: 4 }}
            name="totalRevenue"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="checkIns" 
            stroke={COLORS.green.stroke}
            strokeWidth={2}
            dot={{ fill: COLORS.green.stroke, r: 4 }}
            name="checkIns"
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================
// 5. TABLA DE TOP HABITACIONES
// ============================================
interface TopRoomsData {
  roomNumber: string;
  roomType: string;
  totalRevenue: number;
  bookingCount: number;
  averageRevenue: number;
}

export function TopRoomsTable({ data }: { data: TopRoomsData[] }) {
  const roomTypeLabels: Record<string, string> = {
    SUITE_SINGLE: 'Suite Single',
    SUITE_DOUBLE: 'Suite Double',
    VILLA_PETIT: 'Villa Petit',
    VILLA_GRANDE: 'Villa Grande',
  };

  return (
    <div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                Habitación
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                Tipo
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
            {data.map((room, index) => (
              <tr 
                key={room.roomNumber} 
                className="border-b border-neutral-100 hover:bg-neutral-50 transition"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-semibold text-neutral-600">
                      {index + 1}
                    </div>
                    <span className="font-medium text-neutral-900">
                      #{room.roomNumber}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-neutral-600">
                  {roomTypeLabels[room.roomType] || room.roomType}
                </td>
                <td className="py-3 px-4 text-center font-semibold text-neutral-900">
                  {formatCurrency(room.totalRevenue)}
                </td>
                <td className="py-3 px-4 text-center text-neutral-600">
                  {room.bookingCount}
                </td>
                <td className="py-3 px-4 text-center text-neutral-600">
                  {formatCurrency(room.averageRevenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}

// ============================================
// 6. DISTRIBUCIÓN POR DURACIÓN DE ESTADÍA
// ============================================
interface StayDurationData {
  duration: string;
  bookingCount: number;
  totalRevenue: number;
  averageRevenue: number;
}

export function StayDurationChart({ data }: { data: StayDurationData[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-black mb-4">Distribución por Duración de Estadía</h3>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis 
            dataKey="duration" 
            tick={{ fill: '#525252', fontSize: 12 }}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fill: '#525252', fontSize: 12 }}
            tickFormatter={formatCurrency}
            allowDecimals={false}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#525252', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              name === 'totalRevenue' || name === 'averageRevenue'
                ? formatCurrencyFull(value) 
                : formatNumber(value),
              name === 'totalRevenue' ? 'Ingresos Totales' : 
              name === 'bookingCount' ? 'Cantidad de Reservas' :
              'Promedio por Reserva'
            ]}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #d4d4d4',
              borderRadius: '8px',
            }}
          />
          <Bar 
            yAxisId="left"
            dataKey="totalRevenue" 
            fill={COLORS.blue.fill}
            stroke={COLORS.blue.stroke}
            strokeWidth={1}
            name="totalRevenue"
            radius={[6, 6, 0, 0]}
            barSize={70}
          />
          <Bar 
            yAxisId="right"
            dataKey="bookingCount" 
            fill={COLORS.green.fill}
            stroke={COLORS.green.stroke}
            strokeWidth={1}
            name="bookingCount"
            radius={[6, 6, 0, 0]}
            barSize={70}
          />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================
// 7. DISTRIBUCIÓN POR CANTIDAD DE HUÉSPEDES
// ============================================
interface GuestDistributionData {
  guestCount: number;
  bookingCount: number;
  totalRevenue: number;
  averageRevenue: number;
}

export function GuestDistributionChart({ data }: { data: GuestDistributionData[] }) {
  const chartData = data.map(item => ({
    ...item,
    name: `${item.guestCount} ${item.guestCount === 1 ? 'huésped' : 'huéspedes'}`,
  }));

  return (
    <div>
      <h3 className="text-lg font-semibold text-black mb-4">Distribución por Cantidad de Huéspedes</h3>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#525252', fontSize: 12 }}
          />
          <YAxis 
            tick={{ fill: '#525252', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              formatNumber(value),
              name === 'bookingCount' ? 'Cantidad de Reservas' : 'Ingresos'
            ]}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #d4d4d4',
              borderRadius: '8px',
            }}
          />
          <Bar 
            dataKey="bookingCount" 
            fill={COLORS.green.fill}
            stroke={COLORS.green.stroke}
            strokeWidth={1}
            name="bookingCount"
            radius={[6, 6, 0, 0]}
            barSize={70}
          />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}