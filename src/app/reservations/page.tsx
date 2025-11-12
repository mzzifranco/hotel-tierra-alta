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
  calculateNights,
  getRoomTypeLabel,
  getReservationStatusLabel,
  getReservationStatusColor,
  generateBookingCode,
} from '@/lib/utils';

interface Reservation {
  id: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  guests: number;
  status: string;
  createdAt: string;
  room: {
    number: string;
    type: string;
    price: number;
    images: string[];
  };
  payment: {
    id: string;
    status: string;
  } | null;
}

export default function MyReservationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/reservations');
      return;
    }

    if (status === 'authenticated') {
      fetchReservations();
    }
  }, [status]);

  const fetchReservations = async () => {
    try {
      const response = await fetch('/api/reservations/my-reservations');
      const data = await response.json();

      if (response.ok) {
        setReservations(data.reservations);
      } else {
        setError(data.error || 'Error al cargar las reservas');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = reservations;

    // Filtrar por estado de la reserva
    switch (filter) {
      case 'pending':
        filtered = reservations.filter((r) => r.status === 'PENDING');
        break;
      case 'confirmed':
        filtered = reservations.filter(
          (r) => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN' || r.status === 'CHECKED_OUT'
        );
        break;
      case 'cancelled':
        filtered = reservations.filter((r) => r.status === 'CANCELLED');
        break;
      default:
        filtered = reservations;
    }

    // Filtrar por búsqueda (código de reserva)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((reservation) => {
        const bookingCode = generateBookingCode(reservation.id).toLowerCase();
        return bookingCode.includes(query);
      });
    }

    return filtered;
  };

  const filteredReservations = filterReservations();

  // Contar reservas por filtro
  const pendingCount = reservations.filter((r) => r.status === 'PENDING').length;
  const confirmedCount = reservations.filter(
    (r) => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN' || r.status === 'CHECKED_OUT'
  ).length;
  const cancelledCount = reservations.filter((r) => r.status === 'CANCELLED').length;

  if (loading || status === 'loading') {
    return (
      <main className="min-h-screen bg-[#f3eee7]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-neutral-600">Cargando reservas...</p>
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
          <h1 className="text-3xl font-semibold text-black mb-2">Mis Reservas</h1>
          <div className="h-px w-20 bg-black/20 mb-2" />
          <p className="text-neutral-600">Gestiona todas tus reservas en un solo lugar</p>
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

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                filter === 'all'
                  ? 'bg-[#404040] text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-[#404040] hover:text-white'
              }`}
            >
              Todas {filter === 'all' && `(${filteredReservations.length})`}
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                filter === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-yellow-100 hover:text-yellow-700'
              }`}
            >
              Pendientes {filter === 'pending' && `(${filteredReservations.length})`}
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                filter === 'confirmed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-green-100 hover:text-green-700'
              }`}
            >
              Confirmadas {filter === 'confirmed' && `(${filteredReservations.length})`}
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                filter === 'cancelled'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-red-100 hover:text-red-700'
              }`}
            >
              Canceladas {filter === 'cancelled' && `(${filteredReservations.length})`}
            </button>
          </div>
        </div>

        {/* Lista de reservas */}
        {filteredReservations.length > 0 ? (
          <div className="space-y-4">
            {filteredReservations.map((reservation) => {
              const nights = calculateNights(reservation.checkIn, reservation.checkOut);
              const bookingCode = generateBookingCode(reservation.id);
              const needsPayment =
                reservation.status === 'PENDING' &&
                reservation.payment?.status === 'PENDING';

              return (
                <div
                  key={reservation.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Imagen */}
                    <div className="w-full md:w-48 h-48 md:h-auto bg-neutral-200 flex-shrink-0">
                      {reservation.room.images.length > 0 ? (
                        <img
                          src={reservation.room.images[0]}
                          alt={`Habitación ${reservation.room.number}`}
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
                              {getRoomTypeLabel(reservation.room.type)}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded text-xs font-medium border ${getReservationStatusColor(
                                reservation.status
                              )}`}
                            >
                              {getReservationStatusLabel(reservation.status)}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-600">
                            Reserva #{bookingCode} · Habitación #{reservation.room.number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-black">
                            {formatPrice(reservation.totalPrice)}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {nights} {nights === 1 ? 'noche' : 'noches'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">Check-in</p>
                          <p className="text-sm font-medium text-black">
                            {formatShortDate(reservation.checkIn)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">Check-out</p>
                          <p className="text-sm font-medium text-black">
                            {formatShortDate(reservation.checkOut)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">Huéspedes</p>
                          <p className="text-sm font-medium text-black">
                            {reservation.guests}{' '}
                            {reservation.guests === 1 ? 'persona' : 'personas'}
                          </p>
                        </div>
                      </div>

                      {needsPayment && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            Pago pendiente - Completa el pago para confirmar tu reserva
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        {needsPayment && (
                          <Link
                            href={`/payments/${reservation.payment?.id}`}
                            className="flex-1 bg-green-100 border border-green-200 text-green-700 hover:bg-green-200 text-center font-medium py-2 px-4 rounded-[30px] transition text-sm"
                          >
                            Pagar reserva
                          </Link>
                        )}
                        <Link
                          href={`/reservations/${reservation.id}`}
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
                ? 'No se encontraron reservas con ese código'
                : filter === 'all'
                ? 'No tienes reservas'
                : `No tienes reservas ${
                    filter === 'pending'
                      ? 'pendientes'
                      : filter === 'confirmed'
                      ? 'confirmadas'
                      : 'canceladas'
                  }`}
            </p>
            <p className="text-neutral-500 text-sm mb-6">
              {searchQuery
                ? 'Intenta con otro código de reserva'
                : 'Explora nuestras habitaciones y haz tu primera reserva'}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-block bg-white hover:bg-[#404040] border border-[#404040] text-[#404040] hover:text-white font-medium py-2 px-6 rounded-[30px] transition"
              >
                Limpiar búsqueda
              </button>
            ) : (
              <Link
                href="/rooms/search"
                className="inline-block bg-white hover:bg-[#404040] border border-[#404040] text-[#404040] hover:text-white font-medium py-2 px-6 rounded-[30px] transition"
              >
                Buscar habitaciones
              </Link>
            )}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}