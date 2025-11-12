'use client';

import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { generateBookingCode } from '@/lib/utils';

export default function PaymentPendingPage() {
  const searchParams = useSearchParams();
  
  const reservationId = searchParams.get('reservationId');
  const paymentId = searchParams.get('payment_id');
  
  const bookingCode = reservationId ? generateBookingCode(reservationId) : '';

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />

      <section className="mx-auto max-w-2xl px-6 pt-24 pb-12">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Ícono de pendiente */}
          <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-black mb-3">
            Pago en proceso
          </h1>
          <p className="text-lg text-neutral-600 mb-6">
            Estamos procesando tu pago
          </p>

          {/* Información */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="space-y-3">
              {bookingCode && (
                <div>
                  <p className="text-sm text-yellow-700 mb-1">Código de reserva</p>
                  <p className="text-2xl font-bold text-yellow-900">{bookingCode}</p>
                </div>
              )}
              {paymentId && (
                <div>
                  <p className="text-sm text-yellow-700 mb-1">ID de pago</p>
                  <p className="text-sm font-mono text-yellow-900">{paymentId}</p>
                </div>
              )}
              <div className="pt-3 border-t border-yellow-200">
                <p className="text-sm text-yellow-800">
                  ⏳ Tu pago está siendo procesado
                </p>
                <p className="text-sm text-yellow-800">
                  📧 Te notificaremos cuando se confirme
                </p>
              </div>
            </div>
          </div>

          {/* Información importante */}
          <div className="text-left bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-blue-900 mb-3">¿Qué significa esto?</h2>
            <div className="space-y-3 text-sm text-blue-800">
              <p>
                Tu pago está siendo verificado por el sistema bancario. Esto puede deberse a:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Pago con efectivo en punto de pago</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Transferencia bancaria en proceso</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Verificación adicional de seguridad</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Qué hacer */}
          <div className="text-left bg-neutral-50 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-black mb-3">¿Qué debo hacer?</h2>
            <ol className="space-y-2 text-sm text-neutral-700">
              <li className="flex gap-2">
                <span className="font-semibold text-black">1.</span>
                <span>Espera la confirmación por email (puede tardar hasta 48 horas)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-black">2.</span>
                <span>Verifica el estado en tu panel de reservas</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-black">3.</span>
                <span>Si después de 48 horas no hay cambios, contáctanos</span>
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
        </div>

        {/* Información de contacto */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-600 mb-2">
            ¿Tienes dudas sobre tu pago?
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