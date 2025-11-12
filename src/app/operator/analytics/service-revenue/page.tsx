// src/app/operator/analytics/service-revenue/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RevenueFilters, { type FilterValues } from '@/components/analytics/RevenueFilters';
import RevenueMetricsCards from '@/components/analytics/RevenueMetricsCards';
import {
  RevenueByServiceChart,
  RevenueByTypeChart,
  RevenueByCategoryChart,
  RevenueTrendChart,
  TopServicesTable,
} from '@/components/analytics/ServiceRevenueCharts';

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalBookings: number;
    averageRevenuePerBooking: number;
    dateRange: {
      start: string | null;
      end: string | null;
    };
  };
  byService: any[];
  byType: any[];
  byCategory: any[];
  monthlyTrend: any[];
  dailyTrend: any[];
  topServices: any[];
}

const STORAGE_KEY = 'revenue_filters';

// Función para cargar filtros desde localStorage
function loadFiltersFromStorage(): FilterValues {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved filters:', e);
      }
    }
  }
  return {
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
    serviceType: 'ALL',
    category: 'ALL',
  };
}

export default function ServiceRevenueAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar filtros desde localStorage al inicializar
  const [filters, setFilters] = useState<FilterValues>(loadFiltersFromStorage);
  
  // Ref para evitar carga duplicada en el montaje
  const isInitialMount = useRef(true);

  // Manejar cambio de filtros
  const handleFilterChange = (newFilters: FilterValues) => {
    console.log('Filtros actualizados:', newFilters);
    setFilters(newFilters);
  };

  // Cargar datos cuando cambien los filtros
  useEffect(() => {
    // En el primer render, cargar inmediatamente
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadAnalytics();
    } else {
      // Para cambios subsecuentes, cargar con los nuevos filtros
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);
      
      if (filters.serviceType !== 'ALL') {
        params.append('serviceType', filters.serviceType);
      }
      
      if (filters.category !== 'ALL') {
        params.append('category', filters.category);
      }

      const response = await fetch(`/api/operator/analytics/service-revenue?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return;

    const csvData = data.byService.map((service: any) => ({
      Servicio: service.serviceName,
      Tipo: service.type,
      Categoría: service.category,
      'Ingresos Totales': service.totalRevenue,
      'Cantidad Reservas': service.bookingCount,
      'Promedio por Reserva': service.averageRevenue.toFixed(2),
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ingresos-servicios-${filters.startDate}-${filters.endDate}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3eee7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando estadísticas...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f3eee7]">
        <Header />
        <section className="mx-auto max-w-7xl px-6 pt-24 pb-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-red-800 font-semibold mb-2">Error al cargar datos</h3>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button
                onClick={loadAnalytics}
                className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition text-sm font-medium"
              >
                Reintentar
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  if (!data) {
    return null;
  }

  const daysDiff = Math.floor(
    (new Date(filters.endDate).getTime() - new Date(filters.startDate).getTime()) / 
    (1000 * 60 * 60 * 24)
  );
  const showDailyChart = daysDiff <= 31;

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />
      
      <section className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-black mb-2">
            Análisis de Ingresos por Servicios
          </h1>
          <div className="h-px w-20 bg-black/20 mb-2" />
          <p className="text-neutral-600">
            Visualiza y analiza los ingresos generados por servicios de Spa y Experiencias
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-6">
          <RevenueFilters 
            onFilterChange={handleFilterChange}
            onExport={handleExport}
          />
        </div>

        {/* KPIs */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-black mb-4">Resumen de Ingresos</h2>
          <RevenueMetricsCards
            totalRevenue={data.summary.totalRevenue}
            totalBookings={data.summary.totalBookings}
            averageRevenuePerBooking={data.summary.averageRevenuePerBooking}
          />
        </div>

        {/* Sin datos */}
        {data.summary.totalBookings === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <svg 
              className="w-16 h-16 text-yellow-400 mx-auto mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            <p className="text-neutral-600 text-sm">
              No hay datos disponibles para las condiciones seleccionadas
            </p>
          </div>
        )}

        {/* Gráficos */}
        {data.summary.totalBookings > 0 && (
          <div className="space-y-8">
            {/* Top Services */}
            {data.topServices.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-black mb-4">Servicios más Solicitados</h2>
                <TopServicesTable data={data.topServices} />
              </div>
            )}

            {/* Gráficos por Tipo y Categoría */}
            <div>
              <h2 className="text-xl font-semibold text-black mb-4">Distribución de Ingresos</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.byType.length > 0 && (
                  <RevenueByTypeChart data={data.byType} />
                )}
                {data.byCategory.length > 0 && (
                  <RevenueByCategoryChart data={data.byCategory} />
                )}
              </div>
            </div>

            {/* Tendencia de Ingresos */}
            {(data.monthlyTrend.length > 0 || data.dailyTrend.length > 0) && (
              <div>
                <h2 className="text-xl font-semibold text-black mb-4">Tendencia de Ingresos</h2>
                <RevenueTrendChart 
                  monthlyData={data.monthlyTrend}
                  dailyData={data.dailyTrend}
                />
              </div>
            )}

            {/* Ingresos por Servicio */}
            {data.byService.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-black mb-4">Ingresos por Servicio Individual</h2>
                <RevenueByServiceChart data={data.byService} />
              </div>
            )}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}

function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0];
}