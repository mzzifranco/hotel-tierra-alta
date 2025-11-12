'use client';

import { useState, useEffect, Fragment } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Reservation {
  id: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  guests: number;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  specialRequests: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  room: {
    id: string;
    number: string;
    type: string;
    price: number;
    floor: number;
  };
  payment: {
    id: string;
    amount: number;
    status: string;
    paymentMethod: string | null;
    transactionId: string | null;
    createdAt: string;
  } | null;
}

export default function AdminReservationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role !== 'ADMIN') {
        router.push('/');
      } else {
        fetchReservations();
      }
    }
  }, [status, router, session]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/reservations');
      const data = await response.json();
      
      if (data.success) {
        setReservations(data.reservations);
      } else {
        console.error('Error en la respuesta:', data.error);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reservationId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        setReservations(prev =>
          prev.map(res =>
            res.id === reservationId ? { ...res, status: newStatus as any } : res
          )
        );
        setSelectedReservation(null);
      } else {
        alert(data.error || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error updating reservation:', error);
      alert('Error al actualizar reserva');
    } finally {
      setUpdating(false);
    }
  };

  const filteredReservations = reservations.filter((res) => {
    const passesState = filter === 'all' || res.status === filter;
    if (!passesState) return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        res.user.name?.toLowerCase().includes(query) ||
        res.user.email.toLowerCase().includes(query) ||
        res.room.number.toLowerCase().includes(query) ||
        res.id.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === 'PENDING').length,
    confirmed: reservations.filter((r) => r.status === 'CONFIRMED').length,
    checkedIn: reservations.filter((r) => r.status === 'CHECKED_IN').length,
    checkedOut: reservations.filter((r) => r.status === 'CHECKED_OUT').length,
    cancelled: reservations.filter((r) => r.status === 'CANCELLED').length,
  };

  // Función para aclarar el color hacia pastel
  const tintHex = (hex: string, t = 0.9) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    const [r, g, b] = [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)];
    const mix = (c: number) => Math.round(c + (255 - c) * t);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  };

  const chartData = [
    { name: 'Pendientes', value: stats.pending, color: '#eab308' },
    { name: 'Confirmadas', value: stats.confirmed, color: '#3b82f6' },
    { name: 'Check-in', value: stats.checkedIn, color: '#22c55e' },
    { name: 'Check-out', value: stats.checkedOut, color: '#f97316' },
    { name: 'Canceladas', value: stats.cancelled, color: '#ef4444' }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      CONFIRMED: 'bg-blue-50 border-blue-200 text-blue-800',
      CHECKED_IN: 'bg-green-50 border-green-200 text-green-800',
      CHECKED_OUT: 'bg-orange-50 border-orange-200 text-orange-800',
      CANCELLED: 'bg-red-50 border-red-200 text-red-800',
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
    };
    return labels[status] || status;
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

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />

      <section className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-black mb-2">Gestión de Reservas</h1>
          <div className="h-px w-20 bg-black/20 mb-2" />
          <p className="text-neutral-600">Administra todas las reservas del hotel</p>
        </div>

        {/* Contenedor de dos columnas - Estadísticas y Gráfico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Columna izquierda - Tarjetas de estadísticas */}
          <div className="flex flex-col h-full">
            <h2 className="text-xl font-semibold text-black mb-4">Resumen de Reservas</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-sm text-neutral-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-black">{stats.total}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <p className="text-sm text-yellow-700 mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-sm text-blue-700 mb-1">Confirmadas</p>
                <p className="text-3xl font-bold text-blue-700">{stats.confirmed}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <p className="text-sm text-green-700 mb-1">Check-in</p>
                <p className="text-3xl font-bold text-green-700">{stats.checkedIn}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <p className="text-sm text-orange-700 mb-1">Check-out</p>
                <p className="text-3xl font-bold text-orange-700">{stats.checkedOut}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-sm text-red-700 mb-1">Canceladas</p>
                <p className="text-3xl font-bold text-red-700">{stats.cancelled}</p>
              </div>
            </div>
          </div>

          {/* Columna derecha - Gráfico de torta */}
          <div>
            <h2 className="text-xl font-semibold text-black mb-4">Distribución por estado</h2>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              {stats.total > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={0}
                    >
                      {chartData.map((entry, index) => (
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
                  No hay datos para mostrar
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, email, habitación..."
                className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 text-sm"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'all'
                  ? 'bg-[#404040] text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-[#404040] hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-yellow-100 hover:text-yellow-700'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFilter('CONFIRMED')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'CONFIRMED'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-blue-100 hover:text-blue-700'
              }`}
            >
              Confirmadas
            </button>
            <button
              onClick={() => setFilter('CHECKED_IN')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'CHECKED_IN'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-green-100 hover:text-green-700'
              }`}
            >
              Check-in
            </button>
            <button
              onClick={() => setFilter('CHECKED_OUT')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'CHECKED_OUT'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-orange-100 hover:text-orange-700'
              }`}
            >
              Check-out
            </button>
            <button
              onClick={() => setFilter('CANCELLED')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'CANCELLED'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-red-100 hover:text-red-700'
              }`}
            >
              Canceladas
            </button>
          </div>
        </div>

        {/* Tabla de Reservas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            {filteredReservations.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600 uppercase">Cliente</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600 uppercase">Habitación</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Huéspedes</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Total</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Fechas</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Estado</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredReservations.map((reservation) => (
                    <Fragment key={reservation.id}>
                      <tr className="hover:bg-neutral-50 transition">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-black">{reservation.user.name}</p>
                          <p className="text-xs text-neutral-500">{reservation.user.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-black">#{reservation.room.number}</p>
                          <p className="text-xs text-neutral-500">{getRoomTypeLabel(reservation.room.type)}</p>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-medium">{reservation.guests}</td>
                        <td className="px-4 py-3 text-center">
                          <p className="text-sm font-medium text-black">
                            ${reservation.totalPrice.toLocaleString('es-AR')}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center text-xs">
                          <p className="text-neutral-900">
                            {new Date(reservation.checkIn).toLocaleDateString('es-AR')}
                          </p>
                          <p className="text-neutral-500">
                            {new Date(reservation.checkOut).toLocaleDateString('es-AR')}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs rounded border ${getStatusColor(reservation.status)}`}>
                            {getStatusLabel(reservation.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedReservation(selectedReservation?.id === reservation.id ? null : reservation)}
                            className="px-2 py-1 text-xs font-medium rounded transition bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                          >
                            {selectedReservation?.id === reservation.id ? 'Cerrar' : 'Ver'}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Detalles expandibles */}
                      {selectedReservation?.id === reservation.id && (
                        <tr>
                          <td colSpan={7} className="px-4 py-4 bg-neutral-50">
                            <div className="space-y-4">
                              {/* Información del cliente */}
                              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                <p className="text-xs font-medium text-neutral-600 mb-3">Información del Cliente</p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-xs text-neutral-500">Nombre</p>
                                    <p className="text-neutral-900">{reservation.user.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-neutral-500">Email</p>
                                    <p className="text-neutral-900">{reservation.user.email}</p>
                                  </div>
                                  {reservation.user.phone && (
                                    <div>
                                      <p className="text-xs text-neutral-500">Teléfono</p>
                                      <p className="text-neutral-900">{reservation.user.phone}</p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-xs text-neutral-500">Reserva creada</p>
                                    <p className="text-neutral-900">
                                      {new Date(reservation.createdAt).toLocaleString('es-AR')}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Información de la reserva */}
                              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                <p className="text-xs font-medium text-neutral-600 mb-3">Código de Reserva</p>
                                <div className="text-sm">
                                  <div>
                                    <p className="text-xs text-neutral-500">ID de Reserva</p>
                                    <p className="text-neutral-900 font-mono">#{reservation.id}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                <p className="text-xs font-medium text-neutral-600 mb-3">Detalles de la Reserva</p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-xs text-neutral-500">Check-in</p>
                                    <p className="text-neutral-900">
                                      {new Date(reservation.checkIn).toLocaleDateString('es-AR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-neutral-500">Check-out</p>
                                    <p className="text-neutral-900">
                                      {new Date(reservation.checkOut).toLocaleDateString('es-AR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-neutral-500">Noches</p>
                                    <p className="text-neutral-900">
                                      {Math.ceil(
                                        (new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) /
                                        (1000 * 60 * 60 * 24)
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-neutral-500">Huéspedes</p>
                                    <p className="text-neutral-900">{reservation.guests}</p>
                                  </div>
                                </div>
                                {reservation.specialRequests && (
                                  <div className="mt-3 pt-3 border-t border-neutral-200">
                                    <p className="text-xs text-neutral-500 mb-1">Solicitudes especiales</p>
                                    <p className="text-sm text-neutral-700">{reservation.specialRequests}</p>
                                  </div>
                                )}
                              </div>

                              {/* Información del pago */}
                              {reservation.payment && (
                                <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                  <p className="text-xs font-medium text-neutral-600 mb-3">Información de Pago</p>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <p className="text-xs text-neutral-500">Monto</p>
                                      <p className="text-neutral-900 font-medium">
                                        ${reservation.payment.amount.toLocaleString('es-AR')}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-neutral-500">Estado del pago</p>
                                      <p className="text-neutral-900">{reservation.payment.status}</p>
                                    </div>
                                    {reservation.payment.paymentMethod && (
                                      <div>
                                        <p className="text-xs text-neutral-500">Método</p>
                                        <p className="text-neutral-900">{reservation.payment.paymentMethod}</p>
                                      </div>
                                    )}
                                    {reservation.payment.transactionId && (
                                      <div>
                                        <p className="text-xs text-neutral-500">ID de transacción</p>
                                        <p className="text-neutral-900 text-xs break-all">
                                          {reservation.payment.transactionId}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Cambiar estado */}
                              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                <p className="text-xs font-medium text-neutral-600 mb-3">Cambiar Estado</p>
                                <div className="flex flex-wrap gap-2">
                                  {reservation.status !== 'PENDING' && (
                                    <button
                                      onClick={() => handleStatusChange(reservation.id, 'PENDING')}
                                      disabled={updating}
                                      className="px-3 py-2 text-xs font-medium rounded transition bg-yellow-100 text-yellow-700 hover:bg-yellow-200 disabled:opacity-50"
                                    >
                                      Marcar Pendiente
                                    </button>
                                  )}
                                  {reservation.status !== 'CONFIRMED' && (
                                    <button
                                      onClick={() => handleStatusChange(reservation.id, 'CONFIRMED')}
                                      disabled={updating}
                                      className="px-3 py-2 text-xs font-medium rounded transition bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                                    >
                                      Confirmar
                                    </button>
                                  )}
                                  {reservation.status !== 'CHECKED_IN' && reservation.status !== 'CHECKED_OUT' && reservation.status !== 'CANCELLED' && (
                                    <button
                                      onClick={() => handleStatusChange(reservation.id, 'CHECKED_IN')}
                                      disabled={updating}
                                      className="px-3 py-2 text-xs font-medium rounded transition bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                                    >
                                      Check-in
                                    </button>
                                  )}
                                  {reservation.status === 'CHECKED_IN' && (
                                    <button
                                      onClick={() => handleStatusChange(reservation.id, 'CHECKED_OUT')}
                                      disabled={updating}
                                      className="px-3 py-2 text-xs font-medium rounded transition bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50"
                                    >
                                      Check-out
                                    </button>
                                  )}
                                  {reservation.status !== 'CANCELLED' && reservation.status !== 'CHECKED_OUT' && (
                                    <button
                                      onClick={() => handleStatusChange(reservation.id, 'CANCELLED')}
                                      disabled={updating}
                                      className="px-3 py-2 text-xs font-medium rounded transition bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                                    >
                                      Cancelar
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-16">
                <svg className="mx-auto h-12 w-12 text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-neutral-600 text-lg">No hay reservas que coincidan con el filtro</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-sm text-black hover:underline"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}