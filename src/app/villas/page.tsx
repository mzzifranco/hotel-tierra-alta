'use client'

import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ButtonBlack from '@/components/ButtonBlack'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, BedDouble, Users, Eye } from 'lucide-react'

export default function RoomDetailPage() {
  const hero = { src: '/herovilla.jpg', alt: 'Sala con vista a los cerros' }

  const features = [
    { img: '/feat-1.jpg', title: 'Servicio dedicado', text: 'Atención personalizada durante toda la estadía.' },
    { img: '/feat-2a.jpg', title: 'Privacidad total', text: 'Espacios independientes rodeados de naturaleza.' },
    { img: '/feat-3a.jpg', title: 'Áreas sociales', text: 'Salas y terrazas amplias para compartir momentos.' },
    { img: '/feat-4a.jpg', title: 'Conexión natural', text: 'Entorno de viñedos y cerros que inspira calma.' },
  ]

  const mosaic = {
    left: { src: '/mosaic-1a.jpg', alt: 'Dormitorio' },
    rightTop: [
      { src: '/mosaic-2a.jpg', alt: 'Lounge' },
      { src: '/mosaic-3a.jpg', alt: 'Pasillo' },
    ],
    rightBottom: [
      { src: '/mosaic-4a.jpg', alt: 'Baño' },
      { src: '/mosaic-5a.jpg', alt: 'Vista' },
    ],
  }

  const amenitiesLeft = [
    'Terraza privada con mobiliario',
    'Sala de estar amplia',
    'Cocina equipada para estadías largas',
    'Chimenea interior en salón',
  ]

  const amenitiesRight = [
    'Piscina o jacuzzi exterior',
    'Batas, pantuflas y bolso de piscina',
    'Parrilla y espacio al aire libre',
    'Servicio de bar a pedido',
  ]

  const detailsPetit = [
    { Icon: ArrowUpRight, label: 'Size', value: '95 m²' },
    { Icon: BedDouble,    label: 'Beds', value: '1 King + 1 Twins' },
    { Icon: Users,        label: 'Occupancy', value: 'Hasta 3 huéspedes' },
    { Icon: Eye,          label: 'View', value: 'Patio interior y viñedos' },
  ]   

  const detailsGrande = [
    { Icon: ArrowUpRight, label: 'Size', value: '170 m²' },
    { Icon: BedDouble,    label: 'Beds', value: 'Kings o Twins + sofá' },
    { Icon: Users,        label: 'Occupancy', value: 'Hasta 5 huéspedes' },
    { Icon: Eye,          label: 'View', value: 'Viñedos y cerros' },
  ]

  const { data: session } = useSession()
  const router = useRouter()
  const handleReserve = () => router.push(session ? '/rooms/search' : '/auth/login')

  return (
    <main className="min-h-screen bg-[#f3eee7] text-black">
      <Header />

      {/* HERO */}
      <section className="relative w-full">
        <div className="relative h-[70vh] min-h-[380px] w-full">
          <Image src={hero.src} alt={hero.alt} fill priority className="object-cover" />
        </div>
        <div id="hero-end" className="pointer-events-none absolute bottom-0 left-0 right-0 h-px" />
      </section>

      {/* Título */}
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Villas</h1>
        <div className="mx-auto mt-3 h-px w-24 bg-black/20" />
        <p className="mx-auto mt-5 max-w-3xl text-[16px] leading-7 text-[#404040]">
          Residencias privadas que combinan arquitectura contemporánea y naturaleza. 
        </p>
      </section>

      {/* 4 columnas con efecto hover */}
      <section className="mx-auto max-w-7xl px-4 pb-14">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {features.map((f) => (
            <article key={f.title} className="group">
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
                <Image 
                  src={f.img} 
                  alt={f.title} 
                  fill 
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                />
              </div>
              <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-[15px] leading-7 text-[#404040]">{f.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <ButtonBlack text="RESERVAR" onClick={handleReserve} />
        </div>
      </section>

      {/* Grid de fotos con efecto hover */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl group md:col-span-2">
            <Image 
              src={mosaic.left.src} 
              alt={mosaic.left.alt} 
              fill 
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
            />
          </div>
          <div className="grid gap-6">
            {mosaic.rightTop.map((m) => (
              <div key={m.alt} className="relative aspect-[4/3] overflow-hidden rounded-2xl group">
                <Image 
                  src={m.src} 
                  alt={m.alt} 
                  fill 
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                />
              </div>
            ))}
          </div>
          <div className="grid gap-6 md:col-span-3 md:grid-cols-2">
            {mosaic.rightBottom.map((m) => (
              <div key={m.alt} className="relative aspect-[4/3] overflow-hidden rounded-2xl group">
                <Image 
                  src={m.src} 
                  alt={m.alt} 
                  fill 
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Room Details */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-3xl font-semibold text-center">Room Details</h2>
        <div className="mx-auto mt-2 mb-10 h-px w-16 bg-black/20" />

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {/* Villa Petit */}
          <div>
            <h3 className="text-2xl font-semibold text-center">Villa Petit</h3>
            <div className="mx-auto mt-2 mb-8 h-px w-12 bg-black/20" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center">
              {detailsPetit.map(({ Icon, label, value }) => (
                <div key={`petit-${label}`}>
                  <Icon className="mx-auto h-6 w-6 mb-2" />
                  <h4 className="font-medium">{label}</h4>
                  <p className="text-sm text-[#404040]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Villa Grande */}
          <div>
            <h3 className="text-2xl font-semibold text-center">Villa Grande</h3>
            <div className="mx-auto mt-2 mb-8 h-px w-12 bg-black/20" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center">
              {detailsGrande.map(({ Icon, label, value }) => (
                <div key={`grande-${label}`}>
                  <Icon className="mx-auto h-6 w-6 mb-2" />
                  <h4 className="font-medium">{label}</h4>
                  <p className="text-sm text-[#404040]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Amenities */}
        <h2 className="mt-16 text-3xl font-semibold text-center">Amenities</h2>
        <div className="mx-auto mt-2 mb-10 h-px w-16 bg-black/20" />
        <div className="mx-auto max-w-3xl grid grid-cols-1 gap-6 sm:grid-cols-2 text-[15px] text-center">
          <ul className="space-y-2">{amenitiesLeft.map((a) => <li key={a}>{a}</li>)}</ul>
          <ul className="space-y-2">{amenitiesRight.map((a) => <li key={a}>{a}</li>)}</ul>
        </div>
      </section>

      <Footer />
    </main>
  )
}
