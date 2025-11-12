'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

interface HotelService {
  id: string;
  name: string;
  type: string;
  category: string;
  price: number;
  pricePerPerson: boolean;
  duration: number;
  minCapacity: number;
  maxCapacity: number;
  isActive: boolean;
  mainImage: string | null;
  images: string[];
  description: string;
  shortDescription: string | null;
  createdAt: string;
}

interface ServiceBooking {
  id: string;
  bookingDate: string;
  bookingTime: string;
  participants: number;
  totalPrice: number;
  status: string;
  specialRequests: string | null;
  staffNotes: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
  service: {
    id: string;
    name: string;
    type: string;
  };
  reservation: {
    id: string;
    room: {
      number: string;
      type: string;
    };
  };
  payment?: {
    id: string;
    amount: number;
    status: string;
    paymentMethod: string | null;
  } | null;
}

const fieldBase = "w-full h-11 px-4 rounded-lg border text-sm transition-all duration-300 ease-in-out focus:outline-none";
const selectBase = fieldBase + " appearance-none pr-8 bg-no-repeat bg-[length:12px_12px] bg-[right_0.75rem_center] bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")] border-neutral-300 text-neutral-900 bg-white focus:ring-2 focus:ring-neutral-400 focus:border-transparent";

const formatPrice = (price: number) => `$${price.toLocaleString('es-AR')}`;
const formatDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const getServiceTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    SPA: 'Spa',
    EXPERIENCE: 'Experiencia',
  };
  return labels[type] || type;
};

const getServiceCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    SPIRITUAL_ILLUMINATION: 'Meditación & Mindfulness',
    PHYSICAL_OPTIMISATION: 'Entrenamiento & Yoga',
    MENTAL_EQUILIBRIUM: 'Terapias Holísticas',
    CULINARY_EXPERIENCE: 'Experiencia Culinaria',
    NATURE_CULTURE: 'Naturaleza & Cultura',
    WINE_EXPERIENCE: 'Experiencia Enológica',
    RELAXATION_NATURE: 'Relajación en Naturaleza',
  };
  return labels[category] || category;
};

const getBookingStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    CONFIRMED: 'bg-blue-50 border-blue-200 text-blue-800',
    IN_PROGRESS: 'bg-purple-50 border-purple-200 text-purple-800',
    COMPLETED: 'bg-green-50 border-green-200 text-green-800',
    CANCELLED: 'bg-red-50 border-red-200 text-red-800',
    NO_SHOW: 'bg-gray-50 border-gray-200 text-gray-800',
  };
  return colors[status] || 'bg-neutral-50 border-neutral-200 text-neutral-800';
};

const getBookingStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmada',
    IN_PROGRESS: 'En progreso',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
    NO_SHOW: 'No asistió',
  };
  return labels[status] || status;
};

const getRoomTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    SUITE_SINGLE: 'Suite Simple',
    SUITE_DOUBLE: 'Suite Doble',
    VILLA_PETIT: 'Villa Petit',
    VILLA_GRANDE: 'Villa Grande',
  };
  return labels[type] || type;
};

export default function AdminServicesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Estado de servicios
  const [services, setServices] = useState<HotelService[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<HotelService | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Estado de reservas
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [bookingFilter, setBookingFilter] = useState<string>('all');
  const [bookingServiceFilter, setBookingServiceFilter] = useState<string>('all');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(null);
  const [updating, setUpdating] = useState(false);
  
  const [loading, setLoading] = useState(true);

// 🆕 Estados para gestión de TimeSlots
const [selectedServiceForSlots, setSelectedServiceForSlots] = useState<string>('');
const [slots, setSlots] = useState<any[]>([]);
const [slotsStats, setSlotsStats] = useState<any>(null);
const [loadingSlots, setLoadingSlots] = useState(false);
const [slotDateRange, setSlotDateRange] = useState({
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
});
const [generatingSlots, setGeneratingSlots] = useState(false);
const [showGenerateModal, setShowGenerateModal] = useState(false);
const [generateDateRange, setGenerateDateRange] = useState({
  startDate: slotDateRange.startDate,
  endDate: slotDateRange.endDate,
});
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'SPA',
    category: 'SPIRITUAL_ILLUMINATION',
    price: '',
    pricePerPerson: true,
    duration: '',
    minCapacity: '1',
    maxCapacity: '',
    description: '',
    shortDescription: '',
    images: '',
    mainImage: '',
    isActive: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role !== 'ADMIN' && user?.role !== 'OPERATOR') {
        router.push('/');
      } else {
        fetchAllData();
      }
    }
  }, [status, router, session]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchServices(), fetchBookings()]);
    setLoading(false);
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services');
      const data = await response.json();
      if (data.success) setServices(data.services);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/service-bookings');
      const data = await response.json();
      if (data.success) setBookings(data.bookings);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleOpenModal = (service?: HotelService) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        type: service.type,
        category: service.category,
        price: service.price.toString(),
        pricePerPerson: service.pricePerPerson,
        duration: service.duration.toString(),
        minCapacity: service.minCapacity.toString(),
        maxCapacity: service.maxCapacity.toString(),
        description: service.description,
        shortDescription: service.shortDescription || '',
        images: service.images.join(', '),
        mainImage: service.mainImage || '',
        isActive: service.isActive,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        type: 'SPA',
        category: 'SPIRITUAL_ILLUMINATION',
        price: '',
        pricePerPerson: true,
        duration: '',
        minCapacity: '1',
        maxCapacity: '',
        description: '',
        shortDescription: '',
        images: '',
        mainImage: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        category: formData.category,
        price: parseFloat(formData.price),
        pricePerPerson: formData.pricePerPerson,
        duration: parseInt(formData.duration),
        minCapacity: parseInt(formData.minCapacity),
        maxCapacity: parseInt(formData.maxCapacity),
        description: formData.description,
        shortDescription: formData.shortDescription || null,
        images: formData.images.split(',').map(i => i.trim()).filter(i => i),
        mainImage: formData.mainImage || null,
        isActive: formData.isActive,
      };
      const url = editingService ? `/api/admin/services/${editingService.id}` : '/api/admin/services';
      const method = editingService ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        await fetchServices();
        handleCloseModal();
        alert(editingService ? 'Servicio actualizado' : 'Servicio creado');
      } else {
        const data = await response.json();
        alert(data.error || 'Error al guardar servicio');
      }
    } catch (error) {
      alert('Error al guardar servicio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (serviceId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (response.ok) fetchServices();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleBookingStatusChange = async (bookingId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/service-bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setBookings(prev =>
          prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
        );
        setSelectedBooking(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar reserva');
    } finally {
      setUpdating(false);
    }
  };

  const filteredServices = services.filter((service) => {
    const passesType = filter === 'all' || service.type === filter;
    if (!passesType) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return service.name.toLowerCase().includes(query) || service.category.toLowerCase().includes(query);
    }
    return true;
  });


const filteredBookings = bookings.filter((booking) => {
  const passesStatus = bookingFilter === 'all' || booking.status === bookingFilter;
  if (!passesStatus) return false;
  
  const passesService = bookingServiceFilter === 'all' || booking.service.type === bookingServiceFilter;
  if (!passesService) return false;
  
  if (bookingSearchQuery.trim()) {
    const query = bookingSearchQuery.toLowerCase();
    return (
      booking.user.name.toLowerCase().includes(query) ||
      booking.user.email.toLowerCase().includes(query) ||
      booking.service.name.toLowerCase().includes(query)
    );
  }
  return true;
});

  const stats = {
    total: services.length,
    spa: services.filter((s) => s.type === 'SPA').length,
    experience: services.filter((s) => s.type === 'EXPERIENCE').length,
    active: services.filter((s) => s.isActive).length,
    inactive: services.filter((s) => !s.isActive).length,
  };

  const bookingStats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
    inProgress: bookings.filter(b => b.status === 'IN_PROGRESS').length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
    cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
  };

  const servicesWithBookings = [
  {
    id: 'SPA',
    name: 'Spa',
    type: 'SPA',
    bookingCount: bookings.filter(b => b.service.type === 'SPA').length
  },
  {
    id: 'EXPERIENCE',
    name: 'Experiencias',
    type: 'EXPERIENCE',
    bookingCount: bookings.filter(b => b.service.type === 'EXPERIENCE').length
  }
].filter(s => s.bookingCount > 0); // Solo mostrar si tiene reservas
  const tintHex = (hex: string, t = 0.9) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    const [r, g, b] = [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)];
    const mix = (c: number) => Math.round(c + (255 - c) * t);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  };

  const chartData = [
    { name: 'Spa', value: stats.spa, color: '#3b82f6' },
    { name: 'Experiencias', value: stats.experience, color: '#22c55e' },
  ];

  const categories = {
    SPA: [
      { value: 'SPIRITUAL_ILLUMINATION', label: 'Meditación & Mindfulness' },
      { value: 'PHYSICAL_OPTIMISATION', label: 'Entrenamiento & Yoga' },
      { value: 'MENTAL_EQUILIBRIUM', label: 'Terapias Holísticas' },
    ],
    EXPERIENCE: [
      { value: 'CULINARY_EXPERIENCE', label: 'Experiencia Culinaria' },
      { value: 'NATURE_CULTURE', label: 'Naturaleza & Cultura' },
      { value: 'WINE_EXPERIENCE', label: 'Experiencia Enológica' },
      { value: 'RELAXATION_NATURE', label: 'Relajación en Naturaleza' },
    ],
  };

  const availableCategories = categories[formData.type as 'SPA' | 'EXPERIENCE'] || [];

  // Funciones para gestión de TimeSlots
const fetchSlots = async (serviceId: string) => {
  if (!serviceId) return;
  
  setLoadingSlots(true);
  try {
    const params = new URLSearchParams({
      startDate: slotDateRange.startDate,
      endDate: slotDateRange.endDate,
    });

    const response = await fetch(`/api/admin/services/${serviceId}/slots?${params}`);
    const data = await response.json();

    if (data.success) {
      setSlots(data.slots);
      setSlotsStats(data.stats);
    } else {
      alert(data.error || 'Error al cargar slots');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cargar slots');
  } finally {
    setLoadingSlots(false);
  }
};

const handleGenerateSlots = async () => {
  if (!selectedServiceForSlots) {
    alert('Selecciona un servicio primero');
    return;
  }

  setGeneratingSlots(true);
  try {
    const response = await fetch(`/api/admin/services/${selectedServiceForSlots}/generate-slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(generateDateRange),
    });

    const data = await response.json();

    if (response.ok) {
      alert(`✅ ${data.count} slots generados exitosamente`);
      setShowGenerateModal(false);
      
      // 🆕 Actualizar el filtro de fechas con las fechas del modal
      setSlotDateRange({
        startDate: generateDateRange.startDate,
        endDate: generateDateRange.endDate,
      });
      
      // Esto va a disparar el useEffect que recarga los slots
    } else {
      alert(data.error || 'Error al generar slots');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al generar slots');
  } finally {
    setGeneratingSlots(false);
  }
};

const handleToggleSlotAvailability = async (slotId: string, currentStatus: boolean) => {
  if (!selectedServiceForSlots) return;

  try {
    const response = await fetch(`/api/admin/services/${selectedServiceForSlots}/slots/${slotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !currentStatus }),
    });

    const data = await response.json();

    if (response.ok) {
      setSlots(prev => 
        prev.map(slot => 
          slot.id === slotId 
            ? { ...slot, isAvailable: !currentStatus }
            : slot
        )
      );
    } else {
      alert(data.error || 'Error al actualizar slot');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al actualizar slot');
  }
};

const handleChangeSlotCapacity = async (slotId: string, currentCapacity: number) => {
  if (!selectedServiceForSlots) return;

  const newCapacity = prompt(`Capacidad actual: ${currentCapacity}\n\nIngresa la nueva capacidad:`, currentCapacity.toString());
  
  if (!newCapacity || isNaN(parseInt(newCapacity))) return;

  try {
    const response = await fetch(`/api/admin/services/${selectedServiceForSlots}/slots/${slotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capacity: parseInt(newCapacity) }),
    });

    const data = await response.json();

    if (response.ok) {
      setSlots(prev => 
        prev.map(slot => 
          slot.id === slotId 
            ? { ...slot, capacity: data.slot.capacity, available: data.slot.available }
            : slot
        )
      );
    } else {
      alert(data.error || 'Error al actualizar capacidad');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al actualizar capacidad');
  }
};

const getSlotStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    EMPTY: 'bg-green-50 border-green-200 text-green-700',
    PARTIAL: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    FULL: 'bg-red-50 border-red-200 text-red-700',
  };
  return colors[status] || 'bg-neutral-50 border-neutral-200 text-neutral-700';
};

const getSlotStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    EMPTY: 'Vacío',
    PARTIAL: 'Parcial',
    FULL: 'Lleno',
  };
  return labels[status] || status;
};

// useEffect para cargar slots cuando cambia el servicio
useEffect(() => {
  if (selectedServiceForSlots) {
    fetchSlots(selectedServiceForSlots);
  }
}, [selectedServiceForSlots, slotDateRange]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3eee7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3eee7]">
        <Header />
      <section className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-black mb-2">Gestión de Servicios</h1>
          <div className="h-px w-20 bg-black/20 mb-2" />
          <p className="text-neutral-600">Administra servicios de spa y experiencias</p>
        </div>

        {/* SECCIÓN DE SERVICIOS */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-black mb-4">Resumen de Servicios</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-sm text-neutral-600 mb-1">Total</p>
              <p className="text-3xl font-bold text-black">{stats.total}</p>
            </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-sm text-green-700 mb-1">Activos</p>
              <p className="text-3xl font-bold text-green-700">{stats.active}</p>
            </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-sm text-red-700 mb-1">Inactivos</p>
              <p className="text-3xl font-bold text-red-700">{stats.inactive}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-sm text-blue-700 mb-1">Spa</p>
              <p className="text-3xl font-bold text-blue-700">{stats.spa}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <p className="text-sm text-purple-700 mb-1">Experiencias</p>
              <p className="text-3xl font-bold text-purple-700">{stats.experience}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="mb-3">
            <div className="relative">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar servicios..." className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 text-sm" />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded text-xs font-medium ${filter === 'all' ? 'bg-[#404040] text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-[#404040] hover:text-white'}`}>Todos</button>
            <button onClick={() => setFilter('SPA')} className={`px-3 py-1 rounded text-xs font-medium ${filter === 'SPA' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-700 hover:bg-blue-100 hover:text-blue-700'}`}>Spa</button>
            <button onClick={() => setFilter('EXPERIENCE')} className={`px-3 py-1 rounded text-xs font-medium ${filter === 'EXPERIENCE' ? 'bg-purple-100 text-purple-700' : 'bg-neutral-100 text-neutral-700 hover:bg-purple-100 hover:text-purple-700'}`}>Experiencias</button>
            <button onClick={() => handleOpenModal()} className="ml-auto px-3 py-1 bg-neutral-100 text-neutral-700 hover:bg-[#404040] hover:text-white rounded-lg transition text-xs font-medium">+ Nuevo</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
              {service.mainImage && <img src={service.mainImage} alt={service.name} className="w-full h-48 object-cover" />}
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-black mb-1">{service.name}</h3>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs bg-neutral-100 px-2 py-1 rounded">{getServiceTypeLabel(service.type)}</span>
                      <span className="text-xs bg-neutral-100 px-2 py-1 rounded">{getServiceCategoryLabel(service.category)}</span>
                    </div>
                  </div>
                  <button onClick={() => handleToggleActive(service.id, service.isActive)} className={`ml-2 px-2 py-1 text-xs rounded ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {service.isActive ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
                <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{service.shortDescription || service.description}</p>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Precio:</span>
                    <span className="font-medium text-black">{formatPrice(service.price)}{service.pricePerPerson && ' / pers'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Duración:</span>
                    <span className="font-medium text-black">{formatDuration(service.duration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Capacidad:</span>
                    <span className="font-medium text-black">{service.minCapacity}-{service.maxCapacity} pers</span>
                  </div>
                </div>
                <button onClick={() => handleOpenModal(service)} className="w-full px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium rounded transition">Editar</button>
              </div>
            </div>
          ))}
        </div>

        {/* SECCIÓN DE RESERVAS DE SERVICIOS */}
        <div className="border-t-2 border-neutral-300 pt-12 mt-12">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-black mb-2">Reservas de Servicios</h2>
            <div className="h-px w-20 bg-black/20 mb-2" />
            <p className="text-neutral-600">Gestiona las reservas de spa y experiencias</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col h-full">
              <h3 className="text-xl font-semibold text-black mb-4">Resumen de Reservas</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-neutral-600 mb-1">Total</p>
                  <p className="text-3xl font-bold text-black">{bookingStats.total}</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-700 mb-1">Pendientes</p>
                  <p className="text-3xl font-bold text-yellow-700">{bookingStats.pending}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700 mb-1">Confirmadas</p>
                  <p className="text-3xl font-bold text-blue-700">{bookingStats.confirmed}</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-700 mb-1">En progreso</p>
                  <p className="text-3xl font-bold text-purple-700">{bookingStats.inProgress}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 mb-1">Completadas</p>
                  <p className="text-3xl font-bold text-green-700">{bookingStats.completed}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700 mb-1">Canceladas</p>
                  <p className="text-3xl font-bold text-red-700">{bookingStats.cancelled}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-black mb-4">Estado de Reservas</h3>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                {bookingStats.total > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie 
                        data={[
                          { name: 'Pendientes', value: bookingStats.pending, color: '#eab308' },
                          { name: 'Confirmadas', value: bookingStats.confirmed, color: '#3b82f6' },
                          { name: 'En progreso', value: bookingStats.inProgress, color: '#a855f7' },
                          { name: 'Completadas', value: bookingStats.completed, color: '#22c55e' },
                          { name: 'Canceladas', value: bookingStats.cancelled, color: '#ef4444' },
                        ]} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={120} 
                        paddingAngle={0}
                      >
                        {[
                          { name: 'Pendientes', value: bookingStats.pending, color: '#eab308' },
                          { name: 'Confirmadas', value: bookingStats.confirmed, color: '#3b82f6' },
                          { name: 'En progreso', value: bookingStats.inProgress, color: '#a855f7' },
                          { name: 'Completadas', value: bookingStats.completed, color: '#22c55e' },
                          { name: 'Canceladas', value: bookingStats.cancelled, color: '#ef4444' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={tintHex(entry.color, 0.9)} stroke={entry.color} strokeWidth={1} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-neutral-400">No hay datos</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="mb-3">
              <div className="relative">
                <input
                  type="text"
                  value={bookingSearchQuery}
                  onChange={(e) => setBookingSearchQuery(e.target.value)}
                  placeholder="Buscar reservas por nombre, email, servicio..."
                  className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 text-sm"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {bookingSearchQuery && (
                  <button onClick={() => setBookingSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-3">
                <div>
                    <p className="text-xs font-medium text-neutral-600 mb-2">Tipo de estado</p>
                    <div className="flex flex-wrap gap-2">
                    <button onClick={() => setBookingFilter('all')} className={`px-3 py-1 rounded text-xs font-medium ${bookingFilter === 'all' ? 'bg-[#404040] text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-[#404040] hover:text-white'}`}>Todas</button>
                    <button onClick={() => setBookingFilter('PENDING')} className={`px-3 py-1 rounded text-xs font-medium ${bookingFilter === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-neutral-100 text-neutral-700 hover:bg-yellow-100 hover:text-yellow-700'}`}>Pendientes</button>
                    <button onClick={() => setBookingFilter('CONFIRMED')} className={`px-3 py-1 rounded text-xs font-medium ${bookingFilter === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-700 hover:bg-blue-100 hover:text-blue-700'}`}>Confirmadas</button>
                    <button onClick={() => setBookingFilter('IN_PROGRESS')} className={`px-3 py-1 rounded text-xs font-medium ${bookingFilter === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-700' : 'bg-neutral-100 text-neutral-700 hover:bg-purple-100 hover:text-purple-700'}`}>En progreso</button>
                    <button onClick={() => setBookingFilter('COMPLETED')} className={`px-3 py-1 rounded text-xs font-medium ${bookingFilter === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-700 hover:bg-green-100 hover:text-green-700'}`}>Completadas</button>
                    <button onClick={() => setBookingFilter('CANCELLED')} className={`px-3 py-1 rounded text-xs font-medium ${bookingFilter === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-700 hover:bg-red-100 hover:text-red-700'}`}>Canceladas</button>
                    </div>
                </div>

                <div>
                    <p className="text-xs font-medium text-neutral-600 mb-2">Tipo de servicio</p>
                    <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={() => setBookingServiceFilter('all')} 
                        className={`px-3 py-1 rounded text-xs font-medium ${bookingServiceFilter === 'all' ? 'bg-[#404040] text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-[#404040] hover:text-white'}`}
                    >
                        Todas
                    </button>
                    {servicesWithBookings.map(service => (
                        <button
                        key={service.id}
                        onClick={() => setBookingServiceFilter(service.id)}
                        className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                            bookingServiceFilter === service.id 
                            ? service.type === 'SPA' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                        >
                        {service.name}
                        </button>
                    ))}
                    </div>
                </div>
                </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto">
              {filteredBookings.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600 uppercase">Cliente</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600 uppercase">Servicio</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Fecha/Hora</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Participantes</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Total</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Estado</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredBookings.map((booking) => (
                      <Fragment key={booking.id}>
                        <tr className="hover:bg-neutral-50 transition">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-black">{booking.user.name}</p>
                            <p className="text-xs text-neutral-500">{booking.user.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-black">{booking.service.name}</p>
                            <p className="text-xs text-neutral-500">Hab. #{booking.reservation.room.number}</p>
                          </td>
                          <td className="px-4 py-3 text-center text-xs">
                            <p className="text-neutral-900">{new Date(booking.bookingDate).toLocaleDateString('es-AR')}</p>
                            <p className="text-neutral-500">{booking.bookingTime}</p>
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-medium">{booking.participants}</td>
                          <td className="px-4 py-3 text-center">
                            <p className="text-sm font-medium text-black">${booking.totalPrice.toLocaleString('es-AR')}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs rounded border ${getBookingStatusColor(booking.status)}`}>
                              {getBookingStatusLabel(booking.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setSelectedBooking(selectedBooking?.id === booking.id ? null : booking)}
                              className="px-2 py-1 text-xs font-medium rounded transition bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                            >
                              {selectedBooking?.id === booking.id ? 'Cerrar' : 'Ver'}
                            </button>
                          </td>
                        </tr>

                        {selectedBooking?.id === booking.id && (
                          <tr>
                            <td colSpan={7} className="px-4 py-4 bg-neutral-50">
                              <div className="space-y-4">
                                <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                  <p className="text-xs font-medium text-neutral-600 mb-3">Información del Cliente</p>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <p className="text-xs text-neutral-500">Nombre</p>
                                      <p className="text-neutral-900">{booking.user.name}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-neutral-500">Email</p>
                                      <p className="text-neutral-900">{booking.user.email}</p>
                                    </div>
                                    {booking.user.phone && (
                                      <div>
                                        <p className="text-xs text-neutral-500">Teléfono</p>
                                        <p className="text-neutral-900">{booking.user.phone}</p>
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-xs text-neutral-500">Habitación</p>
                                      <p className="text-neutral-900">#{booking.reservation.room.number} - {getRoomTypeLabel(booking.reservation.room.type)}</p>
                                    </div>
                                    <div>
                                    <p className="text-xs text-neutral-500">ID de Reserva</p>
                                    <p className="text-neutral-900 font-mono">#{booking.id}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                  <p className="text-xs font-medium text-neutral-600 mb-3">Detalles del Servicio</p>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <p className="text-xs text-neutral-500">Servicio</p>
                                      <p className="text-neutral-900">{booking.service.name}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-neutral-500">Tipo</p>
                                      <p className="text-neutral-900">{getServiceTypeLabel(booking.service.type)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-neutral-500">Fecha</p>
                                      <p className="text-neutral-900">
                                        {new Date(booking.bookingDate).toLocaleDateString('es-AR', {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                        })}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-neutral-500">Hora</p>
                                      <p className="text-neutral-900">{booking.bookingTime}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-neutral-500">Participantes</p>
                                      <p className="text-neutral-900">{booking.participants} personas</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-neutral-500">Total</p>
                                      <p className="text-neutral-900 font-medium">${booking.totalPrice.toLocaleString('es-AR')}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-neutral-500">Reservado el</p>
                                      <p className="text-neutral-900">{new Date(booking.createdAt).toLocaleDateString('es-AR')}</p>
                                    </div>
                                  </div>
                                </div>

                                {booking.specialRequests && (
                                  <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                    <p className="text-xs font-medium text-neutral-600 mb-2">Solicitudes especiales</p>
                                    <p className="text-sm text-neutral-700">{booking.specialRequests}</p>
                                  </div>
                                )}

                                {booking.staffNotes && (
                                  <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                    <p className="text-xs font-medium text-neutral-600 mb-2">Notas del personal</p>
                                    <p className="text-sm text-neutral-700">{booking.staffNotes}</p>
                                  </div>
                                )}

                                {booking.payment && (
                                  <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                    <p className="text-xs font-medium text-neutral-600 mb-3">Información de Pago</p>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <p className="text-xs text-neutral-500">Monto</p>
                                        <p className="text-neutral-900 font-medium">${booking.payment.amount.toLocaleString('es-AR')}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-neutral-500">Estado del pago</p>
                                        <p className="text-neutral-900">{booking.payment.status}</p>
                                      </div>
                                      {booking.payment.paymentMethod && (
                                        <div>
                                          <p className="text-xs text-neutral-500">Método</p>
                                          <p className="text-neutral-900">{booking.payment.paymentMethod}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                  <p className="text-xs font-medium text-neutral-600 mb-3">Cambiar Estado</p>
                                  <div className="flex flex-wrap gap-2">
                                    {booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                                      <button
                                        onClick={() => handleBookingStatusChange(booking.id, 'CONFIRMED')}
                                        disabled={updating}
                                        className="px-3 py-2 text-xs font-medium rounded transition bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                                      >
                                        Confirmar
                                      </button>
                                    )}
                                    {booking.status === 'CONFIRMED' && (
                                      <button
                                        onClick={() => handleBookingStatusChange(booking.id, 'IN_PROGRESS')}
                                        disabled={updating}
                                        className="px-3 py-2 text-xs font-medium rounded transition bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50"
                                      >
                                        Iniciar servicio
                                      </button>
                                    )}
                                    {booking.status === 'IN_PROGRESS' && (
                                      <button
                                        onClick={() => handleBookingStatusChange(booking.id, 'COMPLETED')}
                                        disabled={updating}
                                        className="px-3 py-2 text-xs font-medium rounded transition bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                                      >
                                        Completar
                                      </button>
                                    )}
                                    {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                                      <button
                                        onClick={() => handleBookingStatusChange(booking.id, 'CANCELLED')}
                                        disabled={updating}
                                        className="px-3 py-2 text-xs font-medium rounded transition bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                                      >
                                        Cancelar
                                      </button>
                                    )}
                                    {booking.status === 'CONFIRMED' && (
                                      <button
                                        onClick={() => handleBookingStatusChange(booking.id, 'NO_SHOW')}
                                        disabled={updating}
                                        className="px-3 py-2 text-xs font-medium rounded transition bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                                      >
                                        No asistió
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16">
                  <svg className="mx-auto h-12 w-12 text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-neutral-600 text-lg">No hay reservas que coincidan con el filtro</p>
                  {bookingSearchQuery && (
                    <button
                      onClick={() => setBookingSearchQuery('')}
                      className="mt-4 text-sm text-black hover:underline"
                    >
                      Limpiar búsqueda
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* SECCIÓN DE GESTIÓN DE TIMESLOTS */}
        <div className="border-t-2 border-neutral-300 pt-12 mt-12">
        <div className="mb-8">
            <h2 className="text-3xl font-semibold text-black mb-2">Gestión de Horarios</h2>
            <div className="h-px w-20 bg-black/20 mb-2" />
            <p className="text-neutral-600">Administra los horarios disponibles para cada servicio</p>
        </div>

        {/* Selector de Servicio */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
                Selecciona un servicio
            </label>
            <select
                value={selectedServiceForSlots}
                onChange={(e) => setSelectedServiceForSlots(e.target.value)}
                className={selectBase}
            >
                <option value="">-- Selecciona un servicio --</option>
                {services.map((service) => (
                <option key={service.id} value={service.id}>
                    {service.name} ({getServiceTypeLabel(service.type)})
                </option>
                ))}
            </select>
            </div>

            {selectedServiceForSlots && (
            <div className="flex gap-2">
                <button
                    onClick={() => {
                        setGenerateDateRange({
                        startDate: slotDateRange.startDate,
                        endDate: slotDateRange.endDate,
                        });
                        setShowGenerateModal(true);
                    }}
                    className="flex-1 h-11 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition text-sm font-medium"
                    >
                    + Generar Slots
                    </button>
                <button
                onClick={() => fetchSlots(selectedServiceForSlots)}
                className="h-11 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition text-sm font-medium"
                >
                Recargar
                </button>
            </div>
            )}
        </div>
        </div>
        {selectedServiceForSlots && (
            <>
            {/* Filtros de Fecha */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <p className="text-sm font-medium text-neutral-700 mb-3">Filtrar por fecha</p>
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-neutral-600 mb-1">Desde</label>
                    <input
                    type="date"
                    value={slotDateRange.startDate}
                    onChange={(e) => setSlotDateRange({ ...slotDateRange, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs text-neutral-600 mb-1">Hasta</label>
                    <input
                    type="date"
                    value={slotDateRange.endDate}
                    onChange={(e) => setSlotDateRange({ ...slotDateRange, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 text-sm"
                    />
                </div>
                </div>
            </div>

            {/* Estadísticas de Slots */}
            {slotsStats && (
                <div className="mb-6">
                <h3 className="text-xl font-semibold text-black mb-4">Estadísticas de Horarios</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-neutral-600 mb-1">Total</p>
                    <p className="text-2xl font-bold text-black">{slotsStats.total}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs text-green-700 mb-1">Disponibles</p>
                    <p className="text-2xl font-bold text-green-700">{slotsStats.available}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-xs text-red-700 mb-1">Deshabilitados</p>
                    <p className="text-2xl font-bold text-red-700">{slotsStats.disabled}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs text-green-700 mb-1">Vacíos</p>
                    <p className="text-2xl font-bold text-green-700">{slotsStats.empty}</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-xs text-yellow-700 mb-1">Parciales</p>
                    <p className="text-2xl font-bold text-yellow-700">{slotsStats.partial}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-xs text-red-700 mb-1">Llenos</p>
                    <p className="text-2xl font-bold text-red-700">{slotsStats.full}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-700 mb-1">Ocupación</p>
                    <p className="text-2xl font-bold text-blue-700">
                        {slotsStats.totalCapacity > 0 
                        ? Math.round((slotsStats.totalBooked / slotsStats.totalCapacity) * 100)
                        : 0}%
                    </p>
                    </div>
                </div>
                </div>
            )}

            {/* Tabla de Slots */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {loadingSlots ? (
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-neutral-600">Cargando horarios...</p>
                    </div>
                </div>
                ) : slots.length > 0 ? (
                <div className="max-h-[600px] overflow-y-auto">
                    <table className="w-full text-sm">
                    <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0">
                        <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Horario</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase">Capacidad</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase">Reservadas</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase">Disponibles</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase">Ocupación</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase">Estado</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                        {slots.map((slot) => (
                        <tr key={slot.id} className={`hover:bg-neutral-50 transition ${!slot.isAvailable ? 'bg-neutral-50' : ''}`}>
                            <td className="px-4 py-3 text-sm">
                            {new Date(slot.date).toLocaleDateString('es-AR', {
                                weekday: 'short',
                                day: '2-digit',
                                month: '2-digit',
                            })}
                            </td>
                            <td className="px-4 py-3 text-sm">
                            {slot.startTime} - {slot.endTime}
                            </td>
                            <td className="px-4 py-3 text-center">
                            <button
                                onClick={() => handleChangeSlotCapacity(slot.id, slot.capacity)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                title="Click para cambiar"
                            >
                                {slot.capacity}
                            </button>
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-medium">{slot.booked}</td>
                            <td className="px-4 py-3 text-center text-sm font-medium text-green-600">{slot.available}</td>
                            <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-16 bg-neutral-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{ width: `${slot.utilizationPercent}%` }}
                                />
                                </div>
                                <span className="text-xs text-neutral-600">{slot.utilizationPercent}%</span>
                            </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs rounded border ${getSlotStatusColor(slot.status)}`}>
                                {getSlotStatusLabel(slot.status)}
                            </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                            <button
                                onClick={() => handleToggleSlotAvailability(slot.id, slot.isAvailable)}
                                className={`px-2 py-1 text-xs rounded transition ${
                                slot.isAvailable
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                                title={slot.isAvailable ? 'Click para deshabilitar' : 'Click para habilitar'}
                            >
                                {slot.isAvailable ? 'Archivar' : 'Activar'}
                            </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                ) : (
                <div className="text-center py-16">
                    <svg className="mx-auto h-12 w-12 text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-neutral-600 text-lg mb-4">No hay horarios generados para este rango</p>
                    <button
                        onClick={() => {
                            setGenerateDateRange({
                            startDate: slotDateRange.startDate,
                            endDate: slotDateRange.endDate,
                            });
                            setShowGenerateModal(true);
                        }}
                        className="inline-block px-6 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition text-sm font-medium"
                        >
                        + Generar Slots
                        </button>
                </div>
                )}
            </div>
            </>
        )}
        </div>

        {/* Modal para Generar Slots */}
        {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                <h3 className="text-xl font-semibold text-black">Generar Horarios</h3>
                <p className="text-sm text-neutral-600 mt-1">
                    Se crearán slots según la configuración del servicio
                </p>
                </div>
                <button 
                onClick={() => setShowGenerateModal(false)} 
                className="text-neutral-400 hover:text-neutral-600"
                >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                </button>
            </div>

            <div className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Fecha de inicio
                </label>
                <input
                    type="date"
                    value={generateDateRange.startDate}
                    onChange={(e) => setGenerateDateRange({ ...generateDateRange, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
                </div>

                <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Fecha de fin
                </label>
                <input
                    type="date"
                    value={generateDateRange.endDate}
                    onChange={(e) => setGenerateDateRange({ ...generateDateRange, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                    ℹ️ Los horarios se generarán según los días disponibles, horarios de inicio/fin e intervalos configurados en el servicio.
                </p>
                </div>
            </div>

            <div className="flex gap-3 mt-6">
                <button
                onClick={handleGenerateSlots}
                disabled={generatingSlots}
                className="flex-1 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition text-sm font-medium disabled:opacity-50"
                >
                {generatingSlots ? 'Generando...' : '+ Generar Slots'}
                </button>
                <button
                onClick={() => setShowGenerateModal(false)}
                disabled={generatingSlots}
                className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition text-sm font-medium disabled:opacity-50"
                >
                Cancelar
                </button>
            </div>
            </div>
        </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-black">{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
                  <p className="text-sm text-neutral-600">{editingService ? 'Modifica los datos' : 'Completa los datos'}</p>
                </div>
                <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre" className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300" />
                <div className="grid grid-cols-2 gap-4">
                  <select required value={formData.type} onChange={(e) => { const newType = e.target.value; const newCats = categories[newType as 'SPA' | 'EXPERIENCE']; setFormData({ ...formData, type: newType, category: newCats[0].value }); }} className={selectBase}>
                    <option value="SPA">Spa</option>
                    <option value="EXPERIENCE">Experiencia</option>
                  </select>
                  <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={selectBase}>
                    {availableCategories.map((cat) => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <input type="number" required min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="Precio" className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300" />
                  <input type="number" required min="15" step="15" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} placeholder="Duración (min)" className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300" />
                  <select value={formData.pricePerPerson ? 'true' : 'false'} onChange={(e) => setFormData({ ...formData, pricePerPerson: e.target.value === 'true' })} className={selectBase}>
                    <option value="true">Por persona</option>
                    <option value="false">Precio fijo</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" required min="1" value={formData.minCapacity} onChange={(e) => setFormData({ ...formData, minCapacity: e.target.value })} placeholder="Cap. mín" className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300" />
                  <input type="number" required min="1" value={formData.maxCapacity} onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })} placeholder="Cap. máx" className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300" />
                </div>
                <input type="text" value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} placeholder="Descripción corta" className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300" />
                <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción completa" rows={4} className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none" />
                <input type="text" value={formData.mainImage} onChange={(e) => setFormData({ ...formData, mainImage: e.target.value })} placeholder="URL imagen principal" className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300" />
                <input type="text" value={formData.images} onChange={(e) => setFormData({ ...formData, images: e.target.value })} placeholder="URLs imágenes (separadas por coma)" className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300" />
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded" />
                  <label className="text-sm">Activo</label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded transition text-sm font-medium disabled:opacity-50">{submitting ? 'Guardando...' : editingService ? 'Actualizar' : 'Crear'}</button>
                  <button type="button" onClick={handleCloseModal} disabled={submitting} className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded transition text-sm font-medium disabled:opacity-50">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`.line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}`}</style>
    <Footer />  
    </main>
  );
}