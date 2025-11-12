'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const transparentPages = ['/', '/dining', '/wellbeing', '/suites', '/villas']

  useEffect(() => {
    setOpen(false)
    if (!transparentPages.includes(pathname)) { setScrolled(true); return }
    const el = document.querySelector('#hero-end')
    if (!el) { setScrolled(true); return }
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [pathname])

  const cta =
    'rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out'
  const ctaScrolled = `${cta} bg-white text-[#404040] border border-[#404040] hover:bg-[#404040] hover:text-white`
  const ctaTransparent = `${cta} bg-white text-[#404040] hover:opacity-90`

  const user = session?.user as { name?: string | null; email?: string | null; role?: string } | undefined
  const isOperator = user?.role === 'OPERATOR' || user?.role === 'ADMIN'
  const isUser = user?.role === 'USER'
  const isAdmin = user?.role === 'ADMIN'

  return (
    <header className={`fixed top-0 z-50 w-full transition-colors ${scrolled ? 'bg-white text-black shadow' : 'bg-transparent text-white'}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold tracking-tight">Tierra Alta</Link>

        {/* Nav desktop */}
        <nav className="hidden gap-6 text-sm sm:flex">
          {!session && (
            <>
              <Link href="/gallery" className="hover:opacity-70">Gallery</Link>
              <Link href="/auth/login" className="hover:opacity-70">Accommodation</Link>
              <Link href="/wellbeing" className="hover:opacity-70">Well-being</Link>
              <Link href="/dining" className="hover:opacity-70">Dining</Link>
              <Link href="/#experiences" className="hover:opacity-70">Experiences</Link>
              <Link href="/contact" className="hover:opacity-70">Contact us</Link>
            </>
          )}
          
          {isUser && (
            <>
              <Link href="/gallery" className="hover:opacity-70">Gallery</Link>
              <Link href="/rooms/search" className="hover:opacity-70">Accommodation</Link>
              <Link href="/wellbeing" className="hover:opacity-70">Well-being</Link>
              <Link href="/dining" className="hover:opacity-70">Dining</Link>
              <Link href="/#experiences" className="hover:opacity-70">Experiences</Link>
              <Link href="/contact" className="hover:opacity-70">Contact us</Link>
              <Link href="/reservations" className="hover:opacity-70">Mis Reservas</Link>
              <Link href="/services" className="hover:opacity-70">Mis Servicios</Link>
            </>
          )}

          {isOperator && (
            <>
              <Link href="/operator/dashboard" className="hover:opacity-70">Dashboard</Link>
              <Link href="/operator/rooms" className="hover:opacity-70">Habitaciones</Link>
              <Link href="/operator/bookings" className="hover:opacity-70">Reservas</Link>
              <Link href="/operator/analytics/hotel-revenue" className="hover:opacity-70">Ingresos (reservas)</Link>              
              <Link href="/operator/messages" className="hover:opacity-70">Mensajes</Link>
              <Link href="/operator/send-newsletter" className="hover:opacity-70">Newsletter</Link>
              <Link href="/operator/services" className="hover:opacity-70">Servicios</Link>
              <Link href="/operator/analytics/service-revenue" className="hover:opacity-70">Ingresos (servicios)</Link>
              {isAdmin && (
                <Link href="/operator/users" className="hover:opacity-70">Usuarios</Link>
              )}
            </>
          )}
          
        </nav>

        {/* CTAs desktop */}
        <div className="hidden gap-3 sm:flex items-center">
          {status === 'loading' ? (
            <div className="text-sm opacity-70">...</div>
          ) : session ? (
            <>
              <span className="text-sm opacity-70">
                {session.user?.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className={scrolled ? ctaScrolled : ctaTransparent}
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className={scrolled ? ctaScrolled : ctaTransparent}>
                Login
              </Link>
              <Link href="/auth/register" className={scrolled ? ctaScrolled : ctaTransparent}>
                Registro
              </Link>
            </>
          )}
        </div>

        {/* Toggle móvil con 3 barras → X */}
        <button
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          className="sm:hidden inline-flex items-center justify-center p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        >
          <svg width="24" height="24" viewBox="0 0 20 16" fill="none" className="transition-all duration-300">
            <line x1="0" y1={open ? "8" : "2"} x2="20" y2={open ? "8" : "2"} stroke="currentColor" strokeWidth="2" className={`transition-all duration-300 ${open ? 'opacity-0' : 'opacity-100'}`} />
            <line x1={open ? "4" : "0"} y1={open ? "2" : "8"} x2={open ? "16" : "20"} y2={open ? "14" : "8"} stroke="currentColor" strokeWidth="2" className="transition-all duration-300" />
            <line x1={open ? "4" : "0"} y1={open ? "14" : "14"} x2={open ? "16" : "20"} y2={open ? "2" : "14"} stroke="currentColor" strokeWidth="2" className="transition-all duration-300" />
          </svg>
        </button>
      </div>

      {/* Panel móvil */}
      <div className={`sm:hidden transition-all duration-300 ${open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <nav className={`px-6 pb-6 ${scrolled ? 'bg-white text-black shadow' : 'bg-transparent text-white'}`}>
          <ul className="space-y-4 pt-0 text-base">
            {!session && (
              <>
                <li><Link onClick={() => setOpen(false)} href="/gallery" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Gallery</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/auth/login" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Accommodation</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/wellbeing" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Well-being</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/dining" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Dining</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/#experiences" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Experiences</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/contact" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Contact</Link></li>
              </>
            )}

            {isUser && (
              <>
                <li><Link onClick={() => setOpen(false)} href="/gallery" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Gallery</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/room/search" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Accommodation</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/wellbeing" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Well-being</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/dining" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Dining</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/#experiences" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Experiences</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/contact" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Contact</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/rooms" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Habitaciones</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/reservations" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Mis Reservas</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/services" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Mis Servicios</Link></li>
              </>
            )}

            {isOperator && (
              <>
                <li><Link onClick={() => setOpen(false)} href="/operator/dashboard" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Dashboard</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/operator/rooms" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Habitaciones</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/operator/bookings" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Reservas</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/operator/analytics/hotel-revenue" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Ingresos (reservas)</Link></li>                   
                <li><Link onClick={() => setOpen(false)} href="/operator/messages" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Mensajes</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/operator/send-newsletter" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Newsletter</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/operator/services" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Servicios</Link></li>
                <li><Link onClick={() => setOpen(false)} href="/operator/analytics/service-revenue" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Ingresos (servicios)</Link></li>             
                {isAdmin && (
                  <li><Link onClick={() => setOpen(false)} href="/operator/users" className="block transition-opacity duration-200 hover:opacity-70 active:opacity-80">Usuarios</Link></li>
                )}
              </>
            )}

          </ul>

          <div className="mt-6 flex gap-3">
            {session ? (
              <>
                <span className="text-sm opacity-70 py-2">
                  {session.user?.name}
                </span>
                <button
                  onClick={() => {
                    setOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  className={scrolled ? ctaScrolled : ctaTransparent}
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setOpen(false)} className={scrolled ? ctaScrolled : ctaTransparent}>
                  Login
                </Link>
                <Link href="/auth/register" onClick={() => setOpen(false)} className={scrolled ? ctaScrolled : ctaTransparent}>
                  Registro
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}