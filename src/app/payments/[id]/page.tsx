'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  formatDate,
  formatPrice,
  calculateNights,
  getRoomTypeLabel,
  generateBookingCode,
} from '@/lib/utils';

interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reservation: {
    id: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    guests: number;
    room: {
      number: string;
      type: string;
      price: number;
      images: string[];
    };
  };
}

export default function PaymentPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [paymentId, setPaymentId] = useState<string>('');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Resolver params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setPaymentId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && paymentId) {
      fetchPaymentData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, paymentId]); // ✅ Quitado router de dependencias

  const fetchPaymentData = async () => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`);
      const data = await response.json();

      if (response.ok) {
        setPaymentData(data.payment);
      } else {
        setError(data.error || 'Error al cargar los datos del pago');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: paymentData?.reservation.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const paymentUrl = data.sandboxInitPoint || data.initPoint;
        window.location.href = paymentUrl;
      } else {
        setError(data.error || 'Error al procesar el pago');
        setProcessing(false);
      }
    } catch {
      setError('Error de conexión');
      setProcessing(false);
    }
  };

  // ✅ Función para aprobar pago de prueba (sin popups)
  const handleTestPayment = async () => {
    setProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/test-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: paymentId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/reservations/${paymentData?.reservation.id}`);
      } else {
        setError(data.error || 'Error al aprobar pago de prueba');
        setProcessing(false);
      }
    } catch {
      setError('Error de conexión');
      setProcessing(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <main className="min-h-screen bg-[#f3eee7]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-neutral-600">Cargando información de pago...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error && !paymentData) {
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

  if (!paymentData) return null;

  const nights = calculateNights(
    paymentData.reservation.checkIn,
    paymentData.reservation.checkOut
  );
  const bookingCode = generateBookingCode(paymentData.reservation.id);

  if (paymentData.status !== 'PENDING') {
    return (
      <main className="min-h-screen bg-[#f3eee7]">
        <Header />
        <div className="mx-auto max-w-3xl px-6 pt-24 pb-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-800 mb-4">
              Este pago ya ha sido procesado
            </p>
            <Link
              href={`/reservations/${paymentData.reservation.id}`}
              className="inline-block bg-black text-white px-6 py-2 rounded-lg hover:bg-neutral-800 transition"
            >
              Ver reserva
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />

      <section className="mx-auto max-w-4xl px-6 pt-24 pb-12">
        <div className="mb-8">
          <Link
            href={`/reservations/${paymentData.reservation.id}`}
            className="text-sm text-neutral-600 hover:text-black mb-4 inline-flex items-center"
          >
            ← Volver a la reserva
          </Link>
          <h1 className="text-3xl font-semibold text-black mb-2">
            Completar pago
          </h1>
          <div className="h-px w-20 bg-black/20 mb-2" />
          <p className="text-neutral-600">Reserva #{bookingCode}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 h-full flex flex-col">
              <h2 className="text-xl font-semibold text-black mb-4">
                Resumen de tu reserva
              </h2>

              <div className="flex gap-4 mb-6">
                <div className="w-24 h-24 bg-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
                  {paymentData.reservation.room.images.length > 0 ? (
                    <img
                      src={paymentData.reservation.room.images[0]}
                      alt={`Habitación ${paymentData.reservation.room.number}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-black">
                    {getRoomTypeLabel(paymentData.reservation.room.type)}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Habitación #{paymentData.reservation.room.number}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Check-in</p>
                  <p className="font-medium text-black">
                    {formatDate(paymentData.reservation.checkIn)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Check-out</p>
                  <p className="font-medium text-black">
                    {formatDate(paymentData.reservation.checkOut)}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <div className="bg-neutral-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-sm">
                      Tu pago está protegido por MercadoPago
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 h-full flex flex-col">
              <h2 className="text-xl font-semibold text-black mb-4">
                Detalle del pago
              </h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">
                    {formatPrice(paymentData.reservation.room.price)} x {nights}{' '}
                    {nights === 1 ? 'noche' : 'noches'}
                  </span>
                  <span className="text-neutral-900">
                    {formatPrice(paymentData.reservation.room.price * nights)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Tarifa de servicio</span>
                  <span className="text-neutral-900">{formatPrice(0)}</span>
                </div>
              </div>

              <div className="border-t border-neutral-300 pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-black">Total a pagar</span>
                  <span className="text-2xl font-bold text-black">
                    {formatPrice(paymentData.amount)}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  Precio en pesos argentinos (ARS)
                </p>
              </div>

              <div className="mt-auto space-y-3">
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full bg-[#009EE3] hover:bg-[#0082c4] text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Redirigiendo...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <span>Pagar con MercadoPago</span>
                    </>
                  )}
                </button>

                {/* ✅ Botón de pago de prueba */}
                <button
                  onClick={handleTestPayment}
                  disabled={processing}
                  className="w-full bg-green-100 border border-green-200 text-green-700 hover:bg-green-200 text-center font-medium py-2 px-4 rounded-[30px] transition text-sm"
                >
                  <span>Pagar reserva</span>
                </button>

                <p className="text-xs text-center text-neutral-500">
                  Pago seguro procesado por MercadoPago
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