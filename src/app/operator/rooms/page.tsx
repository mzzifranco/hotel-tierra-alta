'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Room {
  id: string;
  number: string;
  type: 'SUITE_SINGLE' | 'SUITE_DOUBLE' | 'VILLA_PETIT' | 'VILLA_GRANDE';
  price: number;
  capacity: number;
  floor: number;
  amenities: string[];
  images: string[];
  description: string | null;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING' | 'CLOSED';
  createdAt: string;
  _count: {
    reservations: number;
  };
}

// Base común para todos los inputs/selects
const fieldBase =
  "w-full h-11 px-4 rounded-lg border text-sm transition-all duration-300 ease-in-out focus:outline-none";

// Extensión específica para selects (con flecha SVG custom)
const selectBase =
  fieldBase +
  " appearance-none pr-8 bg-no-repeat bg-[length:12px_12px] " +
  "bg-[right_0.75rem_center] " +
  "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")] " +
  "border-neutral-300 text-neutral-900 bg-white " +
  "focus:ring-2 focus:ring-neutral-400 focus:border-transparent";


export default function AdminRoomsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    number: '',
    type: 'SUITE_SINGLE',
    price: '',
    capacity: '',
    floor: '',
    amenities: '',
    images: '',
    description: '',
    status: 'AVAILABLE',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role !== 'ADMIN') {
        router.push('/');
      } else {
        fetchRooms();
      }
    }
  }, [status, router, session]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/rooms');
      const data = await response.json();
      
      if (data.success) {
        setRooms(data.rooms);
      } else {
        console.error('Error en la respuesta:', data.error);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        number: room.number,
        type: room.type,
        price: room.price.toString(),
        capacity: room.capacity.toString(),
        floor: room.floor.toString(),
        amenities: room.amenities.join(', '),
        images: room.images.join(', '),
        description: room.description || '',
        status: room.status,
      });
    } else {
      setEditingRoom(null);
      setFormData({
        number: '',
        type: 'SUITE_SINGLE',
        price: '',
        capacity: '',
        floor: '',
        amenities: '',
        images: '',
        description: '',
        status: 'AVAILABLE',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRoom(null);
    setFormData({
      number: '',
      type: 'SUITE_SINGLE',
      price: '',
      capacity: '',
      floor: '',
      amenities: '',
      images: '',
      description: '',
      status: 'AVAILABLE',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        number: formData.number,
        type: formData.type,
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity),
        floor: parseInt(formData.floor),
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(a => a),
        images: formData.images.split(',').map(i => i.trim()).filter(i => i),
        description: formData.description || null,
        status: formData.status,
      };

      const url = editingRoom
        ? `/api/admin/rooms/${editingRoom.id}`
        : '/api/admin/rooms';
      
      const method = editingRoom ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchRooms();
        handleCloseModal();
        alert(editingRoom ? 'Habitación actualizada' : 'Habitación creada');
      } else {
        alert(data.error || 'Error al guardar habitación');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar habitación');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm('¿Estás seguro de que quieres cerrar esta habitación?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        await fetchRooms();
        alert('Habitación cerrada exitosamente');
      } else {
        alert(data.error || 'Error al cerrar habitación');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cerrar habitación');
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const passesState = filter === 'all' || room.status === filter;
    if (!passesState) return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        room.number.toLowerCase().includes(query) ||
        room.type.toLowerCase().includes(query) ||
        room.floor.toString().includes(query)
      );
    }

    return true;
  });

  const stats = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === 'AVAILABLE').length,
    occupied: rooms.filter((r) => r.status === 'OCCUPIED').length,
    maintenance: rooms.filter((r) => r.status === 'MAINTENANCE').length,
    cleaning: rooms.filter((r) => r.status === 'CLEANING').length,
    closed: rooms.filter((r) => r.status === 'CLOSED').length,
  };

  // Función para aclarar el color hacia pastel
  const tintHex = (hex: string, t = 0.9) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    const [r, g, b] = [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)];
    const mix = (c: number) => Math.round(c + (255 - c) * t);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  };

  const chartData = [
    { name: 'Disponibles', value: stats.available, color: '#22c55e' },
    { name: 'Ocupadas', value: stats.occupied, color: '#3b82f6' },
    { name: 'Mantenimiento', value: stats.maintenance, color: '#f97316' },
    { name: 'Limpieza', value: stats.cleaning, color: '#a855f7' },
    { name: 'Cerradas', value: stats.closed, color: '#ef4444' }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      AVAILABLE: 'bg-green-50 border-green-200 text-green-800',
      OCCUPIED: 'bg-blue-50 border-blue-200 text-blue-800',
      MAINTENANCE: 'bg-orange-50 border-orange-200 text-orange-800',
      CLEANING: 'bg-purple-50 border-purple-200 text-purple-800',
      CLOSED: 'bg-red-50 border-red-200 text-red-800',
    };
    return colors[status] || 'bg-neutral-50 border-neutral-200 text-neutral-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      AVAILABLE: 'Disponible',
      OCCUPIED: 'Ocupada',
      MAINTENANCE: 'Mantenimiento',
      CLEANING: 'Limpieza',
      CLOSED: 'Cerrada',
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

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />

      <section className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-semibold text-black mb-2">Gestión de Habitaciones</h1>
            <div className="h-px w-20 bg-black/20 mb-2" />
            <p className="text-neutral-600">Administra todas las habitaciones del hotel</p>
          </div>
        </div>

        {/* Estadísticas y gráfico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Columna izquierda - Tarjetas de estadísticas */}
          <div className="flex flex-col h-full">
            <h2 className="text-xl font-semibold text-black mb-4">Resumen de Habitaciones</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-sm text-neutral-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-black">{stats.total}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <p className="text-sm text-green-700 mb-1">Disponibles</p>
                <p className="text-3xl font-bold text-green-700">{stats.available}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-sm text-blue-700 mb-1">Ocupadas</p>
                <p className="text-3xl font-bold text-blue-700">{stats.occupied}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <p className="text-sm text-orange-700 mb-1">Mantenimiento</p>
                <p className="text-3xl font-bold text-orange-700">{stats.maintenance}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <p className="text-sm text-purple-700 mb-1">Limpieza</p>
                <p className="text-3xl font-bold text-purple-700">{stats.cleaning}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-sm text-red-700 mb-1">Cerradas</p>
                <p className="text-3xl font-bold text-red-700">{stats.closed}</p>
              </div>
            </div>
          </div>

          {/* Columna derecha - Gráfico de torta */}
          <div>
            <h2 className="text-xl font-semibold text-black mb-4">Distribución por estado</h2>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              {stats.total > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={0}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={tintHex(entry.color, 0.9)} 
                          stroke={entry.color} 
                          strokeWidth={1} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-neutral-400">
                  No hay datos para mostrar
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por número, tipo o piso..."
                className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 text-sm"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'all'
                  ? 'bg-[#404040] text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-[#404040] hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('AVAILABLE')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'AVAILABLE'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-green-100 hover:text-green-700'
              }`}
            >
              Disponibles
            </button>
            <button
              onClick={() => setFilter('OCCUPIED')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'OCCUPIED'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-blue-100 hover:text-blue-700'
              }`}
            >
              Ocupadas
            </button>
            <button
              onClick={() => setFilter('MAINTENANCE')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'MAINTENANCE'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-orange-100 hover:text-orange-700'
              }`}
            >
              Mantenimiento
            </button>
            <button
              onClick={() => setFilter('CLEANING')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'CLEANING'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-purple-100 hover:text-purple-700'
              }`}
            >
              Limpieza
            </button>
            <button
              onClick={() => setFilter('CLOSED')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'CLOSED'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-red-100 hover:text-red-700'
              }`}
            >
              Cerradas
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="ml-auto px-3 py-1 bg-neutral-100 text-neutral-700 hover:bg-[#404040] hover:text-white rounded-lg transition text-xs font-medium"
            >
              + Nueva Habitación
            </button>
          </div>
        </div>

        {/* Grid de Habitaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-black">Habitación #{room.number}</h3>
                      <p className="text-sm text-neutral-600">{getRoomTypeLabel(room.type)}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs rounded border ${getStatusColor(room.status)}`}>
                      {getStatusLabel(room.status)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Precio por noche:</span>
                      <span className="font-medium text-black">${room.price.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Capacidad:</span>
                      <span className="font-medium text-black">{room.capacity} personas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Piso:</span>
                      <span className="font-medium text-black">{room.floor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Reservas activas:</span>
                      <span className="font-medium text-black">{room._count.reservations}</span>
                    </div>
                  </div>

                  {room.amenities.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-neutral-600 mb-1">Amenidades:</p>
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.slice(0, 3).map((amenity, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded">
                            {amenity}
                          </span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded">
                            +{room.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(room)}
                      className="flex-1 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium rounded transition"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <svg className="mx-auto h-12 w-12 text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <p className="text-neutral-600 text-lg">No hay habitaciones que coincidan con el filtro</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-sm text-black hover:underline"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Modal para crear/editar habitación */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-black">
                    {editingRoom ? 'Editar Habitación' : 'Nueva Habitación'}
                  </h2>
                  <p className="text-sm text-neutral-600">
                    {editingRoom ? 'Modifica los datos de la habitación' : 'Completa los datos para crear una habitación'}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Número de Habitación *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
                      placeholder="101"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Tipo *
                    </label>
                    <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className={selectBase}
                  >
                    <option value="SUITE_SINGLE">Suite Simple</option>
                    <option value="SUITE_DOUBLE">Suite Doble</option>
                    <option value="VILLA_PETIT">Villa Petit</option>
                    <option value="VILLA_GRANDE">Villa Grande</option>
                  </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Precio por noche (ARS) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Capacidad (personas) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
                      placeholder="2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Piso *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="20"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Estado *
                    </label>
                    <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={selectBase}
                  >
                    <option value="AVAILABLE">Disponible</option>
                    <option value="OCCUPIED">Ocupada</option>
                    <option value="MAINTENANCE">Mantenimiento</option>
                    <option value="CLEANING">Limpieza</option>
                    <option value="CLOSED">Cerrada</option>
                  </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Amenidades (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={formData.amenities}
                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
                    placeholder="WiFi, TV, Aire acondicionado, Minibar"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Ejemplo: WiFi, TV, Aire acondicionado, Minibar
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    URLs de Imágenes (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
                    placeholder="https://ejemplo.com/img1.jpg, https://ejemplo.com/img2.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none"
                    rows={3}
                    placeholder="Descripción de la habitación..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Guardando...' : editingRoom ? 'Actualizar' : 'Crear Habitación'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded transition text-sm font-medium disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}