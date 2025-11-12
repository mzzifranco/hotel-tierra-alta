'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ButtonBlackWhite from '@/components/ButtonBlackWhite'

const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-lg bg-gray-200 animate-pulse" />
  ),
});

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f3eee7] text-black">
      <Header />
      <ContactSection />
      <Footer />
    </main>
  )
}

function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    email: '',
    bookingCode: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          subject: formData.subject,
          email: formData.email,
          bookingCode: formData.bookingCode || null,
          message: formData.message
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('¡Mensaje enviado con éxito! Te contactaremos pronto.');
        setFormData({ name: '', subject: '', email: '', bookingCode: '', message: '' });
      } else {
        setMessage(data.error || 'Error al enviar el mensaje');
      }
    } catch (error) {
      setMessage('Error al procesar el mensaje');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(''), 8000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section className="pt-32 px-6">
      <div className="mx-auto max-w-7xl mb-16">
        <h1 className="text-4xl font-semibold tracking-tight text-center text-black">Contact us</h1>
        <div className="mx-auto mt-2 h-px w-20 bg-black/20" />
        <p className="mx-auto mt-4 mb-12 max-w-3xl text-[15px] leading-7 text-[#404040] text-center">
          Estamos aquí para ayudarte. Contáctanos para reservas, consultas o cualquier información que necesites sobre tu estadía en Tierra Alta.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          <div className="bg-white rounded-lg p-8 lg:p-12">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Tu nombre"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-full border border-neutral-300 px-6 py-3 text-sm text-[#404040] focus:outline-none focus:ring-2 focus:ring-[#404040]/30 disabled:opacity-50"
                />
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Dirección de email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-full border border-neutral-300 px-6 py-3 text-sm text-[#404040] focus:outline-none focus:ring-2 focus:ring-[#404040]/30 disabled:opacity-50"
                />
              </div>

              <div>
                <input
                  type="text"
                  name="subject"
                  placeholder="Asunto de la consulta"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-full border border-neutral-300 px-6 py-3 text-sm text-[#404040] focus:outline-none focus:ring-2 focus:ring-[#404040]/30 disabled:opacity-50"
                />
              </div>

              <div>
                <input
                  type="text"
                  name="bookingCode"
                  placeholder="Código de reserva (opcional)"
                  value={formData.bookingCode}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-full border border-neutral-300 px-6 py-3 text-sm text-[#404040] focus:outline-none focus:ring-2 focus:ring-[#404040]/30 disabled:opacity-50"
                />
              </div>

              <div>
                <textarea
                  name="message"
                  placeholder="Escriba su mensaje"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  rows={6}
                  className="w-full rounded-3xl border border-neutral-300 px-6 py-3 text-sm text-[#404040] focus:outline-none focus:ring-2 focus:ring-[#404040]/30 resize-none disabled:opacity-50"
                />
              </div>

              <div className="flex justify-center">
                <ButtonBlackWhite 
                  type="submit" 
                  text={isSubmitting ? "ENVIANDO..." : "ENVIAR"}
                />
              </div>

              {message && (
                <div className={`mt-4 p-3 rounded-lg text-sm text-center ${
                  message.includes('éxito') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}
            </form>
          </div>

          <div className="bg-white rounded-lg p-8 lg:p-12 flex items-center justify-center">
            <div className="space-y-6 text-center">
              <div className="flex items-center justify-center gap-4">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  <svg 
                    className="w-5 h-5 text-black" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#404040] leading-relaxed">
                    Malbec y General Güemes<br />
                    Cafayate, Salta, Argentina
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  <svg 
                    className="w-5 h-5 text-black" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <a href="tel:+5493875714027" className="text-[#404040] hover:text-[#404040]/80 transition-colors">
                    +54 9 387 5714027
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  <svg 
                    className="w-5 h-5 text-black" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <a href="mailto:contacto@tierraalta.com" className="text-[#404040] hover:text-[#404040]/80 transition-colors break-all">
                    contact@tierraalta.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 mb-6">
          <h2 className="text-4xl font-semibold tracking-tight text-black">En Cafayate</h2>
          <div className="mt-2 h-px w-20 bg-black/20" />
          <p className="mt-4 max-w-md text-[15px] leading-7 text-[#404040]">
            Un refugio entre montañas y bodegas, con acceso privilegiado a los paisajes y sabores del Valle Calchaquí.
          </p>
        </div>

        <div className="h-[500px] lg:h-[600px] rounded-lg overflow-hidden">
          <MapComponent />
        </div>
      </div>
    </section>
  )
}