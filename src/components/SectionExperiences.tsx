'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function SectionExperiences() {
  const { data: session } = useSession()
  const router = useRouter()
  const [experiences, setExperiences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExperiences()
  }, [])

  const fetchExperiences = async () => {
    try {
      const response = await fetch('/api/hotel-services?type=EXPERIENCE&limit=4')
      const data = await response.json()
      
      if (data.success) {
        setExperiences(data.services || [])
      }
    } catch (error) {
      console.error('Error cargando experiencias:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookExperience = (experience: any) => {
    if (!session) {
      router.push('/auth/login?callbackUrl=/')
      return
    }
    
    localStorage.setItem('selectedService', JSON.stringify(experience))
    router.push('/services/new')
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      CULINARY_EXPERIENCE: 'Experiencia Culinaria',
      NATURE_CULTURE: 'Naturaleza & Cultura',
      WINE_EXPERIENCE: 'Experiencia Enológica',
      RELAXATION_NATURE: 'Relajación en Naturaleza',
    }
    return labels[category] || category.replace(/_/g, ' ')
  }

  return (
    <section id="experiences" className="pt-15 pb-20 px-6 overflow-hidden scroll-mt-15">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-black">Experiences</h2>
          <div className="mx-auto mt-2 h-px w-20 bg-black/20" />
          <p className="mx-auto mt-4 max-w-3xl text-[15px] leading-7 text-[#404040]">
            Descubre actividades únicas que conectan con la esencia de los Valles Calchaquíes, desde talleres gastronómicos hasta recorridos por viñedos históricos.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-neutral-600">Cargando experiencias...</p>
          </div>
        ) : experiences.length > 0 ? (
          <div className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {experiences.map((exp) => {
              const imageUrl = exp.mainImage || exp.images?.[0] || '/placeholder-experience.jpg'
              
              return (
                <article key={exp.id} className="group flex-shrink-0 w-[340px] bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative overflow-hidden mb-6 rounded-lg">
                    <img
                      src={imageUrl}
                      alt={exp.name}
                      className="w-full aspect-[4/3] object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>

                  <p className="text-xs tracking-widest text-neutral-500 mb-3 uppercase">
                    {getCategoryLabel(exp.category)}
                  </p>
                  <h3 className="text-xl font-semibold mb-3 text-black">{exp.name}</h3>
                  <p className="text-sm leading-relaxed mb-4 text-[#404040] line-clamp-3">
                    {exp.shortDescription || exp.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4 pt-4 border-t border-neutral-200">
                    <div>
                      <p className="text-2xl font-bold text-black">${exp.price.toLocaleString()}</p>
                      <p className="text-xs text-neutral-500">
                        {exp.duration} min{exp.pricePerPerson && ' / persona'}
                      </p>
                    </div>
                    <p className="text-sm text-neutral-600">
                      {exp.minCapacity}-{exp.maxCapacity} pers.
                    </p>
                  </div>

                  <button 
                    onClick={() => handleBookExperience(exp)}
                    className="block w-full bg-white border border-[#404040] hover:bg-[#404040] text-[#404040] hover:text-white text-center font-medium py-2 px-4 rounded-[30px] transition text-sm"
                  >
                    Reservar ahora
                  </button>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-neutral-600">No hay experiencias disponibles en este momento</p>
          </div>
        )}

        {/* Botón Contact Us */}
        <div className="mt-12 text-center">
          <a 
            href="/contact"
            className="inline-block bg-[#f3eee7] border border-[#404040] hover:bg-[#404040] hover:text-[#ffffff] hover:border-[#404040] text-sm text-[#404040] hover:text-white font-medium py-2 px-12 rounded-[30px] transition-colors duration-300"
          >
            CONTACT US
          </a>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  )
}