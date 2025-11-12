/**
 * Formatea un precio en pesos argentinos
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convierte un string de fecha a objeto Date local (sin problemas de zona horaria)
 * Esta función evita que JavaScript interprete las fechas como UTC
 */
function parseLocalDate(dateString: string | Date): Date {
  // Si ya es un objeto Date, devolverlo
  if (dateString instanceof Date) return dateString;
  
  // Extraer año, mes y día del string (formato: "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss")
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  
  // Crear fecha local (mes es 0-indexed en JavaScript)
  return new Date(year, month - 1, day);
}

/**
 * Formatea una fecha en español
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = parseLocalDate(date);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return dateObj.toLocaleDateString('es-AR', options || defaultOptions);
}

/**
 * Formatea una fecha corta
 */
export function formatShortDate(date: Date | string): string {
  const dateObj = parseLocalDate(date);
  return dateObj.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Calcula el número de noches entre dos fechas
 */
export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const start = parseLocalDate(checkIn);
  const end = parseLocalDate(checkOut);
  
  // Calcular diferencia en milisegundos y convertir a días
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD (fecha local, sin zona horaria)
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene la fecha de mañana en formato YYYY-MM-DD
 */
export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Traduce el tipo de habitación
 */
export function getRoomTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    SUITE_SINGLE: 'Suite Individual',
    SUITE_DOUBLE: 'Suite Doble',
    VILLA_PETIT: 'Villa Petit',
    VILLA_GRANDE: 'Villa Grande',
  };
  return labels[type] || type;
}

/**
 * Traduce el estado de la reserva
 */
export function getReservationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendiente de pago',
    CONFIRMED: 'Confirmada',
    CHECKED_IN: 'En curso',
    CHECKED_OUT: 'Finalizada',
    CANCELLED: 'Cancelada',
  };
  return labels[status] || status;
}

/**
 * Retorna la clase CSS según el estado de la reserva
 */
export function getReservationStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
    CONFIRMED: 'bg-green-50 border border-green-200 text-green-800',
    CHECKED_IN: 'bg-blue-50 border border-blue-200 text-blue-800',
    CHECKED_OUT: 'bg-gray-50 border border-gray-200 text-gray-800',
    CANCELLED: 'bg-red-50 border border-red-200 text-red-800',
  };
  return colors[status] || 'bg-gray-50 border border-gray-200 text-gray-800';
}

/**
 * Traduce el estado del pago
 */
export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobado',
    REJECTED: 'Rechazado',
    REFUNDED: 'Reembolsado',
  };
  return labels[status] || status;
}

/**
 * Retorna la clase CSS según el estado del pago
 */
export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
    APPROVED: 'bg-green-50 border border-green-200 text-green-800',
    REJECTED: 'bg-red-50 border border-red-200 text-red-800',
    REFUNDED: 'bg-blue-50 border border-blue-200 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 border border-gray-200 text-gray-800';
}

/**
 * Genera un código de reserva único basado en el ID
 */
export function generateBookingCode(id: string): string {
  // Toma los primeros 8 caracteres del ID y los convierte a mayúsculas
  return id.substring(0, 8).toUpperCase();
}

// ========================================
// UTILIDADES PARA SERVICIOS Y EXPERIENCIAS
// ========================================

/**
 * Convierte el tipo de servicio a etiqueta legible
 */
export function getServiceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    SPA: 'Spa & Wellness',
    EXPERIENCE: 'Experiencia',
  };
  return labels[type] || type;
}

/**
 * Convierte la categoría de servicio a etiqueta legible
 */
export function getServiceCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    // Spa Categories
    SPIRITUAL_ILLUMINATION: 'Meditación & Mindfulness',
    PHYSICAL_OPTIMISATION: 'Entrenamiento & Yoga',
    MENTAL_EQUILIBRIUM: 'Terapias Holísticas',
    
    // Experience Categories
    CULINARY_EXPERIENCE: 'Experiencia Culinaria',
    NATURE_CULTURE: 'Naturaleza & Cultura',
    WINE_EXPERIENCE: 'Experiencia Enológica',
    RELAXATION_NATURE: 'Relajación en Naturaleza',
  };
  return labels[category] || category;
}

/**
 * Convierte el estado de reserva de servicio a etiqueta legible
 */
export function getServiceBookingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmada',
    IN_PROGRESS: 'En progreso',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
    NO_SHOW: 'No asistió',
  };
  return labels[status] || status;
}

/**
 * Retorna las clases CSS para el badge de estado de servicio
 */
export function getServiceBookingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
    IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
    COMPLETED: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
    NO_SHOW: 'bg-neutral-200 text-neutral-700 border-neutral-300',
  };
  return colors[status] || 'bg-neutral-100 text-neutral-600 border-neutral-200';
}

/**
 * Genera un código único para reserva de servicio
 */
export function generateServiceBookingCode(id: string): string {
  const hash = id.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const code = Math.abs(hash).toString(36).toUpperCase().substring(0, 6);
  return `SRV-${code}`;
}

/**
 * Formatea el horario del servicio (ej: "14:00 - 15:30")
 */
export function formatServiceTime(startTime: string, duration: number): string {
  // Parsear la hora de inicio
  const [hours, minutes] = startTime.split(':').map(Number);
  
  // Calcular hora de fin
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0);
  
  const endDate = new Date(startDate.getTime() + duration * 60000);
  
  const endHours = endDate.getHours().toString().padStart(2, '0');
  const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
  
  return `${startTime} - ${endHours}:${endMinutes}`;
}

/**
 * Formatea la duración en formato legible
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
}