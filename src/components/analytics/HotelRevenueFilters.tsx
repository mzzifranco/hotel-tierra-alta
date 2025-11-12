// src/components/analytics/HotelRevenueFilters.tsx
'use client';

import { useState } from 'react';

export interface HotelFilterValues {
  startDate: string;
  endDate: string;
  roomType: 'ALL' | 'SUITE_SINGLE' | 'SUITE_DOUBLE' | 'VILLA_PETIT' | 'VILLA_GRANDE';
  status: 'ALL' | 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
}

interface HotelRevenueFiltersProps {
  onFilterChange: (filters: HotelFilterValues) => void;
  onExport?: () => void;
}

const selectBase = "w-full h-11 px-4 rounded-lg border text-sm font-medium transition-all duration-300 ease-in-out focus:outline-none appearance-none pr-8 bg-no-repeat bg-[length:12px_12px] bg-[right_0.75rem_center] bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")] border-neutral-300 text-neutral-900 bg-white focus:ring-2 focus:ring-neutral-400 focus:border-transparent cursor-pointer hover:border-neutral-400";

const STORAGE_KEY = 'hotel_revenue_filters';

function loadFiltersFromStorage(): HotelFilterValues {
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
    roomType: 'ALL',
    status: 'ALL',
  };
}

export default function HotelRevenueFilters({ onFilterChange, onExport }: HotelRevenueFiltersProps) {
  const [filters, setFilters] = useState<HotelFilterValues>(loadFiltersFromStorage);

  const handleFilterChange = (key: keyof HotelFilterValues, value: string) => {
    const newFilters = { 
      ...filters, 
      [key]: value 
    } as HotelFilterValues;
    
    setFilters(newFilters);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFilters));
    }
    
    onFilterChange(newFilters);
  };

  const handleQuickFilter = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const newFilters: HotelFilterValues = {
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
    
    setFilters(newFilters);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFilters));
    }
    
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-neutral-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-black">Filtros</h3>
        {onExport && (
          <button
            onClick={onExport}
            className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition text-sm font-medium"
          >
            Exportar CSV
          </button>
        )}
      </div>

      {/* Filtros rápidos */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleQuickFilter(7)}
          className="px-4 py-2 text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition"
        >
          Últimos 7 días
        </button>
        <button
          onClick={() => handleQuickFilter(30)}
          className="px-4 py-2 text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition"
        >
          Últimos 30 días
        </button>
        <button
          onClick={() => handleQuickFilter(90)}
          className="px-4 py-2 text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition"
        >
          Últimos 3 meses
        </button>
        <button
          onClick={() => handleQuickFilter(365)}
          className="px-4 py-2 text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition"
        >
          Último año
        </button>
      </div>

      {/* Filtros personalizados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fecha de inicio */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Fecha de inicio
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
          />
        </div>

        {/* Fecha de fin */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Fecha de fin
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
          />
        </div>

        {/* Tipo de habitación */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Tipo de habitación
          </label>
          <select
            value={filters.roomType}
            onChange={(e) => handleFilterChange('roomType', e.target.value as HotelFilterValues['roomType'])}
            className={selectBase}
          >
            <option value="ALL">Todas</option>
            <option value="SUITE_SINGLE">Suite Single</option>
            <option value="SUITE_DOUBLE">Suite Double</option>
            <option value="VILLA_PETIT">Villa Petit</option>
            <option value="VILLA_GRANDE">Villa Grande</option>
          </select>
        </div>

        {/* Estado de reserva */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Estado
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value as HotelFilterValues['status'])}
            className={selectBase}
          >
            <option value="ALL">Todos</option>
            <option value="CONFIRMED">Confirmada</option>
            <option value="CHECKED_IN">Check-in</option>
            <option value="CHECKED_OUT">Check-out</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
        </div>
      </div>
    </div>
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