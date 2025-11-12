'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  formatDate,
  formatShortDate,
  formatPrice,
  calculateNights,
  getRoomTypeLabel,
  getReservationStatusLabel,
  getReservationStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  generateBookingCode,
} from '@/lib/utils';

interface Reservation {
  id: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  guests: number;
  status: string;
  specialRequests: string | null;
  createdAt: string;
  room: {
    id: string;
    number: string;
    type: string;
    price: number;
    capacity: number;
    floor: number;
    amenities: string[];
    images: string[];
    description: string | null;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  payment: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string | null;
    transactionId: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export default function ReservationDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [reservationId, setReservationId] = useState<string>('');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Resolver params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setReservationId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && reservationId) {
      fetchReservation();
    }
  }, [status, reservationId]);

  const fetchReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`);
      const data = await response.json();

      if (response.ok) {
        setReservation(data.reservation);
      } else {
        setError(data.error || 'Error al cargar la reserva');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    setCancelling(true);
    setError('');

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setReservation((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
        setShowCancelModal(false);
      } else {
        setError(data.error || 'Error al cancelar la reserva');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = reservation?.status === 'PENDING' || reservation?.status === 'CONFIRMED';
  const canPay = reservation?.status === 'PENDING' && reservation?.payment?.status === 'PENDING';

  if (loading || status === 'loading') {
    return (
      <main className="min-h-screen bg-[#f3eee7]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-neutral-600">Cargando reserva...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error && !reservation) {
    return (
      <main className="min-h-screen bg-[#f3eee7]">
        <Header />
        <div className="mx-auto max-w-3xl px-6 pt-24 pb-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 mb-4">{error}</p>
            <Link
              href="/reservations"
              className="inline-block bg-black text-white px-6 py-2 rounded-lg hover:bg-neutral-800 transition"
            >
              Ver mis reservas
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!reservation) return null;

  const nights = calculateNights(reservation.checkIn, reservation.checkOut);
  const bookingCode = generateBookingCode(reservation.id);

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />

      <section className="mx-auto max-w-6xl px-6 pt-24 pb-12">
        <div className="mb-8">
          <Link
            href="/reservations"
            className="text-sm text-neutral-600 hover:text-black mb-4 inline-flex items-center"
          >
            ← Volver a mis reservas
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-black mb-2">
                Reserva #{bookingCode}
              </h1>
              <div className="h-px w-20 bg-black/20 mb-2" />
              <p className="text-neutral-600">
                Creada el {formatShortDate(reservation.createdAt)}
              </p>
            </div>
            <div>
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-medium border rounded-lg ${getReservationStatusColor(
                  reservation.status
                )}`}
              >
                {getReservationStatusLabel(reservation.status)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {canPay && (
          <div className="mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">
                  Pago pendiente
                </h3>
                <p className="text-sm text-yellow-800">
                  Tu reserva está confirmada, pero debes completar el pago para garantizar tu estadía.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-black mb-4">
                Detalles de tu estadía
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Check-in</p>
                  <p className="font-medium text-black">
                    {formatDate(reservation.checkIn)}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">A partir de las 15:00</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Check-out</p>
                  <p className="font-medium text-black">
                    {formatDate(reservation.checkOut)}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Hasta las 11:00</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Duración</p>
                  <p className="font-medium text-black">
                    {nights} {nights === 1 ? 'noche' : 'noches'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Huéspedes</p>
                  <p className="font-medium text-black">
                    {reservation.guests} {reservation.guests === 1 ? 'persona' : 'personas'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-black mb-4">Tu habitación</h2>
              <div className="flex gap-4">
                <div className="w-32 h-32 bg-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
                  {reservation.room.images.length > 0 ? (
                    <img
                      src={reservation.room.images[0]}
                      alt={`Habitación ${reservation.room.number}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black text-lg mb-1">
                    {getRoomTypeLabel(reservation.room.type)}
                  </h3>
                  <p className="text-sm text-neutral-600 mb-3">
                    Habitación #{reservation.room.number} · Piso {reservation.room.floor} · 
                    Capacidad: {reservation.room.capacity}{' '}
                    {reservation.room.capacity === 1 ? 'persona' : 'personas'}
                  </p>
                  {reservation.room.description && (
                    <p className="text-sm text-neutral-700 mb-3">
                      {reservation.room.description}
                    </p>
                  )}
                  <div>
                    <p className="text-xs font-medium text-neutral-700 mb-2">Comodidades:</p>
                    <div className="flex flex-wrap gap-1">
                      {reservation.room.amenities.map((amenity, idx) => (
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
              </div>
            </div>

            {reservation.specialRequests && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Solicitudes especiales
                </h2>
                <p className="text-neutral-700">{reservation.specialRequests}</p>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-black mb-4">
                Información del huésped
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-neutral-600">Nombre</p>
                  <p className="font-medium text-black">{reservation.user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Email</p>
                  <p className="font-medium text-black">{reservation.user.email}</p>
                </div>
                {reservation.user.phone && (
                  <div>
                    <p className="text-sm text-neutral-600">Teléfono</p>
                    <p className="font-medium text-black">{reservation.user.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-black mb-4">Resumen de pago</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">
                      {formatPrice(reservation.room.price)} x {nights}{' '}
                      {nights === 1 ? 'noche' : 'noches'}
                    </span>
                    <span className="text-neutral-900">
                      {formatPrice(reservation.room.price * nights)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Tarifa de servicio</span>
                    <span className="text-neutral-900">{formatPrice(0)}</span>
                  </div>
                </div>
                <div className="border-t border-neutral-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-black">Total</span>
                    <span className="text-2xl font-bold text-black">
                      {formatPrice(reservation.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {reservation.payment && (
                <div className="border-t border-neutral-200 pt-4">
                  <h3 className="font-semibold text-black mb-3">Estado del pago</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Estado</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${getPaymentStatusColor(
                          reservation.payment.status
                        )}`}
                      >
                        {getPaymentStatusLabel(reservation.payment.status)}
                      </span>
                    </div>
                    {reservation.payment.paymentMethod && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">Método</span>
                        <span className="text-sm text-neutral-900">
                          {reservation.payment.paymentMethod}
                        </span>
                      </div>
                    )}
                    {reservation.payment.transactionId && (
                      <div>
                        <span className="text-xs text-neutral-500">ID de transacción</span>
                        <p className="text-xs text-neutral-700 font-mono break-all">
                          {reservation.payment.transactionId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t border-neutral-200 pt-4 space-y-3">
                {canPay && (
                  <button
                    onClick={() => router.push(`/payments/${reservation.payment?.id}`)}
                    className="w-full bg-green-100 border border-green-200 text-green-700 hover:bg-green-200 font-medium py-3 px-4 rounded-[30px] transition"
                  >
                    Pagar reserva
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full bg-red-100 border border-red-300 text-red-700 hover:bg-red-200 font-medium py-3 px-4 rounded-[30px] transition"
                  >
                    Cancelar reserva
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="w-full bg-white border border-neutral-300 text-gray hover:bg-neutral-50 font-medium py-3 px-4 rounded-[30px] transition"
                >
                  Imprimir reserva
                </button>
              </div>

              <div className="border-t border-neutral-200 pt-4">
                <h3 className="font-semibold text-black mb-3">¿Necesitas ayuda?</h3>
                <p className="text-sm text-neutral-600 mb-2">
                  Contacta con nosotros para cualquier consulta sobre tu reserva.
                </p>
                <div className="space-y-2">
                  <a
                    href={`mailto:${process.env.NEXT_PUBLIC_HOTEL_EMAIL}`}
                    className="text-sm text-black hover:underline block"
                  >
                    {process.env.NEXT_PUBLIC_HOTEL_EMAIL}
                  </a>
                  <a
                    href={`tel:${process.env.NEXT_PUBLIC_HOTEL_PHONE}`}
                    className="text-sm text-black hover:underline block"
                  >
                    {process.env.NEXT_PUBLIC_HOTEL_PHONE}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-black mb-4">
              ¿Cancelar reserva?
            </h3>
            <p className="text-neutral-700 mb-6">
              ¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer.
            </p>
            {reservation.payment?.status === 'APPROVED' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  Esta reserva tiene un pago aprobado. Para cancelarla debes contactar con el hotel.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 bg-white border border-neutral-300 text-gray hover:bg-neutral-50 py-2 px-4 rounded-[30px] transition disabled:opacity-50"
              >
                No, mantener
              </button>
              <button
                onClick={handleCancelReservation}
                disabled={cancelling}
                className="flex-1 bg-red-100 border border-red-300 text-red-700 hover:bg-red-200 font-medium py-2 px-4 rounded-[30px] transition disabled:opacity-50"
              >
                {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}