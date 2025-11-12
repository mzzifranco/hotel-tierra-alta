// src/components/analytics/RevenueFilters.tsx
'use client';

import { useState } from 'react';

// Exportar el tipo FilterValues
export interface FilterValues {
  startDate: string;
  endDate: string;
  serviceType: 'ALL' | 'SPA' | 'EXPERIENCE';
  category: string;
}

interface RevenueFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  onExport?: () => void;
}

const selectBase = "w-full h-11 px-4 rounded-lg border text-sm font-medium transition-all duration-300 ease-in-out focus:outline-none appearance-none pr-8 bg-no-repeat bg-[length:12px_12px] bg-[right_0.75rem_center] bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")] border-neutral-300 text-neutral-900 bg-white focus:ring-2 focus:ring-neutral-400 focus:border-transparent cursor-pointer hover:border-neutral-400";

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

export default function RevenueFilters({ onFilterChange, onExport }: RevenueFiltersProps) {
  // Cargar filtros desde localStorage al inicializar
  const [filters, setFilters] = useState<FilterValues>(loadFiltersFromStorage);

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    const newFilters = { 
      ...filters, 
      [key]: value 
    } as FilterValues;
    
    setFilters(newFilters);
    
    // Guardar en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFilters));
    }
    
    // Notificar al padre
    onFilterChange(newFilters);
  };

  const handleQuickFilter = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const newFilters: FilterValues = {
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
    
    setFilters(newFilters);
    
    // Guardar en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFilters));
    }
    
    // Notificar al padre
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

        {/* Tipo de servicio */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Tipo de servicio
          </label>
          <select
            value={filters.serviceType}
            onChange={(e) => handleFilterChange('serviceType', e.target.value as FilterValues['serviceType'])}
            className={selectBase}
          >
            <option value="ALL">Todos</option>
            <option value="SPA">Spa</option>
            <option value="EXPERIENCE">Experiencias</option>
          </select>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Categoría
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className={selectBase}
          >
            <option value="ALL">Todas</option>
            <optgroup label="Spa">
              <option value="SPIRITUAL_ILLUMINATION">Iluminación Espiritual</option>
              <option value="PHYSICAL_OPTIMISATION">Optimización Física</option>
              <option value="MENTAL_EQUILIBRIUM">Equilibrio Mental</option>
            </optgroup>
            <optgroup label="Experiencias">
              <option value="CULINARY_EXPERIENCE">Experiencia Culinaria</option>
              <option value="NATURE_CULTURE">Naturaleza y Cultura</option>
              <option value="WINE_EXPERIENCE">Experiencia Vinos</option>
              <option value="RELAXATION_NATURE">Relajación y Naturaleza</option>
            </optgroup>
          </select>
        </div>
      </div>
    </div>
  );
}

// Utilidades
function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0];
}