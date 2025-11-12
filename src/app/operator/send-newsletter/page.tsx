'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoryPie from '@/components/CategoryPie';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';

// ===== Tipos =====
type NewsletterCategoryType =
  | 'PROMOCIONES' | 'NOVEDADES' | 'EVENTOS'
  | 'TEMPORADA'  | 'CONSEJOS'  | 'GENERAL';

// ===== Constantes de categoría (única fuente) =====
const CategoryLabels: Record<NewsletterCategoryType, string> = {
  PROMOCIONES: 'Promociones',
  NOVEDADES:   'Novedades',
  EVENTOS:     'Eventos',
  TEMPORADA:   'Temporada',
  CONSEJOS:    'Consejos',
  GENERAL:     'General'
};

const CATEGORY_COLORS: Record<NewsletterCategoryType, string> = {
  PROMOCIONES: '#008236',
  NOVEDADES:   '#2563eb',
  EVENTOS:     '#dc2626',
  TEMPORADA:   '#ea580c',
  CONSEJOS:    '#7c3aed',
  GENERAL:     '#404040'
};

const CATEGORY_CLASSES: Record<NewsletterCategoryType, string> = {
  PROMOCIONES: 'bg-green-50 border border-green-200 text-green-800',
  NOVEDADES:   'bg-blue-50 border border-blue-200 text-blue-800',
  EVENTOS:     'bg-red-50 border border-red-200 text-red-800',
  TEMPORADA:   'bg-orange-50 border border-orange-200 text-orange-800',
  CONSEJOS:    'bg-purple-50 border border-purple-200 text-purple-800',
  GENERAL:     'bg-gray-50 border border-gray-200 text-gray-800',
};

// debajo de CATEGORY_CLASSES
// tipos y mapa
const CATEGORY_FILTER_BTN: Record<
  NewsletterCategoryType,
  { hover: string; active: string }
> = {
  PROMOCIONES: { hover: 'hover:bg-green-600 hover:text-white',  active: 'bg-green-600 text-white' },
  NOVEDADES:   { hover: 'hover:bg-blue-600 hover:text-white',   active: 'bg-blue-600 text-white' },
  EVENTOS:     { hover: 'hover:bg-red-600 hover:text-white',    active: 'bg-red-600 text-white' },
  TEMPORADA:   { hover: 'hover:bg-orange-600 hover:text-white', active: 'bg-orange-600 text-white' },
  CONSEJOS:    { hover: 'hover:bg-purple-600 hover:text-white', active: 'bg-purple-600 text-white' },
  GENERAL:     { hover: 'hover:bg-gray-700 hover:text-white',   active: 'bg-gray-700 text-white' },
};

// clase del botón categoría
const filterBtnCls = (v: NewsletterCategoryType, isActive: boolean) =>
  `px-3 py-1 rounded text-xs font-medium transition-colors ${
    isActive
      ? CATEGORY_FILTER_BTN[v].active
      : `bg-transparent text-neutral-700 ${CATEGORY_FILTER_BTN[v].hover}`
  }`;



// ===== Helpers centralizados (tipados) =====
const getCategoryLabel = (c: NewsletterCategoryType) => CategoryLabels[c];
const getCategoryColor = (c: NewsletterCategoryType) => CATEGORY_COLORS[c];

interface Newsletter {
  id: string;
  subject: string;
  content: string;
  category: NewsletterCategoryType;
  sentTo: number;
  sentAt: string;
  sender: { name: string; email: string };
}

interface Subscriber {
  id: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  deactivatedAt?: string;
}

// ===== Tooltip personalizado (gráfico) =====
function SubsTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-neutral-300 rounded-lg shadow-md px-3 py-2 text-sm">
        {payload.map((entry: any, i: number) => (
          <p
            key={i}
            style={{
              color: entry.name === 'Activos' ? '#166534' : '#991B1B',
              fontWeight: 500,
            }}
          >
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function SendNewsletterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<NewsletterCategoryType>('GENERAL');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean; sent?: number; failed?: number; total?: number; error?: string;
  } | null>(null);

  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  // NUEVOS ESTADOS PARA BUSCADOR Y FILTROS
  const [newsletterSearch, setNewsletterSearch] = useState('');
  const [filterOption, setFilterOption] = useState<'all' | NewsletterCategoryType>('all');

  const [subscribers, setSubscribers] = useState<any[]>([
    { period: 'Jul', count: 1 },
    { period: 'Ago', count: 3 },
    { period: 'Sep', count: 5 },
    { period: 'Oct', count: 8 }
  ]);
  const [subscribersData, setSubscribersData] = useState<Subscriber[]>([]);
  const [subscriberFilter, setSubscriberFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated') {
      fetchNewsletters();
      fetchSubscribers();
      fetchSubscribersData();
    }
  }, [status]);

  const fmtDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '—';

  const lastStatusChange = (s: Subscriber) =>
    fmtDate(s.deactivatedAt ?? s.updatedAt ?? s.createdAt);

  const fetchNewsletters = async () => {
    try {
      const resp = await fetch('/api/operator/newsletters');
      const data = await resp.json();
      if (data.success) setNewsletters(data.newsletters);
    } catch {
      // silencio
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchSubscribers = async () => {
    // Datos de fallback por defecto
    const fallbackData = [
      { period: 'Jul', count: 1 },
      { period: 'Ago', count: 3 },
      { period: 'Sep', count: 5 },
      { period: 'Oct', count: 8 }
    ];
    
    try {
      const resp = await fetch('/api/operator/subscribers/stats');
      const data = await resp.json();
      
      console.log('API response:', data);
      
      // Solo usar datos del API si son válidos Y tienen contenido
      if (data.success && data.stats && Array.isArray(data.stats) && data.stats.length > 0) {
        // Transformar los datos del API para que tengan la propiedad "period" en lugar de "month"
        // Y formatear la fecha de "2025-10" a "Oct"
        const transformedStats = data.stats.map((item: any) => {
          const monthName = item.month !== 'Sin datos' 
            ? new Date(item.month + '-01').toLocaleDateString('es-AR', { month: 'short' })
            : item.month;
          return {
            period: monthName.charAt(0).toUpperCase() + monthName.slice(1), // Capitalizar
            count: item.count
          };
        });
        
        console.log('Using transformed API data:', transformedStats);
        setSubscribers(transformedStats);
      } else {
        console.log('API data invalid, using fallback');
        setSubscribers(fallbackData);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      setSubscribers(fallbackData);
    }
  };

  const fetchSubscribersData = async () => {
    try {
      const resp = await fetch('/api/operator/subscribers');
      const data = await resp.json();
      if (data.success) setSubscribersData(data.subscribers);
    } catch {
      // silencio
    } finally {
      setLoadingSubscribers(false);
    }
  };


  const filteredSubscribers = subscribersData.filter((s) => {
    const pass =
      subscriberFilter === 'all' ? true :
      subscriberFilter === 'active' ? s.active :
      !s.active;
    if (!pass) return false;
    if (subscriberSearch.trim())
      return s.email.toLowerCase().includes(subscriberSearch.toLowerCase());
    return true;
  });

  // LÓGICA DE FILTRADO CON BUSCADOR
  const filteredNewsletters = useMemo(() => {
    let filtered = newsletters;

    // Filtrar por categoría
    if (filterOption !== 'all') {
      filtered = filtered.filter(n => n.category === filterOption);
    }

    // Filtrar por búsqueda (asunto o remitente)
    if (newsletterSearch.trim()) {
      const searchLower = newsletterSearch.toLowerCase();
      filtered = filtered.filter(n => 
        n.subject.toLowerCase().includes(searchLower) ||
        n.sender.name.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar por fecha (más reciente primero)
    return filtered.sort((a, b) => 
      new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
  }, [newsletters, filterOption, newsletterSearch]);

  const handleToggleSubscriberStatus = async (subscriberId: string, currentStatus: boolean) => {
    try {
      const resp = await fetch('/api/operator/subscribers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriberId, active: !currentStatus }),
      });
      if (resp.ok) {
        await fetchSubscribersData();
        await fetchSubscribers();
      }
    } catch {
      // silencio
    }
  };

  if (status === 'unauthenticated') return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult(null);

    const htmlContent = `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8">
        <style>
          body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#404040;margin:0;padding:20px;background:#f5f5f5}
          .email-container{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.15)}
          .header{background:#fff;color:#000;padding:30px 20px;text-align:center;border-bottom:1px solid #e5e5e5}
          .header h1{margin:0;font-size:28px;font-weight:600}
          .content{background:#f3eee7;padding:30px}
          .content p{margin:0 0 14px 0;font-size:15px}
          .footer{text-align:center;padding:20px;font-size:12px;color:#999;background:#f5f5f5}
          .footer a{color:#404040;text-decoration:underline}
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header"><h1>Tierra Alta</h1></div>
          <div class="content">${message.replace(/\n/g, '<br>')}</div>
        </div>
        <div class="footer">
          <p><strong>Tierra Alta</strong></p>
          <p>Malbec y General Güemes, Cafayate, Salta, Argentina</p>
          <p>Tel: +54 9 387 5714027 | Email: marcuzzifrancoluciano@gmail.com</p>
          <p style="margin-top:12px;">¿No quieres recibir más emails? <a href="{{UNSUBSCRIBE_URL}}">Desuscribirse</a></p>
        </div>
      </body></html>
    `;

    try {
      const resp = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, htmlContent, category }),
      });
      const data = await resp.json();

      if (resp.ok) {
        setResult({ success: true, sent: data.sent, failed: data.failed, total: data.total });
        setSubject(''); setMessage('');
        fetchNewsletters();
        setTimeout(() => setResult(null), 5000);
      } else {
        setResult({ success: false, error: data.error || 'Error al enviar newsletter' });
      }
    } catch {
      setResult({ success: false, error: 'Error de conexión' });
    } finally {
      setSending(false);
    }
  };

  const activeSubscribersCount = subscribersData.filter(s => s.active).length;

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />

      <section className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        {/* Gestión de Suscriptores */}
        <div className="mb-16">
          <h1 className="text-3xl font-semibold text-black mb-2">Gestión de Suscriptores</h1>
          <div className="h-px w-20 bg-black/20 mb-2" />
          <p className="text-neutral-600">Consulta y gestiona tus suscriptores</p>
          <div className="mb-6"></div>
          <h2 className="text-lg font-semibold text-black mb-4">Resumen de Suscriptores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-sm text-neutral-600 mb-1">Total Suscriptores</p>
              <p className="text-3xl font-bold text-black">{subscribersData.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-sm text-green-700 mb-1">Activos</p>
              <p className="text-3xl font-bold text-green-700">
                {activeSubscribersCount}
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-sm text-red-700 mb-1">Inactivos</p>
              <p className="text-3xl font-bold text-red-700">
                {subscribersData.filter(s => !s.active).length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Línea */}
            <div>
              <h2 className="text-lg font-semibold text-black mb-4">Evolución de Suscriptores</h2>
              <div className="bg-white rounded-lg shadow-sm p-6">
                {subscribers.length > 0 ? (
                  <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={subscribers} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis
                          dataKey="period"
                          stroke="#404040"
                          tick={{ fontSize: 12, fill: '#404040' }}
                          label={{ 
                            value: 'Periodo', 
                            position: 'insideBottom', 
                            offset: -35, 
                            style: { fontSize: 13, fill: '#404040', fontWeight: 500 } 
                          }}
                        />
                        <YAxis
                          stroke="#404040"
                          tick={{ fontSize: 12, fill: '#404040' }}
                          allowDecimals={false}
                          domain={[0, 'auto']}
                          label={{ 
                            value: 'Suscriptores', 
                            angle: -90, 
                            position: 'insideLeft', 
                            style: { fontSize: 13, fill: '#404040', fontWeight: 500, textAnchor: 'middle' } 
                          }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #d4d4d4',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                          labelStyle={{ fontWeight: 600, marginBottom: '4px', color: '#404040' }}
                          itemStyle={{ color: '#404040' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#404040" 
                          strokeWidth={3} 
                          dot={{ r: 5, fill: '#404040', strokeWidth: 2, stroke: '#fff' }} 
                          activeDot={{ r: 7, fill: '#404040', strokeWidth: 2, stroke: '#fff' }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[360px] flex items-center justify-center text-neutral-500">
                    No hay datos para mostrar
                  </div>
                )}
              </div>
            </div>

            {/* Barras Activos vs Inactivos */}
            <div>
              <h2 className="text-lg font-semibold text-black mb-4">Activos vs Inactivos</h2>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-center h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[{ Activos: activeSubscribersCount, Inactivos: subscribersData.filter(s => !s.active).length }]}
                      margin={{ top: 20, right: 30, left: 50, bottom: 40 }}
                      barCategoryGap="250%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey={() => ''} tick={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }}
                        label={{ value: 'Cantidad de suscriptores', angle: -90, position: 'insideLeft', style: { fontSize: 13, fill: '#404040', textAnchor: 'middle' } }} />
                      <Tooltip />
                      <Bar dataKey="Activos" fill="#ECFDF5" stroke="#B9F8CF" strokeWidth={1} radius={[6, 6, 0, 0]} barSize={70} />
                      <Bar dataKey="Inactivos" fill="#FEF2F2" stroke="#FFCACA" strokeWidth={1} radius={[6, 6, 0, 0]} barSize={70} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Buscador + tabla */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Lista de Suscriptores</h3>

            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="mb-3">
                <div className="relative">
                  <input
                    type="text"
                    value={subscriberSearch}
                    onChange={(e) => setSubscriberSearch(e.target.value)}
                    placeholder="Buscar por email..."
                    className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 text-sm"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  {subscriberSearch && (
                    <button onClick={() => setSubscriberSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSubscriberFilter('all')}
                  className={`px-3 py-1 rounded text-xs font-medium  ${
                    subscriberFilter === 'all'
                      ? 'bg-[#404040] border-black text-white'
                      : 'bg-neutral-100 border-transparent text-neutral-700 hover:bg-[#404040] hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setSubscriberFilter('active')}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    subscriberFilter === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-neutral-100 border-transparent text-neutral-700 hover:bg-green-100 hover:text-green-700'
                  }`}
                >
                  Activos
                </button>
                <button
                  onClick={() => setSubscriberFilter('inactive')}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    subscriberFilter === 'inactive'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-neutral-100 border-transparent text-neutral-700 hover:bg-red-100 hover:text-red-700 '
                  }`}
                >
                  Inactivos
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left  text-xs font-medium text-neutral-600 uppercase">Email</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Estado</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Suscripto</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Último cambio</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {loadingSubscribers ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-600">Cargando...</td></tr>
                  ) : filteredSubscribers.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-600">No hay suscriptores</td></tr>
                  ) : (
                    filteredSubscribers.map((s: Subscriber) => (
                      <tr key={s.id} className="hover:bg-neutral-50 transition">
                        <td className="px-4 py-3 text-xs text-neutral-900 truncate max-w-[220px]" title={s.email}>
                          {s.email}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs rounded ${
                            s.active
                              ? 'bg-green-50 border border-green-200 text-green-800'
                              : 'bg-red-50 border border-red-200 text-red-800'
                          }`}>
                            {s.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center text-xs text-neutral-700">
                          {fmtDate(s.createdAt)}
                        </td>

                        <td className="px-4 py-3 text-center text-xs text-neutral-700">
                          {lastStatusChange(s)}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleSubscriberStatus(s.id, s.active)}
                            className={`px-2 py-1 text-xs font-medium rounded transition ${
                              s.active
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {s.active ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="border-t-2 border-neutral-300 pt-12 mt-12"></div>
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-black mb-2">Newsletter</h1>
          <div className="h-px w-20 bg-black/20 mb-2" />
          <p className="text-neutral-600">Envía correos masivos a tus suscriptores</p>
        </div>

        {/* Formulario + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Formulario */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-black mb-4">Enviar Newsletter</h2>
            <div className="bg-white rounded-lg shadow-md p-8">
              <form onSubmit={handleSend} className="space-y-6">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-neutral-700 mb-2">
                    Asunto
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    disabled={sending}
                    placeholder="Ej: Nuevas ofertas de temporada"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 disabled:opacity-50"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Categoría
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                      disabled={sending}
                      className="w-full flex items-center justify-between px-4 py-3 border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#404040]/30 disabled:opacity-50 bg-white hover:bg-neutral-50 transition"
                    >
                      <span className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getCategoryColor(category) }} />
                        <span className="text-neutral-900">{getCategoryLabel(category)}</span>
                      </span>
                      <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className="transition-all duration-300">
                        <line x1="0" y1={categoryMenuOpen ? "8" : "2"} x2="20" y2={categoryMenuOpen ? "8" : "2"} stroke="currentColor" strokeWidth="1.5" className={`${categoryMenuOpen ? 'opacity-0' : ''}`} />
                        <line x1={categoryMenuOpen ? "4" : "0"} y1={categoryMenuOpen ? "2" : "8"} x2={categoryMenuOpen ? "16" : "20"} y2={categoryMenuOpen ? "14" : "8"} stroke="currentColor" strokeWidth="1.5" />
                        <line x1={categoryMenuOpen ? "4" : "0"} y1={categoryMenuOpen ? "14" : "14"} x2={categoryMenuOpen ? "16" : "20"} y2={categoryMenuOpen ? "2" : "14"} stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </button>

                    {categoryMenuOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden z-20">
                        {(Object.entries(CategoryLabels) as [NewsletterCategoryType, string][])
                          .map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => { setCategory(value); setCategoryMenuOpen(false); }}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 transition border-b border-neutral-100 last:border-b-0 flex items-center gap-3 ${
                              category === value ? 'bg-neutral-50 font-medium' : ''
                            }`}
                          >
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getCategoryColor(value) }} />
                            <span>{label}</span>
                            {category === value && (
                              <svg className="ml-auto w-4 h-4 text-[#008236]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-2">
                    Mensaje
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    disabled={sending}
                    rows={9}
                    placeholder="Escribí el contenido de tu newsletter..."
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#404040]/30 resize-none disabled:opacity-50"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={sending || !subject.trim() || !message.trim() || activeSubscribersCount === 0}
                    className={`px-4 py-2 rounded-lg text-sm font-normal transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      sending || !subject.trim() || !message.trim() || activeSubscribersCount === 0
                        ? 'bg-neutral-100 text-black'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {sending ? 'Enviando...' : 'Enviar Newsletter'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSubject(''); setMessage(''); setCategory('GENERAL'); setResult(null); }}
                    disabled={sending}
                    className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-normal hover:bg-neutral-200 transition disabled:opacity-50"
                  >
                    Limpiar
                  </button>
                </div>
              </form>

              {result && (
                <div className={`mt-6 p-4 rounded-lg ${
                  result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {result.success ? (
                    <div>
                      <h3 className="font-semibold text-green-800 mb-2">Newsletter enviada exitosamente</h3>
                      <div className="text-sm text-green-700 space-y-1">
                        <p>✓ Enviados: {result.sent} de {result.total}</p>
                        {result.failed! > 0 && <p>✗ Fallidos: {result.failed}</p>}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-semibold text-red-800 mb-2">Error al enviar</h3>
                      <p className="text-sm text-red-700">{result.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats rápidas */}
          <div>
            <h2 className="text-xl font-semibold text-black mb-4">Estadísticas</h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-sm text-neutral-600 mb-1">Newsletters Enviadas</p>
                <p className="text-3xl font-bold text-black">{newsletters.length}</p>
              </div>

              {newsletters.length > 0 && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <p className="text-sm text-neutral-600 mb-1">Último Envío</p>
                  <p className="text-sm text-neutral-600 mb-1">{newsletters[0].subject}</p>
                  <p className="text-3xl font-bold text-black">
                    {new Date(newsletters[0].sentAt).toLocaleDateString('es-AR', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              )}

              <h3 className="text-lg font-semibold text-black">Distribución por categoría</h3>
              <CategoryPie newsletters={newsletters} />
            </div>
          </div>
        </div>

        {/* Historial con BUSCADOR Y FILTROS */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-black mb-4">Historial de Envíos</h2>

            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="mb-3">
                <div className="relative">
                  <input
                    type="text"
                    value={newsletterSearch}
                    onChange={(e) => setNewsletterSearch(e.target.value)}
                    placeholder="Buscar por asunto o remitente..."
                    className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 text-sm"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  {newsletterSearch && (
                    <button onClick={() => setNewsletterSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                 <button
                  onClick={() => setFilterOption('all')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    filterOption === 'all'
                      ? 'bg-[#404040] text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-[#404040] hover:text-white'
                  }`}
                >
                  Todos
                </button>

                {(Object.entries(CategoryLabels) as [NewsletterCategoryType, string][])
                .map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setFilterOption(value)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      filterOption === value
                        ? `bg-${{
                            PROMOCIONES: 'green',
                            NOVEDADES: 'blue',
                            EVENTOS: 'red',
                            TEMPORADA: 'orange',
                            CONSEJOS: 'purple',
                            GENERAL: 'gray',
                          }[value]}-100 text-${{
                            PROMOCIONES: 'green',
                            NOVEDADES: 'blue',
                            EVENTOS: 'red',
                            TEMPORADA: 'orange',
                            CONSEJOS: 'purple',
                            GENERAL: 'gray',
                          }[value]}-700`
                        : `bg-neutral-100 text-neutral-700 hover:bg-${{
                            PROMOCIONES: 'green',
                            NOVEDADES: 'blue',
                            EVENTOS: 'red',
                            TEMPORADA: 'orange',
                            CONSEJOS: 'purple',
                            GENERAL: 'gray',
                          }[value]}-100 hover:text-${{
                            PROMOCIONES: 'green',
                            NOVEDADES: 'blue',
                            EVENTOS: 'red',
                            TEMPORADA: 'orange',
                            CONSEJOS: 'purple',
                            GENERAL: 'gray',
                          }[value]}-700`
                    }`}
                  >
                    {label}
                  </button>
              ))}
                              
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingHistory ? (
              <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-neutral-600">Cargando historial...</p>
              </div>
            ) : newsletters.length === 0 ? (
              <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-neutral-600">No hay newsletters enviadas aún</p>
              </div>
            ) : filteredNewsletters.length === 0 ? (
              <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-neutral-600">No hay newsletters que coincidan con el filtro</p>
              </div>
            ) : (
              filteredNewsletters.map((n) => (
                <div key={n.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <h3 className="font-semibold text-black line-clamp-2 flex-1 text-base">
                      {n.subject}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap shrink-0 ${CATEGORY_CLASSES[n.category]}`}>
                      {getCategoryLabel(n.category)}
                    </span>
                  </div>

                  <div className="text-xs text-neutral-600 space-y-1.5 mb-4 border-t border-neutral-100 pt-3">
                    <p><span className="text-neutral-500">Por:</span> {n.sender.name}</p>
                    <p><span className="text-neutral-500">Destinatarios:</span> <span className="font-medium text-neutral-900">{n.sentTo}</span></p>
                    <p className="text-neutral-500">{new Date(n.sentAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>

                  <button
                    onClick={() => setSelectedNewsletter(selectedNewsletter?.id === n.id ? null : n)}
                    className="text-xs px-3 py-2 bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 transition w-full font-medium"
                  >
                    {selectedNewsletter?.id === n.id ? 'Ocultar contenido' : 'Ver contenido'}
                  </button>

                  {selectedNewsletter?.id === n.id && (
                    <div className="mt-4 border border-neutral-200 rounded-lg overflow-hidden">
                      <iframe
                        srcDoc={n.content}
                        className="w-full h-[500px] bg-white"
                        sandbox="allow-same-origin"
                        title="Newsletter preview"
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}