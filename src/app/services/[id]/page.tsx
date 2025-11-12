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
  getServiceTypeLabel,
  getServiceCategoryLabel,
  getServiceBookingStatusLabel,
  getServiceBookingStatusColor,
  generateServiceBookingCode,
  formatServiceTime,
  formatDuration,
  getRoomTypeLabel,
} from '@/lib/utils';

interface ServiceBooking {
  id: string;
  bookingDate: string;
  bookingTime: string;
  participants: number;
  totalPrice: number;
  status: string;
  specialRequests: string | null;
  staffNotes: string | null;
  createdAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  service: {
    id: string;
    name: string;
    description: string;
    shortDescription: string | null;
    type: string;
    category: string;
    price: number;
    pricePerPerson: boolean;
    duration: number;
    minCapacity: number;
    maxCapacity: number;
    images: string[];
    mainImage: string | null;
  };
  reservation: {
    id: string;
    checkIn: string;
    checkOut: string;
    room: {
      id: string;
      number: string;
      type: string;
      floor: number;
      capacity: number;
    };
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
    paidAt: string | null;
  } | null;
  timeSlot: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
  } | null;
}

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [bookingId, setBookingId] = useState<string>('');
  const [booking, setBooking] = useState<ServiceBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Resolver params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setBookingId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && bookingId) {
      fetchBooking();
    }
  }, [status, bookingId]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/services/${bookingId}`);
      const data = await response.json();

      if (response.ok) {
        setBooking(data.booking);
      } else {
        setError(data.error || 'Error al cargar la reserva de servicio');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    setCancelling(true);
    setError('');

    try {
      const response = await fetch(`/api/services/${bookingId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setBooking((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
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

  const canCancel = booking?.status === 'PENDING' || booking?.status === 'CONFIRMED';
  const canPay = booking?.status === 'PENDING' && booking?.payment?.status === 'PENDING';

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

  if (error && !booking) {
    return (
      <main className="min-h-screen bg-[#f3eee7]">
        <Header />
        <div className="mx-auto max-w-3xl px-6 pt-24 pb-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 mb-4">{error}</p>
            <Link
              href="/services"
              className="inline-block bg-black text-white px-6 py-2 rounded-lg hover:bg-neutral-800 transition"
            >
              Ver mis servicios
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!booking) return null;

  const bookingCode = generateServiceBookingCode(booking.id);
  const imageUrl = booking.service.mainImage || booking.service.images[0] || null;

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />

      <section className="mx-auto max-w-6xl px-6 pt-24 pb-12">
        <div className="mb-8">
          <Link
            href="/services"
            className="text-sm text-neutral-600 hover:text-black mb-4 inline-flex items-center"
          >
            ← Volver a mis servicios
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-black mb-2">
                Reserva #{bookingCode}
              </h1>
              <div className="h-px w-20 bg-black/20 mb-2" />
              <p className="text-neutral-600">
                Creada el {formatShortDate(booking.createdAt)}
              </p>
            </div>
            <div>
              <span
                className={`inline-block px-4 py-2 rounded-lg text-sm font-medium border ${getServiceBookingStatusColor(
                  booking.status
                )}`}
              >
                {getServiceBookingStatusLabel(booking.status)}
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
                  Tu reserva de servicio está registrada, pero debes completar el pago para confirmarla.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Detalles del servicio */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-black mb-4">
                Detalles del servicio
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Fecha</p>
                  <p className="font-medium text-black">
                    {formatDate(booking.bookingDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Horario</p>
                  <p className="font-medium text-black">
                    {formatServiceTime(booking.bookingTime, booking.service.duration)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Duración</p>
                  <p className="font-medium text-black">
                    {formatDuration(booking.service.duration)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Participantes</p>
                  <p className="font-medium text-black">
                    {booking.participants}{' '}
                    {booking.participants === 1 ? 'persona' : 'personas'}
                  </p>
                </div>
              </div>
            </div>

            {/* Información del servicio */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-black mb-4">
                {booking.service.name}
              </h2>
              <div className="flex gap-4 mb-4">
                {imageUrl && (
                  <div className="w-48 h-48 bg-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={imageUrl}
                      alt={booking.service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex gap-2 mb-3">
                    <span className="inline-block px-3 py-1 bg-neutral-100 text-neutral-700 text-xs rounded font-medium">
                      {getServiceTypeLabel(booking.service.type)}
                    </span>
                    <span className="inline-block px-3 py-1 bg-neutral-100 text-neutral-700 text-xs rounded font-medium">
                      {getServiceCategoryLabel(booking.service.category)}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 mb-3">
                    {booking.service.description}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-neutral-600">Capacidad</p>
                      <p className="text-black font-medium">
                        {booking.service.minCapacity} - {booking.service.maxCapacity} personas
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-600">Precio por persona</p>
                      <p className="text-black font-medium">
                        {booking.service.pricePerPerson ? 'Sí' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Galería de imágenes adicionales */}
              {booking.service.images.length > 1 && (
                <div className="mt-4">
                  <p className="text-sm text-neutral-600 mb-2">Más imágenes</p>
                  <div className="grid grid-cols-4 gap-2">
                    {booking.service.images.slice(1, 5).map((img, idx) => (
                      <div
                        key={idx}
                        className="aspect-square bg-neutral-200 rounded overflow-hidden"
                      >
                        <img
                          src={img}
                          alt={`${booking.service.name} ${idx + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Información de la habitación asociada */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-black mb-4">
                Reserva de habitación asociada
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Habitación</span>
                  <span className="text-sm font-medium text-black">
                    #{booking.reservation.room.number} - {getRoomTypeLabel(booking.reservation.room.type)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Piso</span>
                  <span className="text-sm font-medium text-black">
                    {booking.reservation.room.floor}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Estadía</span>
                  <span className="text-sm font-medium text-black">
                    {formatShortDate(booking.reservation.checkIn)} - {formatShortDate(booking.reservation.checkOut)}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-neutral-200">
                  <Link
                    href={`/reservations/${booking.reservation.id}`}
                    className="text-sm text-black hover:underline"
                  >
                    Ver detalles de la reserva de habitación →
                  </Link>
                </div>
              </div>
            </div>

            {booking.specialRequests && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Solicitudes especiales
                </h2>
                <p className="text-neutral-700">{booking.specialRequests}</p>
              </div>
            )}

            {/* Información del usuario */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-black mb-4">
                Información del titular
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-neutral-600">Nombre</p>
                  <p className="font-medium text-black">{booking.user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Email</p>
                  <p className="font-medium text-black">{booking.user.email}</p>
                </div>
                {booking.user.phone && (
                  <div>
                    <p className="text-sm text-neutral-600">Teléfono</p>
                    <p className="font-medium text-black">{booking.user.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-black mb-4">Resumen de pago</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">
                      Precio base {booking.service.pricePerPerson && `x ${booking.participants}`}
                    </span>
                    <span className="text-neutral-900">
                      {formatPrice(
                        booking.service.pricePerPerson
                          ? booking.service.price * booking.participants
                          : booking.service.price
                      )}
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
                      {formatPrice(booking.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {booking.payment && (
                <div className="border-t border-neutral-200 pt-4">
                  <h3 className="font-semibold text-black mb-3">Estado del pago</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Estado</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          booking.payment.status === 'APPROVED'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : booking.payment.status === 'PENDING'
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {booking.payment.status === 'APPROVED' ? 'Aprobado' : 
                         booking.payment.status === 'PENDING' ? 'Pendiente' : 
                         booking.payment.status === 'REJECTED' ? 'Rechazado' : 
                         'Reembolsado'}
                      </span>
                    </div>
                    {booking.payment.paymentMethod && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">Método</span>
                        <span className="text-sm text-neutral-900">
                          {booking.payment.paymentMethod}
                        </span>
                      </div>
                    )}
                    {booking.payment.transactionId && (
                      <div>
                        <span className="text-xs text-neutral-500">ID de transacción</span>
                        <p className="text-xs text-neutral-700 font-mono break-all">
                          {booking.payment.transactionId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t border-neutral-200 pt-4 space-y-3">
                {canPay && booking.payment && (
                  <button
                    onClick={() => router.push(`/payments/services/${booking.payment?.id}`)}
                    className="w-full bg-green-100 border border-green-200 text-green-700 hover:bg-green-200 font-medium py-3 px-4 rounded-[30px] transition"
                  >
                    Pagar servicio
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full bg-red-100 border border-red-200 text-red-700 hover:bg-red-200 font-medium py-3 px-4 rounded-[30px] transition"
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
                  Contacta con nosotros para cualquier consulta sobre tu reserva de servicio.
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

      {/* Modal de cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-black mb-4">
              ¿Cancelar reserva de servicio?
            </h3>
            <p className="text-neutral-700 mb-6">
              ¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer.
            </p>
            {booking.payment?.status === 'PAID' && (
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
                onClick={handleCancelBooking}
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