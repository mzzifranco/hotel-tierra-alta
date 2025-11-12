'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ButtonBlackWhite from '@/components/ButtonBlackWhite';

interface Restaurant {
  id: number;
  name: string;
  description: string;
  cuisine: string;
  image: string;
  schedule: string;
}

export default function DiningPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [culinaryImageIndex, setCulinaryImageIndex] = useState(0);

  const restaurants: Restaurant[] = [
    { id: 1, name: "El Mirador", description: "Cocina gourmet con vistas panorámicas a los valles. Experiencia culinaria de autor.", cuisine: "Internacional", image: "/restaurant1.jpg", schedule: "Cena: 19:00 - 23:00" },
    { id: 2, name: "La Terraza", description: "Especialidades argentinas y parrilla tradicional en un ambiente al aire libre.", cuisine: "Argentina", image: "/restaurant2.jpg", schedule: "Almuerzo y Cena: 12:00 - 23:00" },
    { id: 3, name: "Bistró del Valle", description: "Platos de temporada con ingredientes locales en un ambiente acogedor.", cuisine: "Regional", image: "/arquitectura7.jpg", schedule: "Desayuno y Almuerzo: 8:00 - 16:00" },
    { id: 4, name: "Wine Bar", description: "Selección de vinos del Valle Calchaquí con tapas y quesos artesanales.", cuisine: "Tapas", image: "/restaurant4.jpg", schedule: "18:00 - 01:00" }
  ];

  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'internacional', label: 'Internacional' },
    { id: 'argentina', label: 'Argentina' },
    { id: 'regional', label: 'Regional' },
    { id: 'tapas', label: 'Tapas' }
  ];

  const culinaryImages = [
    "/food.jpg",
    "/food2.jpg",
    "/food3.jpg"
  ];

  const filteredRestaurants = selectedFilter === 'all' 
    ? restaurants 
    : restaurants.filter(r => r.cuisine.toLowerCase() === selectedFilter);

  const handleFilterClick = (filterId: string) => {
    setSelectedFilter(filterId);
    setMenuOpen(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCulinaryImageIndex((prev) => (prev + 1) % culinaryImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#F3EEE7]">
      <Header />
      
      {/* Hero */}
      <section className="relative h-screen">
        <img 
          src="dining-hero.jpg" 
          alt="Gastronomía" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex h-full items-center justify-center text-center text-white px-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">Gastronomy</h1>
            <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Disfrute de las experiencias gastronómicas sin parangón y sabores<br className="hidden md:block" />
              sin igual en todos nuestros restaurantes.
            </p>
          </div>
        </div>
        <div id="hero-end" className="absolute bottom-0 h-1 w-full" />
      </section>

      {/* Filtros y Restaurantes */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-7xl">
          {/* Header con filtro */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-black">Nuestros Restaurantes</h2>
              <div className="mt-2 h-px w-20 bg-black/20" />
            </div>

            {/* Botón de filtro */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 px-6 py-2 rounded-[30px] bg-[#F3EEE7] text-[#404040] border border-[#404040] hover:bg-[#404040] hover:text-[#ffffff] transition-all duration-300 ease-in-out"
                aria-label="Filtros"
              >
                <span className="text-sm font-medium tracking-[0.15em]">FILTRAR</span>
                <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className="transition-all duration-300">
                  <line x1="0" y1={menuOpen ? "8" : "2"} x2="20" y2={menuOpen ? "8" : "2"} stroke="currentColor" strokeWidth="1" className={`transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
                  <line x1={menuOpen ? "4" : "0"} y1={menuOpen ? "2" : "8"} x2={menuOpen ? "16" : "20"} y2={menuOpen ? "14" : "8"} stroke="currentColor" strokeWidth="1" className="transition-all duration-300" />
                  <line x1={menuOpen ? "4" : "0"} y1={menuOpen ? "14" : "14"} x2={menuOpen ? "16" : "20"} y2={menuOpen ? "2" : "14"} stroke="currentColor" strokeWidth="1" className="transition-all duration-300" />
                </svg>
              </button>

              {/* Menú desplegable */}
              {menuOpen && (
                <div className="absolute right-0 mt-3 w-44 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden z-50">
                  {filters.map((filter, index) => (
                    <button
                      key={filter.id}
                      onClick={() => handleFilterClick(filter.id)}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 transition ${
                        index !== filters.length - 1 ? 'border-b border-neutral-100' : ''
                      } ${
                        selectedFilter === filter.id ? 'bg-neutral-50 font-medium text-black' : 'text-neutral-700'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Grid de Restaurantes */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRestaurants.map((restaurant) => (
              <article 
                key={restaurant.id} 
                className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="relative overflow-hidden aspect-[4/3]">
                  <img 
                    src={restaurant.image} 
                    alt={restaurant.name}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-xs font-medium text-[#404040]">{restaurant.cuisine}</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-black">{restaurant.name}</h3>
                  <p className="text-sm leading-relaxed mb-3 text-[#404040]">{restaurant.description}</p>
                  <p className="text-xs text-neutral-500 mb-4">{restaurant.schedule}</p>
                  <ButtonBlackWhite href={`/dining/${restaurant.id}`} text="MENÚ" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Experiencia Culinaria */}
      <section className="py-20 px-6 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight mb-4 text-black">Experiencia Culinaria</h2>
              <div className="h-px w-20 bg-black/20 mb-6" />
              <p className="text-[15px] leading-7 mb-6 text-[#404040]">
                Cada restaurante en Tierra Alta ofrece una experiencia única, combinando ingredientes locales de alta calidad con técnicas culinarias innovadoras. Nuestros chefs crean platos que celebran los sabores auténticos del Valle Calchaquí.
              </p>
              <p className="text-[15px] leading-7 mb-8 text-[#404040]">
                Desde la parrilla tradicional argentina hasta la cocina de autor internacional, cada bocado cuenta una historia de pasión, tradición y excelencia.
              </p>
              <ButtonBlackWhite href="/contact" text="BOOK TABLE" />
            </div>

            {/* Contenedor con hover como en las demás imágenes */}
            <div className="group relative h-[500px] overflow-hidden rounded-xl">
              {/* Overlay que aparece al hover */}
              <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-700 ease-out group-hover:bg-black/10" />

              {culinaryImages.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Experiencia Culinaria ${index + 1}`}
                  loading="lazy"
                  className={[
                    "absolute inset-0 h-full w-full object-cover",
                    "transition-opacity duration-1000 ease-out",
                    // transform + escala solo en la imagen visible
                    index === culinaryImageIndex
                      ? "opacity-100 transition-transform duration-700 ease-out group-hover:scale-105"
                      : "opacity-0"
                  ].join(" ")}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vinos del Valle */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-semibold tracking-tight mb-4 text-black">Vinos del Valle</h2>
            <div className="h-px w-20 bg-black/20 mx-auto mb-6" />
            <p className="text-[15px] leading-7 max-w-2xl mx-auto text-[#404040]">
              Descubrí nuestra selección exclusiva de vinos del Valle Calchaquí. Cada copa es una invitación a explorar los sabores únicos de la región.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-lg text-center">
              <h3 className="text-lg font-semibold mb-2 text-black">Malbec Premium</h3>
              <p className="text-sm text-[#404040]">Vinos de altura con carácter único</p>
            </div>
            <div className="bg-white p-8 rounded-lg text-center">
              <h3 className="text-lg font-semibold mb-2 text-black">Torrontés</h3>
              <p className="text-sm text-[#404040]">Aromáticos blancos de la región</p>
            </div>
            <div className="bg-white p-8 rounded-lg text-center">
              <h3 className="text-lg font-semibold mb-2 text-black">Cabernet</h3>
              <p className="text-sm text-[#404040]">Tintos robustos y elegantes</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}