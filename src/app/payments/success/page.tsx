'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { generateBookingCode } from '@/lib/utils';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  
  const reservationId = searchParams.get('reservationId');
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');

  useEffect(() => {
    // Redirigir automáticamente después de 5 segundos
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (reservationId) {
            router.push(`/reservations/${reservationId}`);
          } else {
            router.push('/reservations');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [reservationId, router]);

  const bookingCode = reservationId ? generateBookingCode(reservationId) : '';

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />

      <section className="mx-auto max-w-2xl px-6 pt-24 pb-12">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Ícono de éxito */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-black mb-3">
            ¡Pago exitoso!
          </h1>
          <p className="text-lg text-neutral-600 mb-6">
            Tu reserva ha sido confirmada
          </p>

          {/* Información */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="space-y-3">
              {bookingCode && (
                <div>
                  <p className="text-sm text-green-700 mb-1">Código de reserva</p>
                  <p className="text-2xl font-bold text-green-900">{bookingCode}</p>
                </div>
              )}
              {paymentId && (
                <div>
                  <p className="text-sm text-green-700 mb-1">ID de pago</p>
                  <p className="text-sm font-mono text-green-900">{paymentId}</p>
                </div>
              )}
              <div className="pt-3 border-t border-green-200">
                <p className="text-sm text-green-800">
                  ✓ Recibirás un email de confirmación
                </p>
                <p className="text-sm text-green-800">
                  ✓ Tu reserva está garantizada
                </p>
              </div>
            </div>
          </div>

          {/* Próximos pasos */}
          <div className="text-left bg-neutral-50 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-black mb-3">Próximos pasos</h2>
            <ol className="space-y-2 text-sm text-neutral-700">
              <li className="flex gap-2">
                <span className="font-semibold text-black">1.</span>
                <span>Revisa tu email para ver los detalles de la reserva</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-black">2.</span>
                <span>Prepara tu documento de identidad para el check-in</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-black">3.</span>
                <span>Llega al hotel después de las 15:00 hrs</span>
              </li>
            </ol>
          </div>

          {/* Botones */}
          <div className="space-y-3">
            {reservationId ? (
              <Link
                href={`/reservations/${reservationId}`}
                className="block w-full bg-black hover:bg-neutral-800 text-white font-medium py-3 px-6 rounded-lg transition"
              >
                Ver detalles de mi reserva
              </Link>
            ) : (
              <Link
                href="/reservations"
                className="block w-full bg-black hover:bg-neutral-800 text-white font-medium py-3 px-6 rounded-lg transition"
              >
                Ver mis reservas
              </Link>
            )}
            <Link
              href="/"
              className="block w-full bg-white border border-neutral-300 text-black hover:bg-neutral-50 font-medium py-3 px-6 rounded-lg transition"
            >
              Volver al inicio
            </Link>
          </div>

          {/* Contador de redirección */}
          <p className="text-xs text-neutral-500 mt-6">
            Serás redirigido automáticamente en {countdown} segundo{countdown !== 1 ? 's' : ''}...
          </p>
        </div>

        {/* Información de contacto */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-600 mb-2">
            ¿Necesitas ayuda con tu reserva?
          </p>
          <a
            href={`mailto:${process.env.NEXT_PUBLIC_HOTEL_EMAIL}`}
            className="text-sm text-black hover:underline"
          >
            {process.env.NEXT_PUBLIC_HOTEL_EMAIL}
          </a>
          <span className="text-neutral-400 mx-2">|</span>
          <a
            href={`tel:${process.env.NEXT_PUBLIC_HOTEL_PHONE}`}
            className="text-sm text-black hover:underline"
          >
            {process.env.NEXT_PUBLIC_HOTEL_PHONE}
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}