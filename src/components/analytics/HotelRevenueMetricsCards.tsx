// src/components/analytics/HotelRevenueMetricsCards.tsx
'use client';

interface HotelMetricsCardsProps {
  totalRevenue: number;
  totalBookings: number;
  totalNights: number;
  averageRevenuePerBooking: number;
  averageNightsPerBooking: number;
  averageRevenuePerNight: number;
}

export default function HotelRevenueMetricsCards({ 
  totalRevenue, 
  totalBookings, 
  totalNights,
  averageRevenuePerBooking,
  averageNightsPerBooking,
  averageRevenuePerNight,
}: HotelMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* Ingresos Totales */}
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-neutral-100 group">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
              Ingresos Totales
            </p>
            <p className="text-3xl font-bold text-black mb-1">
              ${(totalRevenue / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="bg-neutral-100 p-3 rounded-lg group-hover:bg-neutral-200 transition-colors duration-200">
            <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="pt-2 border-t border-neutral-100">
          <p className="text-xs text-neutral-500">
            ARS {totalRevenue.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* Total de Reservas */}
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-neutral-100 group">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
              Total de Reservas
            </p>
            <p className="text-3xl font-bold text-black mb-1">
              {totalBookings}
            </p>
          </div>
          <div className="bg-neutral-100 p-3 rounded-lg group-hover:bg-neutral-200 transition-colors duration-200">
            <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div className="pt-2 border-t border-neutral-100">
          <p className="text-xs text-neutral-500">
            Reservas confirmadas
          </p>
        </div>
      </div>

      {/* Noches Totales */}
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-neutral-100 group">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
              Noches Totales
            </p>
            <p className="text-3xl font-bold text-black mb-1">
              {totalNights}
            </p>
          </div>
          <div className="bg-neutral-100 p-3 rounded-lg group-hover:bg-neutral-200 transition-colors duration-200">
            <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
        </div>
        <div className="pt-2 border-t border-neutral-100">
          <p className="text-xs text-neutral-500">
            Promedio: {averageNightsPerBooking.toFixed(1)} noches/reserva
          </p>
        </div>
      </div>

      {/* Ingreso Promedio por Reserva */}
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-neutral-100 group">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
              Promedio por Reserva
            </p>
            <p className="text-3xl font-bold text-black mb-1">
              ${(averageRevenuePerBooking / 1000).toFixed(1)}K
            </p>
          </div>
          <div className="bg-neutral-100 p-3 rounded-lg group-hover:bg-neutral-200 transition-colors duration-200">
            <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <div className="pt-2 border-t border-neutral-100">
          <p className="text-xs text-neutral-500">
            Ticket promedio por reserva
          </p>
        </div>
      </div>

      {/* Ingreso Promedio por Noche */}
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-neutral-100 group">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
              Promedio por Noche
            </p>
            <p className="text-3xl font-bold text-black mb-1">
              ${(averageRevenuePerNight / 1000).toFixed(1)}K
            </p>
          </div>
          <div className="bg-neutral-100 p-3 rounded-lg group-hover:bg-neutral-200 transition-colors duration-200">
            <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        </div>
        <div className="pt-2 border-t border-neutral-100">
          <p className="text-xs text-neutral-500">
            Tarifa diaria promedio
          </p>
        </div>
      </div>

      {/* Duración Promedio de Estadía */}
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-neutral-100 group">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
              Estadía Promedio
            </p>
            <p className="text-3xl font-bold text-black mb-1">
              {averageNightsPerBooking.toFixed(1)}
            </p>
          </div>
          <div className="bg-neutral-100 p-3 rounded-lg group-hover:bg-neutral-200 transition-colors duration-200">
            <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="pt-2 border-t border-neutral-100">
          <p className="text-xs text-neutral-500">
            Noches por reserva
          </p>
        </div>
      </div>
    </div>
  );
}