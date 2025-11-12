'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ButtonBlackWhite from '@/components/ButtonBlackWhite';
import ButtonBlack from '@/components/ButtonBlack';

interface Service {
  id: string;
  name: string;
  description: string;
  shortDescription: string | null;
  category: string;
  price: number;
  pricePerPerson: boolean;
  duration: number;
  minCapacity: number;
  maxCapacity: number;
  mainImage: string | null;
  images: string[];
}

export default function WellbeingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [spaImageIndex, setSpaImageIndex] = useState(0);
  const [fitnessImageIndex, setFitnessImageIndex] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const spaImages = ["/spa1.jpg", "/masaje2.jpg", "/masaje1.jpg"];
  const fitnessImages = ["/golf1.jpg", "/tenis1.jpg", "/gym1.jpg"];

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpaImageIndex((prev) => (prev + 1) % spaImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [spaImages.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFitnessImageIndex((prev) => (prev + 1) % fitnessImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [fitnessImages.length]);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/hotel-services?type=SPA');
      const data = await response.json();
      
      if (data.success) {
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Error cargando servicios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = (service: Service) => {
    if (!session) {
      router.push('/auth/login?callbackUrl=/wellbeing');
      return;
    }
    
    // Guardar servicio en localStorage y redirigir
    localStorage.setItem('selectedService', JSON.stringify(service));
    router.push('/services/new');
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      SPIRITUAL_ILLUMINATION: 'Meditación & Mindfulness',
      PHYSICAL_OPTIMISATION: 'Entrenamiento & Yoga',
      MENTAL_EQUILIBRIUM: 'Terapias Holísticas',
    };
    return labels[category] || category.replace(/_/g, ' ');
  };

  return (
    <div className="min-h-screen bg-[#F3EEE7]">
      <Header />
      
      {/* Hero */}
      <section className="relative h-screen">
        <img 
          src="/spa1head.jpg" 
          alt="Wellness" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex h-full items-center justify-center text-center text-white px-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">Well-Being</h1>
            <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Adéntrese en nuestro spa y descubra completas instalaciones de fitness y <br className="hidden md:block" />
              una piscina acogedora diseñada para inspirar una relajación total.
            </p>
          </div>
        </div>
        <div id="hero-end" className="absolute bottom-0 h-1 w-full" />
      </section>

      {/* Spa */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight mb-4 text-black">Tierra Alta Spa</h2>
              <div className="h-px w-20 bg-black/20 mb-6" />
              <p className="text-[15px] leading-7 mb-6 text-[#404040]">
                Adéntrese en nuestro elegante spa y reconéctese consigo mismo. Desde masajes relajantes hasta tratamientos revitalizantes, sumérjase en un mundo de tranquilidad y rejuvenecimiento.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start"><span className="mr-3 mt-1">—</span><span className="text-[15px] text-[#404040]">Salón de belleza</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1">—</span><span className="text-[15px] text-[#404040]">Tratamientos especializados</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1">—</span><span className="text-[15px] text-[#404040]">Masajes</span></li>
              </ul>
              <ButtonBlack href="#principles" text="MORE DETAILS" />
            </div>
            <div className="relative h-[600px] rounded-lg overflow-hidden group">
              {spaImages.map((img, index) => (
                <img 
                  key={index}
                  src={img} 
                  alt={`Spa ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${index === spaImageIndex ? 'opacity-100' : 'opacity-0'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Fitness */}
      <section className="py-20 px-6 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[600px] rounded-lg overflow-hidden order-2 md:order-1 group">
              {fitnessImages.map((img, index) => (
                <img 
                  key={index}
                  src={img} 
                  alt={`Fitness ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${index === fitnessImageIndex ? 'opacity-100' : 'opacity-0'}`}
                />
              ))}
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-4xl font-semibold tracking-tight mb-4 text-black">Tierra Alta Fitness</h2>
              <div className="h-px w-20 bg-black/20 mb-6" />
              <p className="text-[15px] leading-7 mb-6 text-[#404040]">
                Emprenda un viaje de descubrimiento en nuestro centro de fitness de lujo, con entrenamientos personalizados, la guía de expertos y un ambiente comunitario vibrante.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start"><span className="mr-3 mt-1">—</span><span className="text-[15px] text-[#404040]">Cancha de golf y tenis</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1">—</span><span className="text-[15px] text-[#404040]">Gimnasio equipado</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1">—</span><span className="text-[15px] text-[#404040]">Instalaciones seguras</span></li>
              </ul>
              <ButtonBlackWhite href="#principles" text="MORE DETAILS" />
            </div>
          </div>
        </div>
      </section>

      {/* Servicios / Principles */}
      <section id="spa" className="pt-15 pb-20 px-6 overflow-hidden scroll-mt-15">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-black">Spa</h2>
            <div className="mx-auto mt-2 h-px w-20 bg-black/20" />
            <p className="mx-auto mt-4 max-w-3xl text-[15px] leading-7 text-[#404040]">
              En Tierra Alta, se abren puertas hacia la renovación y a conectarse con el alma del lugar. Ya sea cultivando la calma interior en entornos tranquilos o encontrando sosiego en rituales espirituales.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
              <p className="mt-4 text-neutral-600">Cargando servicios...</p>
            </div>
          ) : services.length > 0 ? (
            <div className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {services.map((service) => {
                const imageUrl = service.mainImage || service.images[0] || '/placeholder-spa.jpg';
                
                return (
                  <article key={service.id} className="group flex-shrink-0 w-[340px] bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative overflow-hidden mb-6 rounded-lg">
                      <img 
                        src={imageUrl} 
                        alt={service.name} 
                        className="w-full aspect-[4/3] object-cover transition-transform duration-500 ease-out group-hover:scale-105" 
                      />
                    </div>
                    <p className="text-xs tracking-widest text-neutral-500 mb-3 uppercase">
                      {getCategoryLabel(service.category)}
                    </p>
                    <h3 className="text-xl font-semibold mb-3 text-black">{service.name}</h3>
                    <p className="text-sm leading-relaxed mb-4 text-[#404040] line-clamp-3">
                      {service.shortDescription || service.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4 pt-4 border-t border-neutral-200">
                      <div>
                        <p className="text-2xl font-bold text-black">${service.price.toLocaleString()}</p>
                        <p className="text-xs text-neutral-500">
                          {service.duration} min{service.pricePerPerson && ' / persona'}
                        </p>
                      </div>
                      <p className="text-sm text-neutral-600">
                        {service.minCapacity}-{service.maxCapacity} pers.
                      </p>
                    </div>

                    <button 
                      onClick={() => handleBookService(service)}
                      className="block w-full bg-white border border-[#404040] hover:bg-[#404040] text-[#404040] hover:text-white text-center font-medium py-2 px-4 rounded-[30px] transition text-sm"
                    >
                      Reservar ahora
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-600">No hay servicios disponibles en este momento</p>
            </div>
          )}
        </div>
      </section>

      <Footer />

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}