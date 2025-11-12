'use client';

import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { generateBookingCode } from '@/lib/utils';

export default function PaymentFailurePage() {
  const searchParams = useSearchParams();
  
  const reservationId = searchParams.get('reservationId');
  const paymentId = searchParams.get('payment_id');
  
  const bookingCode = reservationId ? generateBookingCode(reservationId) : '';

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />

      <section className="mx-auto max-w-2xl px-6 pt-24 pb-12">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Ícono de error */}
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-black mb-3">
            Pago rechazado
          </h1>
          <p className="text-lg text-neutral-600 mb-6">
            No pudimos procesar tu pago
          </p>

          {/* Información */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="space-y-3">
              {bookingCode && (
                <div>
                  <p className="text-sm text-red-700 mb-1">Tu reserva</p>
                  <p className="text-xl font-bold text-red-900">{bookingCode}</p>
                  <p className="text-sm text-red-700 mt-2">
                    Tu reserva sigue activa pero requiere pago
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Razones posibles */}
          <div className="text-left bg-neutral-50 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-black mb-3">Posibles causas</h2>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li className="flex gap-2">
                <span>•</span>
                <span>Fondos insuficientes en tu cuenta</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Datos de la tarjeta incorrectos</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Tu banco rechazó la transacción</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Límite de compras excedido</span>
              </li>
            </ul>
          </div>

          {/* Qué hacer */}
          <div className="text-left bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-blue-900 mb-3">¿Qué puedo hacer?</h2>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex gap-2">
                <span className="font-semibold">1.</span>
                <span>Verifica los datos de tu tarjeta</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">2.</span>
                <span>Contacta a tu banco si es necesario</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">3.</span>
                <span>Intenta nuevamente con otro método de pago</span>
              </li>
            </ol>
          </div>

          {/* Botones */}
          <div className="space-y-3">
            {reservationId && (
              <Link
                href={`/reservations/${reservationId}`}
                className="block w-full bg-black hover:bg-neutral-800 text-white font-medium py-3 px-6 rounded-lg transition"
              >
                Volver a mi reserva
              </Link>
            )}
            <Link
              href="/reservations"
              className="block w-full bg-white border border-neutral-300 text-black hover:bg-neutral-50 font-medium py-3 px-6 rounded-lg transition"
            >
              Ver todas mis reservas
            </Link>
            <Link
              href="/"
              className="block w-full bg-white border border-neutral-300 text-black hover:bg-neutral-50 font-medium py-3 px-6 rounded-lg transition"
            >
              Volver al inicio
            </Link>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-600 mb-2">
            ¿Necesitas ayuda?
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