'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { getRoomTypeLabel, getTodayDateString } from '@/lib/utils';

interface Room {
  id: string;
  number: string;
  type: string;
  price: number;
  capacity: number;
  floor: number;
  amenities: string[];
  images: string[];
  description: string | null;
  status: string;
  nights: number;
  totalPrice: number;
}

interface SearchParams {
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number | null;
  type: string;
}

export default function SearchRoomsPage() {
  const router = useRouter();
  
  // Estados
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [roomType, setRoomType] = useState('all');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Estilos unificados
  const fieldBase =
    "w-full h-11 px-3 border border-neutral-300 rounded-lg bg-white text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-neutral-300";
  const selectBase =
    fieldBase +
    " appearance-none pr-8 bg-no-repeat bg-[length:12px_12px] " +
    "bg-[right_0.75rem_center] " +
    "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")]";

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams({
        checkIn,
        checkOut,
        guests: guests.toString(),
        ...(roomType !== 'all' && { type: roomType }),
      });

      const response = await fetch(`/api/rooms/availability?${params}`);
      const data = await response.json();

      if (response.ok) {
        setRooms(data.rooms);
        setSearchParams(data.searchParams);
      } else {
        setError(data.error || 'Error al buscar habitaciones');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Obtener fecha de hoy usando la función del utils
  const today = getTodayDateString();

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />

      <section className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-black mb-2">Buscar Habitaciones</h1>
          <div className="h-px w-20 bg-black/20 mb-2" />
          <p className="text-neutral-600">Encuentra la habitación perfecta para tu estadía</p>
        </div>

        {/* Formulario de búsqueda */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-neutral-300">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Check-in</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={today}
                required
                className={fieldBase + " [&::-webkit-date-and-time-value]:text-black"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Check-out</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || today}
                required
                className={fieldBase + " [&::-webkit-date-and-time-value]:text-black"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Huéspedes</label>
              <select
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                className={selectBase}
              >
                {[1, 2, 3, 4].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'persona' : 'personas'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Tipo de habitación</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className={selectBase}
              >
                <option value="all">Todas</option>
                <option value="SUITE_SINGLE">Suite Individual</option>
                <option value="SUITE_DOUBLE">Suite Doble</option>
                <option value="VILLA_PETIT">Villa Petit</option>
                <option value="VILLA_GRANDE">Villa Grande</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#ffffff] text-[#404040] border border-[#404040] hover:bg-[#404040] hover:text-[#ffffff] transition-all duration-300 font-medium px-4 rounded-[30px] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Información de búsqueda */}
        {searchParams && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              Mostrando {rooms.length} habitación(es) disponible(s) para {searchParams.nights}{' '}
              {searchParams.nights === 1 ? 'noche' : 'noches'}
              {searchParams.guests && ` · ${searchParams.guests} ${searchParams.guests === 1 ? 'huésped' : 'huéspedes'}`}
            </p>
          </div>
        )}

        {/* Resultados */}
        {searched && !loading && (
          <>
            {rooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                  >
                    <div className="h-48 bg-neutral-200 relative">
                      {room.images.length > 0 ? (
                        <img
                          src={room.images[0]}
                          alt={`Habitación ${room.number}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          Sin imagen
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded-full">
                        <p className="text-xs font-medium text-black">#{room.number}</p>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-black mb-1">
                            {getRoomTypeLabel(room.type)}
                          </h3>
                          <p className="text-sm text-neutral-600">
                            Piso {room.floor} · Hasta {room.capacity}{' '}
                            {room.capacity === 1 ? 'persona' : 'personas'}
                          </p>
                        </div>
                      </div>

                      {room.description && (
                        <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                          {room.description}
                        </p>
                      )}

                      <div className="mb-4">
                        <p className="text-xs text-neutral-500 mb-2">Comodidades:</p>
                        <div className="flex flex-wrap gap-1">
                          {room.amenities.slice(0, 4).map((amenity, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-neutral-100 px-2 py-1 rounded"
                            >
                              {amenity}
                            </span>
                          ))}
                          {room.amenities.length > 4 && (
                            <span className="text-xs text-neutral-500 px-2 py-1">
                              +{room.amenities.length - 4} más
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-neutral-200 pt-4">
                        <div className="flex items-end justify-between mb-3">
                          <div>
                            <p className="text-xs text-neutral-500">
                              ${room.price.toLocaleString()} x {room.nights}{' '}
                              {room.nights === 1 ? 'noche' : 'noches'}
                            </p>
                            <p className="text-2xl font-bold text-black">
                              ${room.totalPrice.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/reservations/new?roomId=${room.id}&checkIn=${searchParams?.checkIn}&checkOut=${searchParams?.checkOut}&guests=${guests}`}
                          className="block w-full bg-white border border-[#404040] hover:bg-[#404040] text-[#404040] hover:text-white text-center font-medium py-2 px-4 rounded-[30px] transition text-sm"
                        >
                          Reservar ahora
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                <svg
                  className="mx-auto h-12 w-12 text-neutral-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <p className="text-neutral-600 text-lg mb-2">
                  No hay habitaciones disponibles
                </p>
                <p className="text-neutral-500 text-sm">
                  Intenta con otras fechas o menos huéspedes
                </p>
              </div>
            )}
          </>
        )}

        {!searched && (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <svg
              className="mx-auto h-12 w-12 text-neutral-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-neutral-600 text-lg">
              Ingresa tus fechas para buscar habitaciones disponibles
            </p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}