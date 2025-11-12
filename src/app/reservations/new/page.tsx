'use client';

import { useState, useEffect } from 'react';
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

export default function NewReservationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Parámetros de la URL
  const roomId = searchParams.get('roomId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = searchParams.get('guests');

  useEffect(() => {
    // Redirigir si no está autenticado
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/rooms/search');
      return;
    }

    // Validar parámetros
    if (!roomId || !checkIn || !checkOut || !guests) {
      setError('Faltan parámetros necesarios');
      setLoading(false);
      return;
    }

    // Cargar datos de la habitación
    fetchRoom();
  }, [status, roomId]);

  const fetchRoom = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setRoom(data.room);
      } else {
        setError('No se pudo cargar la información de la habitación');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          checkIn,
          checkOut,
          guests: parseInt(guests!),
          specialRequests: specialRequests || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirigir a la página de detalle de la reserva
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading || status === 'loading') {
    return (
      <main className="min-h-screen bg-[#f3eee7]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-neutral-600">Cargando...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error && !room) {
    return (
      <main className="min-h-screen bg-[#f3eee7]">
        <Header />
        <div className="mx-auto max-w-3xl px-6 pt-24 pb-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 mb-4">{error}</p>
            <Link
              href="/rooms/search"
              className="inline-block bg-black text-white px-6 py-2 rounded-lg hover:bg-neutral-800 transition"
            >
              Volver a buscar habitaciones
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!room) return null;

  const nights = calculateNights();
  const total = calculateTotal();

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />

      <section className="mx-auto max-w-5xl px-6 pt-24 pb-12">
        <div className="mb-8">
          <Link
            href="/rooms/search"
            className="text-sm text-neutral-600 hover:text-black mb-4 inline-flex items-center"
          >
            ← Volver a la búsqueda
          </Link>
          <h1 className="text-3xl font-semibold text-black mb-2">Confirmar Reserva</h1>
          <div className="h-px w-20 bg-black/20 mb-2" />
          <p className="text-neutral-600">Revisa los detalles antes de confirmar</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información del huésped */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Información del huésped
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={session?.user?.name || ''}
                      disabled
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={session?.user?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-600"
                    />
                  </div>
                </div>
              </div>

              {/* Detalles de la estadía */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Detalles de tu estadía
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Check-in
                      </label>
                      <div className="px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50">
                        <p className="text-sm text-neutral-900 font-medium">
                          {checkIn && formatDate(checkIn)}
                        </p>
                        <p className="text-xs text-neutral-500">A partir de las 15:00</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Check-out
                      </label>
                      <div className="px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50">
                        <p className="text-sm text-neutral-900 font-medium">
                          {checkOut && formatDate(checkOut)}
                        </p>
                        <p className="text-xs text-neutral-500">Hasta las 11:00</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Número de huéspedes
                    </label>
                    <input
                      type="text"
                      value={`${guests} ${parseInt(guests!) === 1 ? 'persona' : 'personas'}`}
                      disabled
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-600"
                    />
                  </div>
                </div>
              </div>

              {/* Solicitudes especiales */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Solicitudes especiales (opcional)
                </h2>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Ej: Cama extra, piso alto, vista al mar, cuna para bebé, etc."
                  rows={4}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none"
                />
                <p className="text-xs text-neutral-500 mt-2">
                  Haremos lo posible por cumplir tus solicitudes, aunque no podemos garantizarlas.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                className="flex-1 bg-green-100 border border-green-200 text-green-700 hover:bg-green-200 text-center font-medium py-3 px-6 rounded-[30px] transition"

                >
                  {submitting ? 'Procesando...' : 'Confirmar reserva'}
                </button>
                <Link
                  href="/rooms/search"
                  className="flex-1 bg-red-100 border border-red-300 text-red-700 hover:bg-red-200 text-center font-medium py-3 px-6 rounded-[30px] transition"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-black mb-4">Resumen</h2>

              {/* Imagen de la habitación */}
              <div className="h-40 bg-neutral-200 rounded-lg mb-4 overflow-hidden">
                {room.images.length > 0 ? (
                  <img
                    src={room.images[0]}
                    alt={`Habitación ${room.number}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    Sin imagen
                  </div>
                )}
              </div>

              {/* Detalles de la habitación */}
              <div className="mb-4">
                <h3 className="font-semibold text-black text-lg">
                  {getRoomTypeLabel(room.type)}
                </h3>
                <p className="text-sm text-neutral-600">
                  Habitación #{room.number} · Piso {room.floor}
                </p>
              </div>

              {/* Comodidades */}
              <div className="mb-6">
                <p className="text-xs font-medium text-neutral-700 mb-2">Comodidades:</p>
                <div className="flex flex-wrap gap-1">
                  {room.amenities.slice(0, 6).map((amenity, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-neutral-100 px-2 py-1 rounded"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Desglose de precio */}
              <div className="border-t border-neutral-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">
                    ${room.price.toLocaleString()} x {nights}{' '}
                    {nights === 1 ? 'noche' : 'noches'}
                  </span>
                  <span className="text-neutral-900">
                    ${(room.price * nights).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Tarifa de servicio</span>
                  <span className="text-neutral-900">$0</span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-neutral-300 mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-black">Total</span>
                  <span className="text-2xl font-bold text-black">
                    ${total.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  El pago se realizará después de confirmar la reserva
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