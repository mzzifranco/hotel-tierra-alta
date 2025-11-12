"use client";

import React, { useState, useEffect } from 'react';
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

const GalleryNextJS = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<ImageType[]>([]);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const images: ImageType[] = [
    {
      id: 1,
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      title: "Picos Nevados",
      category: "naturaleza",
      alt: "Montañas",
      desc: "Majestuosas montañas cubiertas de nieve."
    },
    {
      id: 2,
      src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800",
      title: "Geometría Moderna",
      category: "arquitectura",
      alt: "Edificio",
      desc: "Diseño arquitectónico contemporáneo."
    },
    {
      id: 3,
      src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
      title: "Sendero del Bosque",
      category: "naturaleza",
      alt: "Bosque",
      desc: "Camino sereno entre árboles frondosos."
    },
    {
      id: 4,
      src: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800",
      title: "Luces de la Ciudad",
      category: "urbano",
      alt: "Ciudad",
      desc: "Vibrante vida urbana nocturna."
    },
    {
      id: 5,
      src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",
      title: "Niebla al Amanecer",
      category: "naturaleza",
      alt: "Niebla",
      desc: "Atmosférico paisaje matutino."
    },
    {
      id: 6,
      src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800",
      title: "Estructura Minimalista",
      category: "arquitectura",
      alt: "Arquitectura",
      desc: "Líneas limpias y diseño funcional."
    },
    {
      id: 7,
      src: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800",
      title: "Callejón Nocturno",
      category: "urbano",
      alt: "Calle",
      desc: "Ambiente urbano después del anochecer."
    },
    {
      id: 8,
      src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800",
      title: "Reflejo Sereno",
      category: "naturaleza",
      alt: "Lago",
      desc: "Aguas tranquilas reflejando el cielo."
    }
  ];

  const filters = [
    { id: 'all', label: 'Todas' },
    { id: 'naturaleza', label: 'Naturaleza' },
    { id: 'arquitectura', label: 'Arquitectura' },
    { id: 'urbano', label: 'Urbano' }
  ];

  const filteredImages = selectedFilter === 'all' 
    ? images 
    : images.filter(img => img.category === selectedFilter);

  useEffect(() => {
    setVisibleItems(filteredImages);
  }, [selectedFilter]);

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
    <div className="min-h-screen bg-[#FBF7F2] text-black">
      <Header />
      
      {/* Barra de filtros hamburguesa */}
      <div className="sticky top-0 z-40 bg-[#FBF7F2]/95 backdrop-blur-sm border-b border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-end">
          {/* Botón Hamburguesa */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="relative h-10 w-10 flex flex-col items-center justify-center gap-1.5"
            aria-label="Menú"
          >
            <span className={`h-0.5 w-6 bg-black transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`h-0.5 w-6 bg-black transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`h-0.5 w-6 bg-black transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>

        {/* Menú desplegable */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? 'max-h-96' : 'max-h-0'}`}>
          <nav className="border-t border-black/10 bg-white/50 backdrop-blur-sm">
            <ul className="mx-auto max-w-7xl px-6 py-4">
              {filters.map(filter => (
                <li key={filter.id}>
                  <button
                    onClick={() => handleFilterClick(filter.id)}
                    className={`block w-full text-left py-3 px-4 transition-colors duration-200 ${
                      selectedFilter === filter.id 
                        ? 'text-black font-medium' 
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    {filter.label}
                    {selectedFilter === filter.id && (
                      <span className="ml-2 inline-block h-1 w-1 rounded-full bg-black"></span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Gallery */}
      <main className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight text-center">Galería</h1>
        <div className="mx-auto mt-2 h-px w-20 bg-black/20" />
        
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {filteredImages.map((image, index) => (
            <article 
              key={image.id} 
              className="group cursor-pointer"
              onClick={() => openModal(image, index)}
            >
              <div className="relative overflow-hidden">
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
              <p className="mt-2 text-sm text-neutral-300">{selectedImage.desc}</p>
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
};

export default GalleryNextJS;