'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ButtonBlack from '@/components/ButtonBlack'
import Link from 'next/link'
import ButtonWhite from '@/components/ButtonWhite'
import { useSession } from 'next-auth/react'
import SectionExperiences from '@/components/SectionExperiences'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f3eee7] text-black">
      <Header />
      <HeroVideo />
      <SectionIntro />  
      <SectionGallery /> 
      <SectionAccommodation />
      <SectionWellbeing />
      <SectionDining />
      <SectionExperiences />
      <Footer />
    </main>
  )
}

function HeroVideo() {
  return (
    <section className="relative isolate h-[100vh] overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/hero.mp4"
        poster="/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white">
        <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">Tierra Alta</h1>
        <p className="mt-4 max-w-2xl text-lg">Donde los cerros abrazan el descanso.</p>
      </div>
      <div id="hero-end" className="pointer-events-none absolute bottom-0 h-1 w-full" />
    </section>
  )
}

function SectionIntro() {
  return (
    <section className="mx-auto max-w-4xl px-6 pt-16 pb-6 text-center">
      <p className="text-[12px] tracking-[0.25em] text-neutral-600">
        SALTA, CAFAYATE
      </p>
      <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl text-black">
        Tierra Alta
      </h2>
      <div className="mx-auto mt-2 h-px w-20 bg-black/20" />
      <p className="mx-auto mt-6 text-[17px] leading-8 text-[#404040]">
        Construido en armonía con el paisaje de los Valles Calchaquíes, Tierra Alta retoma los
         tonos rojizos y anaranjados de las montañas que lo rodean. Sus muros evocan la calidez 
         de la tierra y se combinan con patios coloniales, galerías abiertas y fuentes tranquilas. 
         Entre jardines de olivos centenarios, cardones y terrazas privadas, cada rincón conecta 
         con la fuerza del desierto y la serenidad de los cerros que pintan el horizonte.
      </p>
    </section>
  )
}

function SectionGallery() {
  const Tile = ({ src, h }: { src: string; h: string }) => (
    <div className={`group relative overflow-hidden ${h} rounded-xl`}>
      <img
        src={src}
        alt=""
        className="block h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        loading="lazy"
      />
      <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-700 ease-out group-hover:bg-black/10" />
    </div>
  );

  return (
    <section id="gallery" className="mx-auto max-w-7xl px-6 pt-6 pb-12">
      <div className="grid gap-6 sm:grid-cols-[1.2fr_2fr_1.2fr]">
        <div className="grid gap-6">
          <Tile src="/gal-1.jpg" h="h-[298px]" />
          <Tile src="/gal-2.jpg" h="h-[298px]" />
        </div>

        <Tile src="/gal-3.jpg" h="h-[620px]" />

        <div className="grid gap-6">
          <Tile src="/gal-4.jpg" h="h-[298px]" />
          <Tile src="/gal-5.jpg" h="h-[298px]" />
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <ButtonBlack text="VIEW GALLERY" href="/gallery" />
      </div>
    </section>
  );
}

function SectionAccommodation() {
  const { data: session } = useSession()
  const cards = [
    {
      t: "Suites",
      d: "Refugios sofisticados con vistas a los cerros, concebidos para un descanso sereno.",
      img: "/acc-suite.jpg",
      href: "/suites", // ruta propia
    },
    {
      t: "Villas",
      d: "Espacios independientes de arquitectura distinguida, rodeados de jardines y calma absoluta...",
      img: "/acc-villa.jpg",
      href: "/villas", // ruta propia
    },
  ]

  const buttonHref = session ? '/rooms/search' : '/auth/login'

  return (
    <section id="overview" className="mx-auto max-w-7xl px-6 pt-8 pb-20">
      <div className="text-center">
        <h2 className="text-4xl font-semibold tracking-tight text-black">Accommodation</h2>
        <div className="mx-auto mt-2 h-px w-20 bg-black/20" />
        <p className="mx-auto mt-4 max-w-3xl text-[15px] leading-7 text-[#404040]">
          Descanso elevado: cuartos con vistas abiertas, terrazas privadas y elegancia natural.
        </p>
      </div>

      <div className="mt-12 grid gap-10 sm:grid-cols-[1fr_2fr]">
        {cards.map((c, i) => (
          <Link href={c.href} key={i} className="group block cursor-pointer">
            <div className="relative h-[520px] overflow-hidden rounded-xl">
              <img
                src={c.img}
                alt={c.t}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-700 ease-out group-hover:bg-black/10" />
            </div>

            <span className="mt-2 block h-px w-0 bg-black transition-[width] duration-500 ease-out group-hover:w-full" />

            <h3 className="mt-4 text-3xl font-semibold text-black">{c.t}</h3>
            <p className="mt-3 max-w-5xl text-[16px] leading-8 text-[#404040]">{c.d}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <ButtonBlack text="CHECK AVAILABILITY" href={buttonHref} />
      </div>
    </section>
  )
}

function SectionDining() {
  return (
    <section id="dining" className="mx-auto grid max-w-7xl items-center gap-10 px-6 pt-20 pb-10 sm:grid-cols-2">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-black">Dining at Tierra Alta</h2>
        <div className="mt-2 h-px w-20 bg-black/20" />
        <p className="mt-4 max-w-md text-[15px] leading-7 text-[#404040]">
          Cocina con vistas a los cerros. Desde desayunos tranquilos hasta propuestas de autor.
        </p>
        <div className="mt-6">
          <ButtonBlack text="EXPLORE DINING" href="/dining" />
        </div>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="group relative overflow-hidden h-[420px] rounded-xl">
          <img 
            src="/dining-1.jpg" 
            alt="Cocteles" 
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
          />
          <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-700 ease-out group-hover:bg-black/10" />
        </div>
        
        <div className="grid gap-4">
          <div className="group relative overflow-hidden h-[200px] rounded-xl">
            <img 
              src="/dining-2.jpg" 
              alt="Fish" 
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
            />
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-700 ease-out group-hover:bg-black/10" />
          </div>
          
          <div className="group relative overflow-hidden h-[200px] rounded-xl">
            <img 
              src="/dining-3.jpg" 
              alt="Plato" 
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
            />
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-700 ease-out group-hover:bg-black/10" />
          </div>
        </div>
      </div>
    </section>
  )
}

function SectionWellbeing() {
  return (
    <section id="wellbeing" className="relative isolate overflow-hidden">
      <img src="/wellbeing.jpg" alt="Piscina" className="h-[75vh] w-full object-cover" />
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center text-white">
        <h2 className="text-4xl font-semibold tracking-tight">Well-being</h2>
        <div className="mt-2 h-px w-20 bg-white/50" />
        <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-white">
          Programas de spa y fitness para enriquecer cada aspecto de tu bienestar.
        </p>
        <div className="mt-6">
          <ButtonWhite text="DISCOVER WELL-BEING" href="/wellbeing" />
        </div>
      </div>
    </section>
  )
}

