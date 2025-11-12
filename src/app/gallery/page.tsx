"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ImageType {
  id: number;
  src: string;
  title: string;
  category: string;
  alt: string;
  desc: string;
}

export default function GalleryPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<ImageType[]>([]);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [shuffledImages, setShuffledImages] = useState<ImageType[]>([]);

  const images: ImageType[] = [
    {
      id: 1,
      src: "/arquitectura1.jpg",
      title: "Arco junto a la piscina",
      category: "arquitectura",
      alt: "Edificio",
      desc: "Un portal majestuoso se refleja en el agua."
    },
    {
      id: 2,
      src: "/arquitectura2.jpg",
      title: "Galería al aire libre",
      category: "arquitectura",
      alt: "Edificio",
      desc: "Un pasillo con columnas y mesas preparadas para el desayuno."
    },
    {
      id: 3,
      src: "/arquitectura3.jpg",
      title: "Reflejo simétrico",
      category: "arquitectura",
      alt: "Edificio",
      desc: "La arquitectura se duplica en la piscina central."
    },
    {
      id: 4,
      src: "/arquitectura4.jpg",
      title: "Patio íntimo",
      category: "arquitectura",
      alt: "Edificio",
      desc: "Una pileta rodeada de muros y arcos decorativos."
    },
    {
      id: 5,
      src: "/arquitectura5.jpg",
      title: "Puerta monumental",
      category: "arquitectura",
      alt: "Edificio",
      desc: "Un hombre cruza bajo un corredor de arcos y sombras."
    },
    {
      id: 6,
      src: "/arquitectura6.jpg",
      title: "Jardín geométrico",
      category: "arquitectura",
      alt: "Edificio",
      desc: "Senderos rodeados de palmeras y arbustos recortados."
    },
    {
      id: 7,
      src: "/arquitectura7.jpg",
      title: "Salón con chimenea",
      category: "arquitectura",
      alt: "Edificio",
      desc: "Un espacio elegante iluminado por el fuego."
    },
    {
      id: 8,
      src: "/arquitectura8.jpg",
      title: "Terraza con lámpara",
      category: "arquitectura",
      alt: "Edificio",
      desc: "Mesas dispuestas bajo arcos y una linterna colgante."
    },
    {
      id: 9,
      src: "/arquitectura9.jpg",
      title: "Patio",
      category: "arquitectura",
      alt: "Edificio",
      desc: "Mesa de mosaicos frente a una piscina rodeada de arcos."
    },
    {
      id: 10,
      src: "/arquitectura10.jpg",
      title: "Reflejo perfecto",
      category: "arquitectura",
      alt: "Edificio",
      desc: "Columnas y palmeras duplicadas en el espejo de agua."
    },
    {
      id: 11,
      src: "/yoga1.jpg",
      title: "Yoga infantil",
      category: "deportes",
      alt: "Deporte",
      desc: "Un niño practica estiramientos en su mat bajo los arcos."
    },
    {
      id: 12,
      src: "/yoga2.jpg",
      title: "Clase al aire libre",
      category: "deportes",
      alt: "Deporte",
      desc: "Un grupo de niños sigue a su instructora en un espacio abierto con columnas."
    },
    {
      id: 13,
      src: "/yoga3.jpg",
      title: "Postura en calma",
      category: "deportes",
      alt: "Deporte",
      desc: "Un practicante se inclina hacia adelante sobre su esterilla en silencio."
    },
    {
      id: 14,
      src: "/picnic1.jpg",
      title: "Picnic al aire libre",
      category: "experiences",
      alt: "Experiencia",
      desc: "Disfrutando de una comida en un entorno natural."
    },
    {
      id: 15,
      src: "/tenis1.jpg",
      title: "Tenis en la naturaleza",
      category: "deportes",
      alt: "Deporte",
      desc: "Jugando al tenis rodeado de naturaleza."
    },
    {
      id: 16,
      src: "/golf1.jpg",
      title: "Golf en la naturaleza",
      category: "deportes",
      alt: "Deporte",
      desc: "Disfrutando de una partida de golf en un entorno natural."
    },
  ];

  const filters = [
    { id: 'all', label: 'Todas las Categorías' },
    { id: 'arquitectura', label: 'Arquitectura' },
    { id: 'experiences', label: 'Experiences' },
    { id: 'deportes', label: 'Fitness' }
  ];

  const shuffleArray = (array: ImageType[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Shuffle solo al montar el componente
  useEffect(() => {
    setShuffledImages(shuffleArray(images));
  }, []);

  const filteredImages = selectedFilter === 'all' 
    ? shuffledImages
    : shuffledImages.filter(img => img.category === selectedFilter);

  useEffect(() => {
    setVisibleItems(filteredImages);
  }, [selectedFilter, shuffledImages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage) {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') navigateImage('prev');
        if (e.key === 'ArrowRight') navigateImage('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, currentIndex, visibleItems]);

  const openModal = (image: ImageType, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    let newIndex;
    if (direction === 'prev') {
      newIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
    } else {
      newIndex = (currentIndex + 1) % visibleItems.length;
    }
    setCurrentIndex(newIndex);
    setSelectedImage(visibleItems[newIndex]);
  };

  const handleFilterClick = (filterId: string) => {
    setSelectedFilter(filterId);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F3EEE7] text-black">
      <Header />
      
      {/* Hero Section con título y filtro */}
      <div>
        <div className="mx-auto max-w-7xl px-6 pt-32 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">Gallery</h1>
              <div className="mt-2 h-px w-20 bg-black/20" />
              <p className="mt-4 max-w-md text-[15px] leading-7 text-neutral-700">
                Explorá nuestra colección de momentos y experiencias en Tierra Alta.
              </p>
            </div>

            {/* Botón de filtro con icono hamburguesa */}
            <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 px-6 py-2 rounded-[30px] bg-[#f3eee7] text-[#404040] border border-[#404040] hover:bg-[#404040] hover:text-[#ffffff] transition-all duration-300 ease-in-out"
            aria-label="Filtros"
          >
            <span className="text-sm font-medium tracking-[0.15em]">FILTRAR</span>
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className="transition-all duration-300">
              <line 
                x1="0" y1={menuOpen ? "8" : "2"} 
                x2="20" y2={menuOpen ? "8" : "2"} 
                stroke="currentColor" 
                strokeWidth="1"
                className={`transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`}
              />
              <line 
                x1={menuOpen ? "4" : "0"} 
                y1={menuOpen ? "2" : "8"} 
                x2={menuOpen ? "16" : "20"} 
                y2={menuOpen ? "14" : "8"} 
                stroke="currentColor" 
                strokeWidth="1"
                className="transition-all duration-300"
              />
              <line 
                x1={menuOpen ? "4" : "0"} 
                y1={menuOpen ? "14" : "14"} 
                x2={menuOpen ? "16" : "20"} 
                y2={menuOpen ? "2" : "14"} 
                stroke="currentColor" 
                strokeWidth="1"
                className="transition-all duration-300"
              />
            </svg>
          </button>

              {/* Menú desplegable de filtros */}
              {menuOpen && (
                <div className="absolute right-0 mt-3 w-52 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden z-50">
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
        </div>
      </div>

      {/* Gallery */}
      <main className="mx-auto max-w-7xl px-6 pt-6 pb-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {filteredImages.map((image, index) => (
            <article 
              key={image.id} 
              className="group cursor-pointer"
              onClick={() => openModal(image, index)}
            >
              <div className="relative overflow-hidden rounded-lg">
                <img 
                  src={image.src} 
                  alt={image.alt}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-500 ease-out group-hover:bg-black/20" />
                
                {/* Título sobre la imagen al hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <h2 className="text-white text-xl font-medium px-4 text-center drop-shadow-lg">
                    {image.title}
                  </h2>
                </div>
              </div>
              <span className="mt-2 block h-px w-0 bg-black transition-[width] duration-500 ease-out group-hover:w-full" />
            </article>
          ))}
        </div>
      </main>

      <Footer />

      {/* Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-fadeIn"
          onClick={closeModal}
        >
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="fixed top-6 right-6 text-white text-3xl w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-all duration-300 rounded-full z-50"
          >
            ×
          </button>

          {/* Navigation Arrows */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateImage('prev');
            }}
            className="fixed left-6 text-white text-4xl opacity-50 hover:opacity-100 transition-all duration-300 z-50"
          >
            ←
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateImage('next');
            }}
            className="fixed right-6 text-white text-4xl opacity-50 hover:opacity-100 transition-all duration-300 z-50"
          >
            →
          </button>

          {/* Image Container */}
          <div 
            className="relative max-w-[85%] max-h-[85vh] animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-w-full max-h-[85vh] object-contain"
            />
            <div className="mt-6 text-center">
              <h3 className="text-xl font-medium text-white">{selectedImage.title}</h3>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease;
        }
      `}</style>
    </div>
  );
}