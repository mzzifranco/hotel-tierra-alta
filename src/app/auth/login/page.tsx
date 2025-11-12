'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const registered = searchParams.get('registered');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email o contraseña incorrectos');
        setLoading(false);
        return;
      }

      // Obtener la sesión actualizada
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      
      const userRole = session?.user?.role;

      // Redirigir según el rol
      if (userRole === 'ADMIN' || userRole === 'OPERATOR') {
        window.location.href = '/operator/dashboard';
      } else if (userRole === 'CLIENT') {
        window.location.href = '/'; 
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3eee7] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-black mb-2">
            Iniciar Sesión
          </h1>
          <div className="mx-auto h-px w-20 bg-black/20 mb-4" />
          <p className="text-neutral-600">Accede a tu cuenta de Tierra Alta</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {registered && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Cuenta creada exitosamente. Inicia sesión para continuar.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Tu contraseña"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-white hover:bg-[#404040] border border-[#404040] text-[#404040] hover:text-white font-medium py-3 px-6 rounded-[30px] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              ¿No tienes cuenta?{' '}
              <Link href="/auth/register" className="text-[#404040] font-medium hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-neutral-600 hover:text-black">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}