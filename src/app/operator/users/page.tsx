'use client';

import { useState, useEffect, Fragment } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'OPERATOR' | 'ADMIN';
  phone: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    reservations: number;
    consultations: number;
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

export default function UsersManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all'); // rol
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // NUEVO: estado para modal de activar/archivar
  const [toggleModal, setToggleModal] = useState<{
    open: boolean;
    user: User | null;
    loading: boolean;
  }>({ open: false, user: null, loading: false });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      const userRole = (session.user as any)?.role;
      if (userRole !== 'ADMIN') {
        router.push('/dashboard');
      } else {
        fetchUsers();
      }
    }
  }, [status, router, session]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        console.error('Error en la respuesta:', data.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (response.ok) {
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, role: newRole as 'USER' | 'OPERATOR' | 'ADMIN' } : user
          )
        );
        setEditingUser(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Error al actualizar rol');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Error al actualizar rol');
    }
  };

  // MODIFICADO: quita confirm() y solo hace el toggle en el servidor + estado local
  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, active: !currentActive }),
      });

      if (response.ok) {
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, active: !currentActive } : user
          )
        );
        setSelectedUser(su => (su?.id === userId ? null : su));
      } else {
        const data = await response.json();
        alert(data.error || 'Error al cambiar estado del usuario');
      }
    } catch (error) {
      console.error('Error toggling user active:', error);
      alert('Error al cambiar estado del usuario');
    }
  };

  // NUEVO: helpers de modal
  const openToggleModal = (user: User) =>
    setToggleModal({ open: true, user, loading: false });

  const closeToggleModal = () =>
    setToggleModal({ open: false, user: null, loading: false });

  const confirmToggleActive = async () => {
    if (!toggleModal.user) return;
    try {
      setToggleModal(s => ({ ...s, loading: true }));
      await handleToggleActive(toggleModal.user.id, toggleModal.user.active);
      closeToggleModal();
    } catch {
      setToggleModal(s => ({ ...s, loading: false }));
    }
  };

  const filteredUsers = users.filter((user) => {
    // filtro por rol
    const passesRole = filter === 'all' ? true : user.role === filter;
    if (!passesRole) return false;

    // filtro por estado (NUEVO)
    const passesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? user.active
        : !user.active; // archived

    if (!passesStatus) return false;

    // búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = user.name.toLowerCase().includes(query);
      const matchesEmail = user.email.toLowerCase().includes(query);
      const matchesPhone = user.phone?.toLowerCase().includes(query);
      return matchesName || matchesEmail || matchesPhone;
    }

    return true;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.active).length,
    inactive: users.filter((u) => !u.active).length,
    users: users.filter((u) => u.role === 'USER').length,
    operators: users.filter((u) => u.role === 'OPERATOR').length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
  };

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />

      <section className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-black mb-2">Gestión de Usuarios</h1>
          <div className="h-px w-20 bg-black/20 mb-2" />
          <p className="text-neutral-600">Administra roles y permisos de usuarios</p>
        </div>

        {/* Estadísticas y gráfico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Columna izquierda - Tarjetas de estadísticas */}
          <div className="flex flex-col h-full">
            <h2 className="text-xl font-semibold text-black mb-4">Resumen de Usuarios</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-sm text-neutral-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-black">{stats.total}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <p className="text-sm text-green-700 mb-1">Activos</p>
                <p className="text-3xl font-bold text-green-700">{stats.active}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-sm text-red-700 mb-1">Archivados</p>
                <p className="text-3xl font-bold text-red-700">{stats.inactive}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-sm text-blue-700 mb-1">Usuarios</p>
                <p className="text-3xl font-bold text-blue-700">{stats.users}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <p className="text-sm text-purple-700 mb-1">Operadores</p>
                <p className="text-3xl font-bold text-purple-700">{stats.operators}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <p className="text-sm text-orange-700 mb-1">Administradores</p>
                <p className="text-3xl font-bold text-orange-700">{stats.admins}</p>
              </div>
            </div>
          </div>

          {/* Columna derecha - Gráfico de barras */}
          <div>
            <h2 className="text-xl font-semibold text-black mb-4">Distribución de usuarios</h2>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              {stats.total > 0 ? (
                <div className="flex items-center justify-center h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[{
                        Activos: stats.active,
                        Archivados: stats.inactive,
                        Usuarios: stats.users,
                        Operadores: stats.operators,
                        Admins: stats.admins
                      }]}
                      margin={{ top: 20, right: 30, left: 50, bottom: 20 }}
                      barCategoryGap="250%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis 
                        dataKey={() => ''} 
                        tick={false} 
                        axisLine={false}
                      />
                      <YAxis 
                        allowDecimals={false} 
                        tick={{ fontSize: 12 }}
                        domain={[0, (dataMax: number) => dataMax + 2]}
                        label={{ 
                          value: 'Cantidad de usuarios', 
                          angle: -90, 
                          position: 'insideLeft', 
                          style: { fontSize: 13, fill: '#404040', textAnchor: 'middle' } 
                        }}
                      />
                      <Tooltip />
                      <Bar dataKey="Activos" fill="#ECFDF5" stroke="#22c55e" strokeWidth={1} radius={[6, 6, 0, 0]} barSize={40} />
                      <Bar dataKey="Archivados" fill="#FEF2F2" stroke="#ef4444" strokeWidth={1} radius={[6, 6, 0, 0]} barSize={40} />
                      <Bar dataKey="Usuarios" fill="#EFF6FF" stroke="#3b82f6" strokeWidth={1} radius={[6, 6, 0, 0]} barSize={40} />
                      <Bar dataKey="Operadores" fill="#F5F3FF" stroke="#a855f7" strokeWidth={1} radius={[6, 6, 0, 0]} barSize={40} />
                      <Bar dataKey="Admins" fill="#FFF7ED" stroke="#f97316" strokeWidth={1} radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
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
                placeholder="Buscar por nombre, email o teléfono..."
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

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-neutral-600 mb-2">Rol del usuario</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    filter === 'all'
                      ? 'bg-[#404040] text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-[#404040] hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilter('USER')}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    filter === 'USER'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  Usuarios
                </button>
                <button
                  onClick={() => setFilter('OPERATOR')}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    filter === 'OPERATOR'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-purple-100 hover:text-purple-700'
                  }`}
                >
                  Operadores
                </button>
                <button
                  onClick={() => setFilter('ADMIN')}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    filter === 'ADMIN'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-orange-100 hover:text-orange-700'
                  }`}
                >
                  Administradores
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-neutral-600 mb-2">Estado del usuario</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    statusFilter === 'all'
                      ? 'bg-[#404040] text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-[#404040] hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    statusFilter === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-green-100 hover:text-green-700'
                  }`}
                >
                  Activos
                </button>
                <button
                  onClick={() => setStatusFilter('archived')}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    statusFilter === 'archived'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-red-100 hover:text-red-700'
                  }`}
                >
                  Archivados
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Usuarios */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            {filteredUsers.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600 uppercase">Usuario</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600 uppercase">Contacto</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Actividad</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Fecha</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Rol</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredUsers.map((user) => (
                    <Fragment key={user.id}>
                      <tr className="hover:bg-neutral-50 transition">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-black">{user.name}</p>
                          <p className="text-xs text-neutral-500">{user.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-neutral-700">{user.phone || 'Sin teléfono'}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-xs text-neutral-700">
                            <p>{user._count.reservations} reservas</p>
                            <p>{user._count.consultations} consultas</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-neutral-700">
                          {new Date(user.createdAt).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs rounded ${
                            user.role === 'USER'
                              ? 'bg-blue-50 border border-blue-200 text-blue-800'
                              : user.role === 'OPERATOR'
                              ? 'bg-purple-50 border border-purple-200 text-purple-800'
                              : 'bg-orange-50 border border-orange-200 text-orange-800'
                          }`}>
                            {user.role === 'USER' ? 'Usuario' : user.role === 'OPERATOR' ? 'Operador' : 'Admin'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                              className="px-2 py-1 text-xs font-medium rounded transition bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                            >
                              {selectedUser?.id === user.id ? 'Cerrar' : 'Ver'}
                            </button>
                            <button
                              onClick={() => setEditingUser(user)}
                              className="px-2 py-1 text-xs font-medium rounded transition bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                            >
                              Editar
                            </button>
                            {/* MODIFICADO: abre modal en lugar de confirm() */}
                            <button
                              onClick={() => openToggleModal(user)}
                              className={`px-2 py-1 text-xs font-medium rounded transition ${
                                user.active
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {user.active ? 'Archivar' : 'Activar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {selectedUser?.id === user.id && (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 bg-neutral-50">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                <p className="text-xs font-medium text-neutral-600 mb-2">Información Personal</p>
                                <div className="space-y-1 text-sm">
                                  <p><span className="font-medium">ID:</span> {user.id}</p>
                                  <p><span className="font-medium">Nombre:</span> {user.name}</p>
                                  <p><span className="font-medium">Email:</span> {user.email}</p>
                                  <p><span className="font-medium">Teléfono:</span> {user.phone || 'No especificado'}</p>
                                </div>
                              </div>
                              
                              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                <p className="text-xs font-medium text-neutral-600 mb-2">Estadísticas</p>
                                <div className="space-y-1 text-sm">
                                  <p><span className="font-medium">Reservas:</span> {user._count.reservations}</p>
                                  <p><span className="font-medium">Consultas:</span> {user._count.consultations}</p>
                                  <p><span className="font-medium">Creado:</span> {new Date(user.createdAt).toLocaleDateString('es-AR')}</p>
                                  <p><span className="font-medium">Actualizado:</span> {new Date(user.updatedAt).toLocaleDateString('es-AR')}</p>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-neutral-600 text-lg">No hay usuarios que coincidan con el filtro</p>
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
        </div>
      </section>

      {/* NUEVO: Modal de activar/archivar, respetando estética existente */}
      {toggleModal.open && toggleModal.user && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={closeToggleModal}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[70] pointer-events-none">
            <div 
              className="bg-white rounded-lg max-w-md w-full pointer-events-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-black">
                    ¿{toggleModal.user.active ? 'Archivar' : 'Activar'} usuario?
                  </h3>
                  <button
                    onClick={closeToggleModal}
                    className="text-neutral-400 hover:text-neutral-600"
                    disabled={toggleModal.loading}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p className="text-neutral-700 mb-6">
                  ¿Estás seguro de que deseas {toggleModal.user.active ? 'archivar' : 'activar'} a{' '}
                  <span className="font-medium">{toggleModal.user.name}</span>? Esta acción se puede revertir.
                </p>

              {(toggleModal.user.role === 'ADMIN' || toggleModal.user.role === 'OPERATOR') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    Atención: este usuario es{" "}
                    <span className="font-medium">
                      {toggleModal.user.role === 'ADMIN' ? 'administrador' : 'operador'}
                    </span>.
                    Cambiar su estado afecta el acceso a la gestión del sistema.
                  </p>
                </div>
              )}
              
                <div className="flex gap-3">
                  <button
                    onClick={closeToggleModal}
                    disabled={toggleModal.loading}
                    className="flex-1 bg-white border border-neutral-300 text-gray hover:bg-neutral-50 py-2 px-4 rounded-[30px] transition disabled:opacity-50"
                  >
                    No, mantener
                  </button>
                  <button
                    onClick={confirmToggleActive}
                    disabled={toggleModal.loading}
                    className={`flex-1 font-medium py-2 px-4 rounded-[30px] transition disabled:opacity-50
                      ${toggleModal.user.active
                        ? 'bg-red-100 border border-red-300 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 border border-green-300 text-green-700 hover:bg-green-200'}`}
                  >
                    {toggleModal.loading
                      ? (toggleModal.user.active ? 'Archivando...' : 'Activando...')
                      : (toggleModal.user.active ? 'Sí, archivar' : 'Sí, activar')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {editingUser && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setEditingUser(null)}
          />
          
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[70] pointer-events-none">
            <div 
              className="bg-white rounded-lg max-w-md w-full pointer-events-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-black">Editar Usuario</h2>
                    <p className="text-sm text-neutral-600">Modifica el rol del usuario</p>
                  </div>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-neutral-50 p-3 rounded-lg">
                    <p className="text-sm text-neutral-600">
                      <span className="font-medium text-neutral-700">Usuario:</span> {editingUser.name}
                    </p>
                    <p className="text-sm text-neutral-600">
                      <span className="font-medium text-neutral-700">Email:</span> {editingUser.email}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Rol del usuario
                    </label>
                    <select
                      className={selectBase}
                      defaultValue={editingUser.role}
                      onChange={(e) => handleUpdateRole(editingUser.id, e.target.value)}
                    >
                      <option value="USER">Usuario</option>
                      <option value="OPERATOR">Operador</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="flex-1 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-medium rounded-lg transition"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Footer />
    </main>
  );
}
