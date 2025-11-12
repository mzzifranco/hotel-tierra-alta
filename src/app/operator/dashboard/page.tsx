'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalReservations: 0,
    pendingReservations: 0,
    confirmedReservations: 0,
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    totalRevenue: 0,
    pendingMessages: 0,
    totalServiceBookings: 0,
    pendingServiceBookings: 0,
  });
  const [recentReservations, setRecentReservations] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [recentServiceBookings, setRecentServiceBookings] = useState<any[]>([]);
  const [allServiceBookings, setAllServiceBookings] = useState<any[]>([]);
  const [allReservations, setAllReservations] = useState<any[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenueView, setRevenueView] = useState<'monthly' | 'weekly'>('monthly');
  const [reservationsView, setReservationsView] = useState<'monthly' | 'weekly'>('monthly');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role !== 'ADMIN') {
        router.push('/');
      } else {
        fetchDashboardData();
      }
    }
  }, [status, router, session]);

  const fetchDashboardData = async () => {
    try {
      const [reservationsRes, roomsRes, messagesRes, serviceBookingsRes] = await Promise.all([
        fetch('/api/admin/reservations'),
        fetch('/api/admin/rooms'),
        fetch('/api/operator/messages'),
        fetch('/api/admin/service-bookings'),
      ]);

      if (reservationsRes.ok) {
        const data = await reservationsRes.json();
        const reservations = data.reservations || [];
        
        setAllReservations(reservations);
        
        setStats(prev => ({
          ...prev,
          totalReservations: reservations.length,
          pendingReservations: reservations.filter((r: any) => r.status === 'PENDING').length,
          confirmedReservations: reservations.filter((r: any) => r.status === 'CONFIRMED').length,
          totalRevenue: reservations
            .filter((r: any) => r.status !== 'CANCELLED')
            .reduce((sum: number, r: any) => sum + r.totalPrice, 0),
        }));
        
        setRecentReservations(reservations.slice(0, 5));
      }

      if (roomsRes.ok) {
        const data = await roomsRes.json();
        const rooms = data.rooms || [];
        
        setAllRooms(rooms);
        
        setStats(prev => ({
          ...prev,
          totalRooms: rooms.length,
          availableRooms: rooms.filter((r: any) => r.status === 'AVAILABLE').length,
          occupiedRooms: rooms.filter((r: any) => r.status === 'OCCUPIED').length,
        }));
      }

      if (messagesRes.ok) {
        const data = await messagesRes.json();
        const messages = data.messages || [];
        
        setAllMessages(messages);
        
        setStats(prev => ({
          ...prev,
          pendingMessages: messages.filter((m: any) => m.status === 'OPEN').length,
        }));

        setRecentMessages(messages.slice(0, 5));
      }

      if (serviceBookingsRes.ok) {
        const data = await serviceBookingsRes.json();
        const serviceBookings = data.bookings || [];
        
        setAllServiceBookings(serviceBookings);
        
        setStats(prev => ({
          ...prev,
          totalServiceBookings: serviceBookings.length,
          pendingServiceBookings: serviceBookings.filter((b: any) => b.status === 'PENDING').length,
        }));

        setRecentServiceBookings(serviceBookings.slice(0, 5));
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      CONFIRMED: 'bg-blue-50 border-blue-200 text-blue-800',
      CHECKED_IN: 'bg-green-50 border-green-200 text-green-800',
      CHECKED_OUT: 'bg-orange-50 border-orange-200 text-orange-800',
      CANCELLED: 'bg-red-50 border-red-200 text-red-800',
      IN_PROGRESS: 'bg-purple-50 border-purple-200 text-purple-800',
      COMPLETED: 'bg-green-50 border-green-200 text-green-800',
      NO_SHOW: 'bg-gray-50 border-gray-200 text-gray-800',
    };
    return colors[status] || 'bg-neutral-50 border-neutral-200 text-neutral-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmada',
      CHECKED_IN: 'Check-in',
      CHECKED_OUT: 'Check-out',
      CANCELLED: 'Cancelada',
      IN_PROGRESS: 'En progreso',
      COMPLETED: 'Completada',
      NO_SHOW: 'No asistió',
    };
    return labels[status] || status;
  };

  const getMessageStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      OPEN: 'Pendiente',
      REPLIED: 'Respondido',
      ARCHIVED: 'Archivado',
    };
    return labels[status] || status;
  };

  const getMessageStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      REPLIED: 'bg-green-50 border-green-200 text-green-800',
      ARCHIVED: 'bg-red-50 border-red-200 text-red-800',
    };
    return colors[status] || 'bg-neutral-50 border-neutral-200 text-neutral-800';
  };

  const getRoomTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SUITE_SINGLE: 'Suite Simple',
      SUITE_DOUBLE: 'Suite Doble',
      VILLA_PETIT: 'Villa Petit',
      VILLA_GRANDE: 'Villa Grande',
    };
    return labels[type] || type;
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SPA: 'Spa',
      EXPERIENCE: 'Experiencia',
    };
    return labels[type] || type;
  };

  // Procesamiento de datos para gráficos
  const getMonthlyRevenueData = () => {
    const monthlyData: Record<string, number> = {};
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
      monthlyData[key] = 0;
      last6Months.push({ key, label });
    }

    allReservations
      .filter((r: any) => r.status !== 'CANCELLED')
      .forEach((r: any) => {
        const date = new Date(r.checkIn);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData.hasOwnProperty(key)) {
          monthlyData[key] += r.totalPrice;
        }
      });

    return last6Months.map(({ key, label }) => ({
      name: label,
      ingresos: monthlyData[key],
    }));
  };

  const getWeeklyRevenueData = () => {
    const weeklyData: Record<string, number> = {};
    const last8Weeks = [];
    const now = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 7));
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toISOString().split('T')[0];
      const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
      weeklyData[key] = 0;
      last8Weeks.push({ key, label });
    }

    allReservations
      .filter((r: any) => r.status !== 'CANCELLED')
      .forEach((r: any) => {
        const date = new Date(r.checkIn);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const key = weekStart.toISOString().split('T')[0];
        if (weeklyData.hasOwnProperty(key)) {
          weeklyData[key] += r.totalPrice;
        }
      });

    return last8Weeks.map(({ key, label }) => ({
      name: label,
      ingresos: weeklyData[key],
    }));
  };

  const getMonthlyReservationsData = () => {
  const monthlyData: Record<string, number> = {};
  const last6Months = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
    monthlyData[key] = 0;
    last6Months.push({ key, label });
  }

  allReservations.forEach((r: any) => {
    // CAMBIO: Usar checkIn en lugar de createdAt
    const date = new Date(r.checkIn);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData.hasOwnProperty(key)) {
      monthlyData[key]++;
    }
  });

  return last6Months.map(({ key, label }) => ({
    name: label,
    reservas: monthlyData[key],
  }));
};

const getWeeklyReservationsData = () => {
  const weeklyData: Record<string, number> = {};
  const last8Weeks = [];
  const now = new Date();
  
  for (let i = 7; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 7));
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().split('T')[0];
    const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    weeklyData[key] = 0;
    last8Weeks.push({ key, label });
  }

  allReservations.forEach((r: any) => {
    // CAMBIO: Usar checkIn en lugar de createdAt
    const date = new Date(r.checkIn);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (weeklyData.hasOwnProperty(key)) {
      weeklyData[key]++;
    }
  });

  return last8Weeks.map(({ key, label }) => ({
    name: label,
    reservas: weeklyData[key],
  }));
};
  const getOccupancyByRoomType = () => {
    const roomTypes: Record<string, { total: number; occupied: number }> = {
      SUITE_SINGLE: { total: 0, occupied: 0 },
      SUITE_DOUBLE: { total: 0, occupied: 0 },
      VILLA_PETIT: { total: 0, occupied: 0 },
      VILLA_GRANDE: { total: 0, occupied: 0 },
    };

    allRooms.forEach((room: any) => {
      if (roomTypes[room.type]) {
        roomTypes[room.type].total++;
        if (room.status === 'OCCUPIED') {
          roomTypes[room.type].occupied++;
        }
      }
    });

    return Object.entries(roomTypes).map(([type, data]) => ({
      name: getRoomTypeLabel(type),
      ocupadas: data.occupied,
      disponibles: data.total - data.occupied,
      ocupacion: data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0,
    }));
  };

  const tintHex = (hex: string, t = 0.9) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    const [r, g, b] = [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)];
    const mix = (c: number) => Math.round(c + (255 - c) * t);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  };

  const serviceBookingsData = [
    { name: 'Pendientes', value: allServiceBookings.filter((b: any) => b.status === 'PENDING').length, color: '#eab308' },
    { name: 'Confirmadas', value: allServiceBookings.filter((b: any) => b.status === 'CONFIRMED').length, color: '#3b82f6' },
    { name: 'En progreso', value: allServiceBookings.filter((b: any) => b.status === 'IN_PROGRESS').length, color: '#a855f7' },
    { name: 'Completadas', value: allServiceBookings.filter((b: any) => b.status === 'COMPLETED').length, color: '#22c55e' },
    { name: 'Canceladas', value: allServiceBookings.filter((b: any) => b.status === 'CANCELLED').length, color: '#ef4444' },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3eee7] flex items-center justify-center">
        <Header />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando...</p>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />
      <section className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-black mb-2">Dashboard Administrativo</h1>
          <div className="h-px w-20 bg-black/20 mb-2" />
          <p className="text-neutral-600">Bienvenido, {session?.user?.name}</p>
        </div>

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-neutral-100 group">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Habitaciones</p>
                <p className="text-3xl font-bold text-black mb-1">{stats.totalRooms}</p>
              </div>
              <div className="bg-neutral-100 p-3 rounded-lg group-hover:bg-neutral-200 transition-colors duration-200">
                <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
              <span className="text-xs text-green-700 font-medium">{stats.availableRooms} disponibles</span>
              <span className="text-neutral-300">•</span>
              <span className="text-xs text-blue-700 font-medium">{stats.occupiedRooms} ocupadas</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-neutral-100 group">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Reservas habitaciones</p>
                <p className="text-3xl font-bold text-black mb-1">{stats.totalReservations}</p>
              </div>
              <div className="bg-neutral-100 p-3 rounded-lg group-hover:bg-neutral-200 transition-colors duration-200">
                <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
              <span className="text-xs text-yellow-700 font-medium">{stats.pendingReservations} pendientes</span>
              <span className="text-neutral-300">•</span>
              <span className="text-xs text-blue-700 font-medium">{stats.confirmedReservations} confirmadas</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-neutral-100 group">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Reservas servicios</p>
                <p className="text-3xl font-bold text-black mb-1">{stats.totalServiceBookings}</p>
              </div>
              <div className="bg-neutral-100 p-3 rounded-lg group-hover:bg-neutral-200 transition-colors duration-200">
                <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
              <span className="text-xs text-yellow-700 font-medium">{stats.pendingServiceBookings} pendientes</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-neutral-100 group">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Mensajes</p>
                <p className="text-3xl font-bold text-black mb-1">{allMessages.length}</p>
              </div>
              <div className="bg-neutral-100 p-3 rounded-lg group-hover:bg-neutral-200 transition-colors duration-200">
                <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
              <span className="text-xs text-yellow-700 font-medium">{allMessages.filter((m: any) => m.status === 'OPEN').length} pendientes</span>
            </div>
          </div>
          
        </div>

        {/* Gráfico de Ocupación por Tipo de Habitación */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-black mb-4">Ocupación por Tipo de Habitación</h2>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-100">
            {allRooms.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={getOccupancyByRoomType()}
                  margin={{ top: 20, right: 30, left: 50, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    label={{ value: 'Tipo de Habitación', position: 'insideBottom', offset: -10, style: { fontSize: 12, fill: '#404040' } }}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    label={{ value: 'Cantidad de habitaciones', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#404040', textAnchor: 'middle' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="ocupadas" fill="#EFF6FF" stroke="#3b82f6" strokeWidth={1} name="Ocupadas" radius={[6, 6, 0, 0]} barSize={70} />
                  <Bar dataKey="disponibles" fill="#ECFDF5" stroke="#22c55e" strokeWidth={1} name="Disponibles" radius={[6, 6, 0, 0]} barSize={70} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-neutral-400">
                No hay datos para mostrar
              </div>
            )}
          </div>
        </div>

        {/* Gráficos de Estado (Tortas) */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-black mb-4">Distribución de recursos</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Estado de Habitaciones */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-3">Estado de Habitaciones</h3>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-100">
                {stats.totalRooms > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Disponibles', value: stats.availableRooms, color: '#22c55e' },
                          { name: 'Ocupadas', value: stats.occupiedRooms, color: '#3b82f6' },
                          { name: 'Otras', value: stats.totalRooms - stats.availableRooms - stats.occupiedRooms, color: '#94a3b8' },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={0}
                      >
                        {[
                          { name: 'Disponibles', value: stats.availableRooms, color: '#22c55e' },
                          { name: 'Ocupadas', value: stats.occupiedRooms, color: '#3b82f6' },
                          { name: 'Otras', value: stats.totalRooms - stats.availableRooms - stats.occupiedRooms, color: '#94a3b8' },
                        ].map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={tintHex(entry.color, 0.9)} 
                            stroke={entry.color} 
                            strokeWidth={1}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-neutral-400">
                    No hay datos
                  </div>
                )}
              </div>
            </div>

            {/* Estado de Reservas */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-3">Estado de Reservas</h3>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-100">
                {stats.totalReservations > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pendientes', value: stats.pendingReservations, color: '#eab308' },
                          { name: 'Confirmadas', value: stats.confirmedReservations, color: '#3b82f6' },
                          { name: 'Otras', value: stats.totalReservations - stats.pendingReservations - stats.confirmedReservations, color: '#94a3b8' },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={0}
                      >
                        {[
                          { name: 'Pendientes', value: stats.pendingReservations, color: '#eab308' },
                          { name: 'Confirmadas', value: stats.confirmedReservations, color: '#3b82f6' },
                          { name: 'Otras', value: stats.totalReservations - stats.pendingReservations - stats.confirmedReservations, color: '#94a3b8' },
                        ].map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={tintHex(entry.color, 0.9)} 
                            stroke={entry.color} 
                            strokeWidth={1}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-neutral-400">
                    No hay datos
                  </div>
                )}
              </div>
            </div>

            {/* Estado de Servicios - NUEVO */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-3">Reservas de Servicios</h3>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-100">
                {stats.totalServiceBookings > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={serviceBookingsData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={0}
                      >
                        {serviceBookingsData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={tintHex(entry.color, 0.9)} 
                            stroke={entry.color} 
                            strokeWidth={1}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-neutral-400">
                    No hay datos
                  </div>
                )}
              </div>
            </div>

            {/* Estado de Mensajes */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-3">Estado de Mensajes</h3>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-100">
                {recentMessages.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pendientes', value: recentMessages.filter((m: any) => m.status === 'OPEN').length, color: '#eab308' },
                          { name: 'Respondidos', value: recentMessages.filter((m: any) => m.status === 'REPLIED').length, color: '#22c55e' },
                          { name: 'Archivados', value: recentMessages.filter((m: any) => m.status === 'ARCHIVED').length, color: '#ef4444' },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={0}
                      >
                        {[
                          { name: 'Pendientes', value: recentMessages.filter((m: any) => m.status === 'OPEN').length, color: '#eab308' },
                          { name: 'Respondidos', value: recentMessages.filter((m: any) => m.status === 'REPLIED').length, color: '#22c55e' },
                          { name: 'Archivados', value: recentMessages.filter((m: any) => m.status === 'ARCHIVED').length, color: '#ef4444' },
                        ].map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={tintHex(entry.color, 0.9)} 
                            stroke={entry.color} 
                            strokeWidth={1}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-neutral-400">
                    No hay datos
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <a href="/operator/rooms" className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-neutral-100 group cursor-pointer">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-neutral-100 p-3 rounded-lg group-hover:bg-neutral-200 transition-colors duration-200">
                <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black">Habitaciones</h3>
                <p className="text-sm text-neutral-600">Administrar</p>
              </div>
            </div>
          </a>
          <a href="/operator/bookings" className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-neutral-100 group cursor-pointer">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-neutral-100 p-3 rounded-lg group-hover:bg-neutral-200 transition-colors duration-200">
                <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black">Reservas</h3>
                <p className="text-sm text-neutral-600">Gestionar</p>
              </div>
            </div>
          </a>
            <a href="/operator/services" className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-neutral-100 group cursor-pointer">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-neutral-100 p-3 rounded-lg group-hover:bg-neutral-200 transition-colors duration-200">
                <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black">Servicios</h3>
                <p className="text-sm text-neutral-600">Gestionar</p>
              </div>
            </div>
          </a>
          <a href="/operator/messages" className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-neutral-100 group cursor-pointer">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-neutral-100 p-3 rounded-lg group-hover:bg-neutral-200 transition-colors duration-200">
                <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black">Mensajes</h3>
                <p className="text-sm text-neutral-600">Responder</p>
              </div>
            </div>
          </a>
        </div>

        {/* Tablas de datos recientes */}
        <div className="space-y-8">
          {/* Reservas de Habitaciones Recientes */}
          <div>
            <h2 className="text-xl font-semibold text-black mb-4">Reservas de Habitaciones Recientes</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-neutral-100">
              <div className="p-6 border-b border-neutral-200">
                <p className="text-sm text-neutral-600">Últimas 5 reservas de habitaciones recientes</p>
              </div>
              
              {recentReservations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Habitación</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase">Huéspedes</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase">Total</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase">Fechas</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {recentReservations.map((reservation) => (
                        <tr key={reservation.id} className="hover:bg-neutral-50 transition">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-black">{reservation.user.name}</p>
                            <p className="text-xs text-neutral-500">{reservation.user.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-black">#{reservation.room.number}</p>
                            <p className="text-xs text-neutral-500">{getRoomTypeLabel(reservation.room.type)}</p>
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-medium">{reservation.guests}</td>
                          <td className="px-4 py-3 text-center text-sm font-medium text-black">
                            ${reservation.totalPrice.toLocaleString('es-AR')}
                          </td>
                          <td className="px-4 py-3 text-center text-xs">
                            <p className="text-neutral-900">
                              {new Date(reservation.checkIn).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </p>
                            <p className="text-neutral-500">
                              {new Date(reservation.checkOut).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs rounded border ${getStatusColor(reservation.status)}`}>
                              {getStatusLabel(reservation.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-neutral-500">No hay reservas recientes</p>
                </div>
              )}
            </div>
          </div>

          {/* Reservas de Servicios Recientes */}
          <div>
            <h2 className="text-xl font-semibold text-black mb-4">Reservas de Servicios Recientes</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-neutral-100">
              <div className="p-6 border-b border-neutral-200">
                <p className="text-sm text-neutral-600">Últimas 5 reservas de servicios</p>
              </div>
              
              {recentServiceBookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Servicio</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase">Fecha/Hora</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase">Participantes</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase">Total</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {recentServiceBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-neutral-50 transition">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-black">{booking.user.name}</p>
                            <p className="text-xs text-neutral-500">{booking.user.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-black">{booking.service.name}</p>
                            <p className="text-xs text-neutral-500">
                              {getServiceTypeLabel(booking.service.type)} • Hab. #{booking.reservation.room.number}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center text-xs">
                            <p className="text-neutral-900">
                              {new Date(booking.bookingDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </p>
                            <p className="text-neutral-500">{booking.bookingTime}</p>
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-medium">{booking.participants}</td>
                          <td className="px-4 py-3 text-center text-sm font-medium text-black">
                            ${booking.totalPrice.toLocaleString('es-AR')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs rounded border ${getStatusColor(booking.status)}`}>
                              {getStatusLabel(booking.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-neutral-500">No hay reservas de servicios recientes</p>
                </div>
              )}
            </div>
          </div>

          {/* Mensajes Recientes */}
          <div>
            <h2 className="text-xl font-semibold text-black mb-4">Mensajes Recientes</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-neutral-100">
              <div className="p-6 border-b border-neutral-200">
                <p className="text-sm text-neutral-600">Últimos 5 mensajes</p>
              </div>
              
              {recentMessages.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Asunto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">De</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {recentMessages.map((message) => (
                        <tr key={message.id} className="hover:bg-neutral-50 transition">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-black truncate max-w-[300px]">{message.subject}</p>
                            {message.bookingCode && (
                              <p className="text-xs text-neutral-500">Reserva: {message.bookingCode}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-neutral-900">{message.fromName}</p>
                            <p className="text-xs text-neutral-500 truncate max-w-[200px]">{message.fromEmail}</p>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-neutral-700">
                            {new Date(message.receivedAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs rounded border ${getMessageStatusColor(message.status)}`}>
                              {getMessageStatusLabel(message.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-neutral-500">No hay mensajes recientes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}