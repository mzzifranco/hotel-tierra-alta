import { HotelService } from '@prisma/client';

export interface TimeSlot {
  time: string;
  available: boolean;
  spotsLeft: number;
}

/**
 * Genera slots de tiempo disponibles para un servicio en una fecha específica
 */
export function generateTimeSlots(
  service: HotelService,
  date: Date,
  existingBookings: Array<{ bookingTime: string; participants: number }>
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

  // Verificar si el servicio está disponible ese día
  if (!service.availableDays.includes(dayOfWeek)) {
    return [];
  }

  // Parsear horas de inicio y fin
  const [startHour, startMinute] = service.startTime.split(':').map(Number);
  const [endHour, endMinute] = service.endTime.split(':').map(Number);

  let currentTime = startHour * 60 + startMinute; // minutos desde medianoche
  const endTime = endHour * 60 + endMinute;

  while (currentTime + service.duration <= endTime) {
    const hours = Math.floor(currentTime / 60);
    const minutes = currentTime % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Calcular cuántos lugares quedan en este slot
    const bookingsAtThisTime = existingBookings.filter(
      (b) => b.bookingTime === timeString
    );
    const bookedSpots = bookingsAtThisTime.reduce(
      (sum, b) => sum + b.participants,
      0
    );
    const spotsLeft = service.maxCapacity - bookedSpots;

    slots.push({
      time: timeString,
      available: spotsLeft > 0,
      spotsLeft,
    });

    currentTime += service.slotInterval;
  }

  return slots;
}

/**
 * Verifica si hay disponibilidad para una reserva específica
 */
export function checkAvailability(
  service: HotelService,
  date: Date,
  time: string,
  participants: number,
  existingBookings: Array<{ bookingTime: string; participants: number }>
): { available: boolean; message?: string } {
  // Verificar día de la semana
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  if (!service.availableDays.includes(dayOfWeek)) {
    return {
      available: false,
      message: 'El servicio no está disponible este día de la semana',
    };
  }

  // Verificar capacidad mínima y máxima
  if (participants < service.minCapacity) {
    return {
      available: false,
      message: `Se requieren al menos ${service.minCapacity} participantes`,
    };
  }

  if (participants > service.maxCapacity) {
    return {
      available: false,
      message: `El máximo de participantes es ${service.maxCapacity}`,
    };
  }

  // Verificar reservas existentes en ese horario
  const bookingsAtThisTime = existingBookings.filter((b) => b.bookingTime === time);
  const bookedSpots = bookingsAtThisTime.reduce((sum, b) => sum + b.participants, 0);
  const spotsLeft = service.maxCapacity - bookedSpots;

  if (spotsLeft < participants) {
    return {
      available: false,
      message: `Solo quedan ${spotsLeft} lugares disponibles en este horario`,
    };
  }

  // Verificar tiempo de anticipación
  const now = new Date();
  const bookingDateTime = new Date(date);
  const [hours, minutes] = time.split(':').map(Number);
  bookingDateTime.setHours(hours, minutes, 0, 0);

  const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilBooking < service.advanceBookingHours) {
    return {
      available: false,
      message: `Se requiere reservar con al menos ${service.advanceBookingHours} horas de anticipación`,
    };
  }

  return { available: true };
}

/**
 * Calcula el precio total de una reserva de servicio
 */
export function calculateServicePrice(
  service: HotelService,
  participants: number
): number {
  if (service.pricePerPerson) {
    return service.price * participants;
  }
  return service.price;
}

/**
 * Formatea la duración en minutos a un string legible
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

/**
 * Verifica si una fecha está en el pasado
 */
export function isDateInPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
}