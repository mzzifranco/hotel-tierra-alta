'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  formatShortDate,
  formatPrice,
  getRoomTypeLabel,
  getServiceTypeLabel,
  getServiceCategoryLabel,
  formatDuration,
  formatServiceTime,
} from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  type: string;
  category: string;
  price: number;
  pricePerPerson: boolean;
  duration: number;
  minCapacity: number;
  maxCapacity: number;
  mainImage: string;
}

interface Reservation {
  id: string;
  checkIn: string;
  checkOut: string;
  status: string;
  room: {
    number: string;
    type: string;
  };
}

interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  available: number;
}

export default function BookServicePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [service, setService] = useState<Service | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(true);

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Form state
  const [selectedReservationId, setSelectedReservationId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [participants, setParticipants] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      loadServiceFromStorage();
      fetchActiveReservations();
    }
  }, [status]);

  useEffect(() => {
    if (bookingDate && service) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
      setBookingTime('');
    }
  }, [bookingDate, service]);

  const loadServiceFromStorage = () => {
    const storedService = localStorage.getItem('selectedService');
    if (storedService) {
      const parsedService = JSON.parse(storedService);
      setService(parsedService);
      setParticipants(parsedService.minCapacity);
    } else {
      router.push('/wellbeing');
    }
  };

  const fetchActiveReservations = async () => {
    try {
      const response = await fetch('/api/reservations/active');
      const data = await response.json();

      if (response.ok) {
        setReservations(data.reservations);
        if (data.reservations.length > 0) {
          setSelectedReservationId(data.reservations[0].id);
        }
      } else {
        setError(data.error || 'Error al cargar reservas');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoadingReservations(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!service || !bookingDate) return;

    setLoadingSlots(true);
    try {
      const response = await fetch(
        `/api/services/${service.id}/available-slots?date=${bookingDate}`
      );
      const data = await response.json();

      if (response.ok) {
        setAvailableSlots(data.slots || []);
        if (bookingTime && !data.slots.find((s: TimeSlot) => s.startTime === bookingTime)) {
          setBookingTime('');
        }
      } else {
        console.error('Error al cargar slots:', data.error);
        setAvailableSlots([]);
      }
    } catch (err) {
      console.error('Error al cargar slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/services/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service?.id,
          reservationId: selectedReservationId,
          bookingDate,
          bookingTime,
          participants,
          specialRequests: specialRequests.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem('selectedService');
        router.push(`/services/${data.booking.id}?success=true`);
      } else {
        setError(data.error || 'Error al crear la reserva');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotal = () => {
    if (!service) return 0;
    return service.pricePerPerson ? service.price * participants : service.price;
  };

  const selectedReservation = reservations.find(r => r.id === selectedReservationId);

  const getDateRange = () => {
    if (!selectedReservation) return { min: '', max: '' };
    
    const checkIn = new Date(selectedReservation.checkIn);
    const checkOut = new Date(selectedReservation.checkOut);
    
    const min = checkIn.toISOString().split('T')[0];
    
    checkOut.setDate(checkOut.getDate() - 1);
    const max = checkOut.toISOString().split('T')[0];
    
    return { min, max };
  };

  if (status === 'loading' || loadingReservations) {
    return (
      <main className="min-h-screen bg-[#f3eee7]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-neutral-600">Cargando...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!service) {
    return (
      <main className="min-h-screen bg-[#f3eee7]">
        <Header />
        <div className="mx-auto max-w-3xl px-6 pt-24 pb-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 mb-4">No se ha seleccionado ningún servicio</p>
            <Link
              href="/wellbeing"
              className="inline-block bg-black text-white px-6 py-2 rounded-lg hover:bg-neutral-800 transition"
            >
              Ver servicios disponibles
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (reservations.length === 0) {
    return (
      <main className="min-h-screen bg-[#f3eee7]">
        <Header />
        <div className="mx-auto max-w-3xl px-6 pt-24 pb-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center mb-6">
            <h2 className="text-xl font-semibold text-yellow-900 mb-2">
              Necesitas una reserva de habitación
            </h2>
            <p className="text-yellow-800">
              Para reservar este servicio, primero debes tener una reserva de habitación activa.
            </p>
          </div>
          
          <div className="text-center">
            <Link
              href="/rooms/search"
              className="inline-block bg-[#f3eee7] border border-[#404040] hover:bg-[#404040] hover:text-[#ffffff] hover:border-[#404040] text-sm text-[#404040] hover:text-white font-medium py-2 px-12 rounded-[30px] transition-colors duration-300"
            >
              Reservar habitación
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const dateRange = getDateRange();

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />

      <section className="mx-auto max-w-5xl px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-black mb-2">Confirmar Reserva de Servicio</h1>
          <div className="h-px w-20 bg-black/20 mb-2" />
          <p className="text-neutral-600">Revisa los detalles antes de confirmar</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Reserva de habitación asociada */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Reserva de habitación asociada
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Selecciona tu reserva de habitación
                    </label>
                    <select
                      value={selectedReservationId}
                      onChange={(e) => {
                        setSelectedReservationId(e.target.value);
                        setBookingDate('');
                        setBookingTime('');
                      }}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 bg-white text-neutral-900 appearance-none cursor-pointer hover:border-neutral-400 transition-colors"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                      required
                    >
                      {reservations.map((res) => (
                        <option key={res.id} value={res.id}>
                          Habitación #{res.room.number} - {formatShortDate(res.checkIn)} a {formatShortDate(res.checkOut)}
                        </option>
                      ))}
                    </select>
                    {selectedReservation && (
                      <p className="mt-2 text-xs text-neutral-500">
                        {getRoomTypeLabel(selectedReservation.room.type)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Detalles del servicio */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Detalles del servicio
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Fecha del servicio
                      </label>
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => {
                          setBookingDate(e.target.value);
                          setBookingTime('');
                        }}
                        min={dateRange.min}
                        max={dateRange.max}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 bg-white text-neutral-900 cursor-pointer hover:border-neutral-400 transition-colors"
                        required
                      />
                      {selectedReservation && (
                        <p className="text-xs text-neutral-500 mt-2">
                          Debe estar dentro de tu estadía
                        </p>
                      )}
                    </div>

                    {/* Selector de horarios con slots */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Horario disponible
                      </label>
                      {!bookingDate ? (
                        <div className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-500 text-sm flex items-center">
                          Selecciona una fecha primero
                        </div>
                      ) : loadingSlots ? (
                        <div className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-600 text-sm flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                          Cargando horarios...
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <>
                          <select
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 bg-white text-neutral-900 appearance-none cursor-pointer hover:border-neutral-400 transition-colors"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                              backgroundPosition: 'right 0.5rem center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '1.5em 1.5em',
                              paddingRight: '2.5rem'
                            }}
                            required
                          >
                            <option value="">Selecciona un horario</option>
                            {availableSlots.map((slot) => (
                              <option 
                                key={slot.id} 
                                value={slot.startTime}
                                disabled={slot.available < participants}
                              >
                                {slot.startTime} - {slot.endTime} ({slot.available} {slot.available === 1 ? 'lugar' : 'lugares'} disponibles)
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-neutral-500 mt-2">
                            Duración: {formatDuration(service.duration)}
                          </p>
                        </>
                      ) : (
                        <div className="w-full px-4 py-2 border border-amber-300 bg-amber-50 rounded-lg text-amber-700 text-sm">
                          No hay horarios disponibles para esta fecha
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Número de participantes
                    </label>
                    <input
                      type="number"
                      value={participants}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setParticipants(value);
                        if (bookingTime) {
                          const selectedSlot = availableSlots.find(s => s.startTime === bookingTime);
                          if (selectedSlot && selectedSlot.available < value) {
                            setBookingTime('');
                          }
                        }
                      }}
                      min={service.minCapacity}
                      max={service.maxCapacity}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400"
                      required
                    />
                    <p className="text-xs text-neutral-500 mt-2">
                      Mínimo: {service.minCapacity} · Máximo: {service.maxCapacity}
                    </p>
                  </div>
                </div>
              </div>

              {/* Solicitudes especiales */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Solicitudes especiales (opcional)
                </h2>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Ej: Preferencias dietéticas, nivel de experiencia, necesidades especiales, etc."
                  rows={4}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 resize-none"
                />
                <p className="text-xs text-neutral-500 mt-2">
                  Haremos lo posible por cumplir tus solicitudes, aunque no podemos garantizarlas.
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting || !bookingTime}
                  className="flex-1 bg-green-100 border border-green-200 text-green-700 hover:bg-green-200 text-center font-medium py-3 px-6 rounded-[30px] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Procesando...' : 'Confirmar reserva'}
                </button>
                <Link
                  href="/wellbeing"
                  className="flex-1 bg-red-100 border border-red-300 text-red-700 hover:bg-red-200 text-center font-medium py-3 px-6 rounded-[30px] transition"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-black mb-4">Resumen</h2>

              {/* Imagen del servicio */}
              <div className="h-40 bg-neutral-200 rounded-lg mb-4 overflow-hidden">
                {service.mainImage ? (
                  <img
                    src={service.mainImage}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    Sin imagen
                  </div>
                )}
              </div>

              {/* Detalles del servicio */}
              <div className="mb-4">
                <h3 className="font-semibold text-black text-lg">
                  {service.name}
                </h3>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-neutral-100 px-2 py-1 rounded">
                    {getServiceTypeLabel(service.type)}
                  </span>
                  <span className="text-xs bg-neutral-100 px-2 py-1 rounded">
                    {getServiceCategoryLabel(service.category)}
                  </span>
                </div>
              </div>

              {/* Descripción */}
              <div className="mb-6">
                <p className="text-sm text-neutral-600">
                  {service.shortDescription}
                </p>
              </div>

              {/* Desglose de precio */}
              <div className="border-t border-neutral-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">
                    ${service.price.toLocaleString()}{service.pricePerPerson ? ' / persona' : ''}
                  </span>
                  <span className="text-neutral-900">
                    ${service.price.toLocaleString()}
                  </span>
                </div>
                {service.pricePerPerson && participants > 1 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">
                      x {participants} {participants === 1 ? 'persona' : 'personas'}
                    </span>
                    <span className="text-neutral-900">
                      ${(service.price * participants).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Tarifa de servicio</span>
                  <span className="text-neutral-900">$0</span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-neutral-300 mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-black">Total</span>
                  <span className="text-2xl font-bold text-black">
                    {formatPrice(calculateTotal())}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  El pago se realizará después de confirmar la reserva
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}