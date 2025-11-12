// src/components/analytics/RevenueMetricsCards.tsx
'use client';

interface MetricsCardsProps {
  totalRevenue: number;
  totalBookings: number;
  averageRevenuePerBooking: number;
  comparisonData?: {
    revenueDiff: number;
    bookingsDiff: number;
  };
}

export default function RevenueMetricsCards({ 
  totalRevenue, 
  totalBookings, 
  averageRevenuePerBooking,
  comparisonData 
}: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
          {comparisonData ? (
            <div className="flex items-center gap-2">
              {comparisonData.revenueDiff >= 0 ? (
                <span className="text-xs text-green-700 font-medium">
                  ↑ +{comparisonData.revenueDiff.toFixed(1)}% vs anterior
                </span>
              ) : (
                <span className="text-xs text-red-700 font-medium">
                  ↓ {comparisonData.revenueDiff.toFixed(1)}% vs anterior
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-neutral-500">
              ARS {totalRevenue.toLocaleString('es-AR')}
            </p>
          )}
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
          {comparisonData ? (
            <div className="flex items-center gap-2">
              {comparisonData.bookingsDiff >= 0 ? (
                <span className="text-xs text-green-700 font-medium">
                  ↑ +{comparisonData.bookingsDiff.toFixed(1)}% vs anterior
                </span>
              ) : (
                <span className="text-xs text-red-700 font-medium">
                  ↓ {comparisonData.bookingsDiff.toFixed(1)}% vs anterior
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-neutral-500">
              Reservas de servicios
            </p>
          )}
        </div>
      </div>

      {/* Promedio por Reserva */}
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
            Ticket promedio
          </p>
        </div>
      </div>
    </div>
  );
}