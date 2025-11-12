'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Facebook, Instagram, Youtube, Linkedin } from 'lucide-react';

const Footer = () => {
  const pathname = usePathname();
  const isOperatorPage = pathname?.startsWith('/operator');
  
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const navigation = [
    { name: 'ACERCA DE TIERRA ALTA', href: '/acerca' },
    { name: 'POLÍTICA DE COOKIES', href: '/cookies' },
    { name: 'PREGUNTAS FRECUENTES', href: '/faq' },
    { name: 'POLÍTICA DE PRIVACIDAD', href: '/privacidad' }
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/ucasal', label: 'Facebook' },
    { icon: Instagram, href: 'https://instagram.com/ucasal', label: 'Instagram' },
    { icon: Linkedin, href: 'https://linkedin.com/company/ucasal', label: 'LinkedIn' },
    { icon: Youtube, href: 'https://youtube.com/ucasal', label: 'YouTube' }
  ];

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('¡Gracias por suscribirte! Recibirás nuestras novedades en tu email.');
        setEmail('');
      } else {
        setMessage(data.error || 'Error al suscribirse');
      }
    } catch (error) {
      setMessage('Error al procesar la suscripción');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(''), 8000);
    }
  };

  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        <div className={`grid grid-cols-1 ${isOperatorPage ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-12 lg:gap-16`}>
          <nav className={`${isOperatorPage ? '' : 'lg:col-span-4'} space-y-4`}>
            {navigation.map((item) => (
              <a 
                key={item.name}
                href={item.href}
                className="block text-sm text-neutral-800 hover:text-neutral-600 transition-colors duration-200 font-light tracking-wide hover:underline underline-offset-4"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {!isOperatorPage && (
            <>
              <div className="hidden lg:block lg:col-span-2"></div>

              <div className="lg:col-span-6 space-y-4">
                <div>
                  <p className="text-base text-[#404040] mb-4 ml-2">
                    Mantengámonos en contacto
                  </p>
                  
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 mb-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email"
                      required
                      disabled={isSubmitting}
                      className="rounded-full border border-neutral-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#404040]/30 flex-1 min-w-0 disabled:opacity-50"
                    />
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-full px-4 py-2 text-sm font-medium bg-white text-[#404040] border border-[#404040] hover:bg-[#404040] hover:text-white transition-all duration-300 ease-in-out whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Enviando...' : 'Subscribe'}
                    </button>
                  </form>

                  {message && (
                    <div className={`mt-2 p-3 rounded-lg text-sm ${
                      message.includes('Gracias') 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {message}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        aria-label={social.label}
                        className="w-10 h-10 flex items-center justify-center text-[#404040] hover:opacity-70 transition-colors duration-200"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon className="w-5 h-5" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-200">
          <p className="text-sm text-neutral-500 text-center font-light">
            © {new Date().getFullYear()} Tierra Alta
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;