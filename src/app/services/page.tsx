'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  formatShortDate,
  formatPrice,
  getServiceTypeLabel,
  getServiceCategoryLabel,
  getServiceBookingStatusLabel,
  getServiceBookingStatusColor,
  generateServiceBookingCode,
  formatServiceTime,
  formatDuration,
} from '@/lib/utils';

interface ServiceBooking {
  id: string;
  bookingDate: string;
  bookingTime: string;
  participants: number;
  totalPrice: number;
  status: string;
  specialRequests: string | null;
  createdAt: string;
  service: {
    id: string;
    name: string;
    description: string;
    type: string;
    category: string;
    price: number;
    duration: number;
    images: string[];
    mainImage: string | null;
  };
  reservation: {
    id: string;
    checkIn: string;
    checkOut: string;
    room: {
      number: string;
      type: string;
    };
  };
  payment: {
    id: string;
    status: string;
    amount: number;
    paymentMethod: string | null;
  } | null;
  timeSlot: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
  } | null;
}

export default function MyServicesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'SPA' | 'EXPERIENCE'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/services');
      return;
    }

    if (status === 'authenticated') {
      fetchBookings();
    }
  }, [status]);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/services/my-bookings');
      const data = await response.json();

      if (response.ok) {
        setBookings(data.bookings);
      } else {
        setError(data.error || 'Error al cargar las reservas de servicios');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Filtrar por tipo de servicio
    if (typeFilter !== 'all') {
      filtered = filtered.filter((b) => b.service.type === typeFilter);
    }

    // Filtrar por estado
    switch (statusFilter) {
      case 'pending':
        filtered = filtered.filter((b) => b.status === 'PENDING');
        break;
      case 'confirmed':
        filtered = filtered.filter(
          (b) => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS' || b.status === 'COMPLETED'
        );
        break;
      case 'cancelled':
        filtered = filtered.filter((b) => b.status === 'CANCELLED' || b.status === 'NO_SHOW');
        break;
    }

    // Filtrar por búsqueda (código de reserva)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((booking) => {
        const bookingCode = generateServiceBookingCode(booking.id).toLowerCase();
        return bookingCode.includes(query);
      });
    }

    return filtered;
  };

  const filteredBookings = filterBookings();

  // Contar por tipo
  const spaCount = bookings.filter((b) => b.service.type === 'SPA').length;
  const experienceCount = bookings.filter((b) => b.service.type === 'EXPERIENCE').length;

  // Contar por estado
  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;
  const confirmedCount = bookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS' || b.status === 'COMPLETED'
  ).length;
  const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED' || b.status === 'NO_SHOW').length;

  if (loading || status === 'loading') {
    return (
      <main className="min-h-screen bg-[#f3eee7]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-neutral-600">Cargando servicios...</p>
          </div>
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
          <h1 className="text-3xl font-semibold text-black mb-2">Mis Servicios y Experiencias</h1>
          <div className="h-px w-20 bg-black/20 mb-2" />
          <p className="text-neutral-600">Gestiona todas tus reservas de servicios en un solo lugar</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por código de reserva..."
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

          {/* Filtros por tipo */}
          <div className="mb-3">
            <p className="text-xs text-neutral-500 mb-2 font-medium">Tipo de servicio</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  typeFilter === 'all'
                    ? 'bg-[#404040] text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-[#404040] hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setTypeFilter('SPA')}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  typeFilter === 'SPA'
                    ? 'bg-[#404040] text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-[#404040] hover:text-white'
                }`}
              >
                Spa ({spaCount})
              </button>
              <button
                onClick={() => setTypeFilter('EXPERIENCE')}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  typeFilter === 'EXPERIENCE'
                    ? 'bg-[#404040] text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-[#404040] hover:text-white'
                }`}
              >
                Experiencias ({experienceCount})
              </button>
            </div>
          </div>

          {/* Filtros por estado */}
          <div>
            <p className="text-xs text-neutral-500 mb-2 font-medium">Estado</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  statusFilter === 'all'
                    ? 'bg-[#404040] text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-[#404040] hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-yellow-100 hover:text-yellow-700'
                }`}
              >
                Pendientes ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('confirmed')}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  statusFilter === 'confirmed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-green-100 hover:text-green-700'
                }`}
              >
                Confirmadas ({confirmedCount})
              </button>
              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  statusFilter === 'cancelled'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-red-100 hover:text-red-700'
                }`}
              >
                Canceladas ({cancelledCount})
              </button>
            </div>
          </div>
        </div>

        {/* Lista de reservas de servicios */}
        {filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const bookingCode = generateServiceBookingCode(booking.id);
              const needsPayment =
                booking.status === 'PENDING' &&
                booking.payment?.status === 'PENDING';
              
              const imageUrl = booking.service.mainImage || booking.service.images[0] || null;

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Imagen */}
                    <div className="w-full md:w-48 h-48 md:h-auto bg-neutral-200 flex-shrink-0">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={booking.service.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          Sin imagen
                        </div>
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-black">
                              {booking.service.name}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded text-xs font-medium border ${getServiceBookingStatusColor(
                                booking.status
                              )}`}
                            >
                              {getServiceBookingStatusLabel(booking.status)}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-600 mb-1">
                            Reserva #{bookingCode}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2 py-0.5 bg-neutral-100 text-neutral-700 text-xs rounded">
                              {getServiceTypeLabel(booking.service.type)}
                            </span>
                            <span className="inline-block px-2 py-0.5 bg-neutral-100 text-neutral-700 text-xs rounded">
                              {getServiceCategoryLabel(booking.service.category)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-black">
                            {formatPrice(booking.totalPrice)}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {booking.participants} {booking.participants === 1 ? 'persona' : 'personas'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">Fecha</p>
                          <p className="text-sm font-medium text-black">
                            {formatShortDate(booking.bookingDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">Horario</p>
                          <p className="text-sm font-medium text-black">
                            {formatServiceTime(booking.bookingTime, booking.service.duration)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">Duración</p>
                          <p className="text-sm font-medium text-black">
                            {formatDuration(booking.service.duration)}
                          </p>
                        </div>
                      </div>

                      {/* Información de la reserva de habitación */}
                      <div className="mb-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                        <p className="text-xs text-neutral-500 mb-1">Asociado a reserva de habitación</p>
                        <p className="text-sm text-neutral-700">
                          Habitación #{booking.reservation.room.number} · {formatShortDate(booking.reservation.checkIn)} - {formatShortDate(booking.reservation.checkOut)}
                        </p>
                      </div>

                      {needsPayment && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            Pago pendiente - Completa el pago para confirmar tu reserva de servicio
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        {needsPayment && booking.payment && (
                          <Link
                            href={`/payments/services/${booking.payment.id}`}
                            className="flex-1 bg-green-100 border border-green-200 text-green-700 hover:bg-green-200 text-center font-medium py-2 px-4 rounded-[30px] transition text-sm"
                          >
                            Pagar servicio
                          </Link>
                        )}
                        <Link
                          href={`/services/${booking.id}`}
                          className="flex-1 bg-white border border-neutral-300 text-gray hover:bg-neutral-50 text-center font-medium py-2 px-4 rounded-[30px] transition text-sm"
                        >
                          Ver detalles
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <svg
              className="mx-auto h-12 w-12 text-neutral-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-neutral-600 text-lg mb-2">
              {searchQuery
                ? 'No se encontraron servicios con ese código'
                : typeFilter === 'all' && statusFilter === 'all'
                ? 'No tienes reservas de servicios'
                : 'No hay servicios con estos filtros'}
            </p>
            <p className="text-neutral-500 text-sm mb-6">
              {searchQuery
                ? 'Intenta con otro código de reserva'
                : 'Explora nuestros servicios y experiencias disponibles'}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-block bg-white hover:bg-[#404040] border border-[#404040] text-[#404040] hover:text-white font-medium py-2 px-6 rounded-[30px] transition"
              >
                Limpiar búsqueda
              </button>
            ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                href="/wellbeing#spa"
                className="inline-block bg-white hover:bg-[#404040] border border-[#404040] text-[#404040] hover:text-white font-medium py-2 px-6 rounded-[30px] transition"
                >
                Explorar Spa
                </Link>
                <Link
                href="/#experiences"
                className="inline-block bg-white hover:bg-[#404040] border border-[#404040] text-[#404040] hover:text-white font-medium py-2 px-6 rounded-[30px] transition"
                >
                Explorar Experiencias
                </Link>
            </div>
            )}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}