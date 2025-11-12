'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token inválido o faltante');
      return;
    }

    handleUnsubscribe();
  }, [token]);

  const handleUnsubscribe = async () => {
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.alreadyUnsubscribed) {
          setStatus('already');
          setMessage('Ya estabas desuscrito de nuestro newsletter');
        } else {
          setStatus('success');
          setMessage('Te has desuscrito exitosamente del newsletter');
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'Error al procesar la desuscripción');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error de conexión. Por favor intenta más tarde.');
    }
  };

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />

      <section className="mx-auto max-w-3xl px-6 pt-32 pb-20">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          {status === 'loading' && (
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#404040] mx-auto mb-4"></div>
              <p className="text-neutral-600">Procesando tu solicitud...</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-black mb-3">Desuscripción Exitosa</h1>
              <p className="text-neutral-600 mb-6">{message}</p>
              <p className="text-sm text-neutral-500 mb-8">
                Lamentamos verte partir. Si cambias de opinión, siempre puedes volver a suscribirte desde nuestra página principal.
              </p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-white text-[#404040] rounded-[30px] border border-[#404040] hover:bg-[#404040] hover:text-white transition"
              >
                Volver al inicio
              </a>
            </div>
          )}

          {status === 'already' && (
            <div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-black mb-3">Ya Estás Desuscrito</h1>
              <p className="text-neutral-600 mb-8">{message}</p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-[#404040] text-white rounded-lg hover:bg-[#2c2c2c] transition"
              >
                Volver al inicio
              </a>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-black mb-3">Error</h1>
              <p className="text-neutral-600 mb-8">{message}</p>
              <div className="flex gap-3 justify-center">
                <a
                  href="/"
                  className="inline-block px-6 py-3 bg-[#404040] text-white rounded-lg hover:bg-[#2c2c2c] transition"
                >
                  Volver al inicio
                </a>
                <a
                  href="/contact"
                  className="inline-block px-6 py-3 bg-white text-[#404040] border border-[#404040] rounded-lg hover:bg-neutral-50 transition"
                >
                  Contactar soporte
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}