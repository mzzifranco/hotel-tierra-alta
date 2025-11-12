'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface Room {
  id: string;
  number: string;
  type: string;
  price: number;
  capacity: number;
  floor: number;
  amenities: string[];
  images: string[];
  description: string | null;
}

function NewReservationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const roomId = searchParams.get('roomId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = searchParams.get('guests');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/login?callbackUrl=/reservations/new?roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
    }
  }, [status, router, roomId, checkIn, checkOut, guests]);

  useEffect(() => {
    if (!roomId || !checkIn || !checkOut || !guests) {
      setError('Parámetros de búsqueda incompletos');
      setLoading(false);
      return;
    }

    fetchRoomDetails();
  }, [roomId]);

  const fetchRoomDetails = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`);
      const data = await response.json();

      if (response.ok) {
        setRoom(data.room);
      } else {
        setError(data.error || 'Error al cargar la habitación');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          checkIn,
          checkOut,
          guests: parseInt(guests!),
          specialRequests: specialRequests || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/reservations/${data.reservation.id}`);
      } else {
        setError(data.error || 'Error al crear la reserva');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoomTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SINGLE: 'Individual',
      DOUBLE: 'Doble',
      SUITE: 'Suite',
      DELUXE: 'Deluxe',
      PRESIDENTIAL: 'Presidencial',
    };
    return labels[type] || type;
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!room) return 0;
    return room.price * calculateNights();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <main className="min-h-screen bg-[#f3eee7]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
            <p className="text-neutral-600">Cargando...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!roomId || !checkIn || !checkOut || !guests) {
    return (
      <main className="min-h-screen bg-[#f3eee7]">
        <Header />
        <div className="mx-auto max-w-2xl px-6 pt-24 pb-12">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-red-600 mb-4">Parámetros de búsqueda incompletos</p>
            <Link href="/rooms/search" className="text-black hover:underline">
              Volver a buscar habitaciones
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const nights = calculateNights();
  const total = calculateTotal();

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />

      <section className="mx-auto max-w-4xl px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-black mb-2">Completar Reserva</h1>
          <div className="h-px w-20 bg-black/20 mb-2" />
          <p className="text-neutral-600">Revisa los detalles de tu reserva</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detalles de la reserva */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-black mb-4">Detalles de la Habitación</h2>

              {room && (
                <div className="flex gap-4">
                  <div className="w-32 h-32 bg-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
                    {room.images.length > 0 ? (
                      <img
                        src={room.images[0]}
                        alt={`Habitación ${room.number}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black mb-1">
                      {getRoomTypeLabel(room.type)} - Habitación {room.number}
                    </h3>
                    <p className="text-sm text-neutral-600 mb-2">
                      Piso {room.floor} · Capacidad: {room.capacity}{' '}
                      {room.capacity === 1 ? 'persona' : 'personas'}
                    </p>
                    {room.description && (
                      <p className="text-sm text-neutral-600 mb-3">{room.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {room.amenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-neutral-100 px-2 py-1 rounded"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-black mb-4">Fechas de Estadía</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Check-in</p>
                  <p className="font-medium text-black capitalize">{formatDate(checkIn)}</p>
                  <p className="text-sm text-neutral-500">A partir de las 14:00</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Check-out</p>
                  <p className="font-medium text-black capitalize">{formatDate(checkOut)}</p>
                  <p className="text-sm text-neutral-500">Hasta las 11:00</p>
                </div>
              </div>
              <div className="border-t border-neutral-200 pt-4">
                <p className="text-sm text-neutral-600">
                  {nights} {nights === 1 ? 'noche' : 'noches'} · {guests}{' '}
                  {parseInt(guests) === 1 ? 'huésped' : 'huéspedes'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Solicitudes Especiales
                </h2>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Ej: Cama matrimonial, piso alto, vista a la montaña..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none text-sm"
                  rows={4}
                />
                <p className="text-xs text-neutral-500 mt-2">
                  Las solicitudes especiales no están garantizadas pero haremos nuestro mejor
                  esfuerzo por cumplirlas.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || !room}
                className="w-full bg-black hover:bg-neutral-800 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Procesando...' : 'Confirmar Reserva'}
              </button>
            </form>
          </div>

          {/* Resumen de precio */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-black mb-4">Resumen de Precio</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">
                    ${room?.price.toLocaleString()} x {nights}{' '}
                    {nights === 1 ? 'noche' : 'noches'}
                  </span>
                  <span className="text-black font-medium">
                    ${total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-4 mb-4">
                <div className="flex justify-between">
                  <span className="font-semibold text-black">Total</span>
                  <span className="font-semibold text-black text-xl">
                    ${total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  Podrás pagar con MercadoPago después de confirmar tu reserva. Tu reserva
                  quedará pendiente hasta que completes el pago.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function NewReservationPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#f3eee7]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
            <p className="text-neutral-600">Cargando...</p>
          </div>
        </div>
        <Footer />
      </main>
    }>
      <NewReservationContent />
    </Suspense>
  );
}