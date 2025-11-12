'use client';

import { useState, useEffect, Fragment } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Message {
  id: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  body: string;
  status: 'OPEN' | 'REPLIED' | 'ARCHIVED';
  receivedAt: string;
  bookingCode: string | null;
  replyBody: string | null;
  repliedAt: string | null;
  repliedBy: {
    name: string;
  } | null;
}

export default function OperatorMessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchMessages();
    }
  }, [status, router]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/operator/messages');
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages);
      } else {
        console.error('Error en la respuesta:', data.error);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (messageId: string) => {
    if (!replyText.trim()) {
      alert('Por favor escribe una respuesta');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/operator/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          replyBody: replyText,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Actualizar el mensaje localmente sin recargar
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === messageId
              ? {
                  ...msg,
                  status: 'REPLIED' as const,
                  replyBody: replyText,
                  repliedAt: new Date().toISOString(),
                  repliedBy: { name: session?.user?.name || 'Usuario' },
                }
              : msg
          )
        );
        setReplyText('');
        setSelectedMessage(null);
      } else {
        alert(data.error || 'Error al enviar respuesta');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Error al enviar respuesta');
    } finally {
      setSending(false);
    }
  };

  const handleArchive = async (messageId: string) => {
    try {
      const response = await fetch('/api/operator/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          status: 'ARCHIVED',
        }),
      });

      if (response.ok) {
        // Actualizar solo el mensaje localmente sin recargar
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === messageId ? { ...msg, status: 'ARCHIVED' as const } : msg
          )
        );
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error archivando mensaje:', error);
    }
  };

  const handleUnarchive = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      const newStatus = message?.replyBody ? 'REPLIED' : 'OPEN';
      
      const response = await fetch('/api/operator/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        // Actualizar solo el mensaje localmente sin recargar
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === messageId ? { ...msg, status: newStatus as 'OPEN' | 'REPLIED' } : msg
          )
        );
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error desarchivando mensaje:', error);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    const passesState =
      filter === 'all'
        ? msg.status !== 'ARCHIVED'
        : msg.status === filter;

    if (!passesState) return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSubject = msg.subject.toLowerCase().includes(query);
      const matchesName = msg.fromName?.toLowerCase().includes(query);
      const matchesEmail = msg.fromEmail.toLowerCase().includes(query);
      const matchesBooking = msg.bookingCode?.toLowerCase().includes(query);
      return matchesSubject || matchesName || matchesEmail || matchesBooking;
    }

    return true;
  });

  const stats = {
    total: messages.length,
    open: messages.filter((m) => m.status === 'OPEN').length,
    replied: messages.filter((m) => m.status === 'REPLIED').length,
    archived: messages.filter((m) => m.status === 'ARCHIVED').length,
  };

  // Función para aclarar el color hacia pastel
  const tintHex = (hex: string, t = 0.9) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    const [r, g, b] = [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)];
    const mix = (c: number) => Math.round(c + (255 - c) * t);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  };

  const pieData = [
    { name: 'Pendientes', value: stats.open, color: '#eab308' },
    { name: 'Respondidos', value: stats.replied, color: '#22c55e' },
    { name: 'Archivados', value: stats.archived, color: '#ef4444' },
  ];

  return (
    <main className="min-h-screen bg-[#f3eee7]">
      <Header />

      <section className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-black mb-2">Gestión de Mensajes</h1>
          <div className="h-px w-20 bg-black/20 mb-2" />
          <p className="text-neutral-600">Responde consultas de clientes</p>
        </div>

        {/* Estadísticas y gráfico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col h-full">
            <h2 className="text-xl font-semibold text-black mb-4">
              Resumen de Mensajes
            </h2>
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-sm text-neutral-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-black">{stats.total}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <p className="text-sm text-yellow-700 mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-700">{stats.open}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <p className="text-sm text-green-700 mb-1">Respondidos</p>
                <p className="text-3xl font-bold text-green-700">{stats.replied}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-sm text-red-700 mb-1">Archivados</p>
                <p className="text-3xl font-bold text-red-700">{stats.archived}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-black mb-4">
              Distribución por estado
            </h2>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              {stats.total > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={0}
                    >
                      {pieData.map((entry, index) => (
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
                placeholder="Buscar por asunto, nombre, email o código de reserva..."
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
              Todos
            </button>
            <button
              onClick={() => setFilter('OPEN')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'OPEN'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-yellow-100 hover:text-yellow-700'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFilter('REPLIED')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'REPLIED'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-green-100 hover:text-green-700'
              }`}
            >
              Respondidos
            </button>
            <button
              onClick={() => setFilter('ARCHIVED')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'ARCHIVED'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-red-100 hover:text-red-700'
              }`}
            >
              Archivados
            </button>
          </div>
        </div>

        {/* Lista de Mensajes */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            {filteredMessages.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600 uppercase">Asunto</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600 uppercase">De</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Fecha</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Estado</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredMessages.map((message) => (
                    <Fragment key={message.id}>
                      <tr className="hover:bg-neutral-50 transition">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-black">{message.subject}</p>
                            {message.bookingCode && (
                              <p className="text-xs text-neutral-500">Reserva: {message.bookingCode}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-neutral-900">{message.fromName}</p>
                          <p className="text-xs text-neutral-500" title={message.fromEmail}>
                            {message.fromEmail}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-neutral-700">
                          {new Date(message.receivedAt).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs rounded ${
                            message.status === 'OPEN'
                              ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                              : message.status === 'REPLIED'
                              ? 'bg-green-50 border border-green-200 text-green-800'
                              : 'bg-red-50 border border-red-200 text-red-800'
                          }`}>
                            {message.status === 'OPEN' ? 'Pendiente' : message.status === 'REPLIED' ? 'Respondido' : 'Archivado'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => setSelectedMessage(selectedMessage?.id === message.id ? null : message)}
                              className="px-2 py-1 text-xs font-medium rounded transition bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                            >
                              {selectedMessage?.id === message.id ? 'Cerrar' : 'Ver'}
                            </button>
                            {message.status === 'OPEN' && (
                              <button
                                onClick={() => handleArchive(message.id)}
                                className="px-2 py-1 text-xs font-medium rounded transition bg-red-100 text-red-700 hover:bg-red-200"
                              >
                                Archivar
                              </button>
                            )}
                            {message.status === 'REPLIED' && (
                              <button
                                onClick={() => handleArchive(message.id)}
                                className="px-2 py-1 text-xs font-medium rounded transition bg-red-100 text-red-700 hover:bg-red-200"
                              >
                                Archivar
                              </button>
                            )}
                            {message.status === 'ARCHIVED' && (
                              <button
                                onClick={() => handleUnarchive(message.id)}
                                className="px-2 py-1 text-xs font-medium rounded transition bg-green-100 text-green-700 hover:bg-green-200"
                              >
                                Activar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {/* Detalles expandibles */}
                      {selectedMessage?.id === message.id && (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 bg-neutral-50">
                            <div className="space-y-4">
                              {/* Mensaje original */}
                              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                <p className="text-xs font-medium text-neutral-600 mb-2">Mensaje:</p>
                                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{message.body}</p>
                              </div>

                              {/* Respuesta si existe */}
                              {message.replyBody && (
                                <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                                  <p className="text-xs text-green-700 font-medium mb-2">
                                    Respondido por {message.repliedBy?.name} el{' '}
                                    {message.repliedAt &&
                                      new Date(message.repliedAt).toLocaleDateString('es-AR', {
                                        day: 'numeric',
                                        month: 'long',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                  </p>
                                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">{message.replyBody}</p>
                                </div>
                              )}

                              {/* Formulario de respuesta para mensajes pendientes */}
                              {message.status === 'OPEN' && (
                                <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                  <p className="text-xs font-medium text-neutral-600 mb-2">Responder:</p>
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Escribe tu respuesta aquí. Se enviará un email automático al cliente."
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none text-sm"
                                    rows={5}
                                  />
                                  <div className="flex gap-2 mt-3">
                                    <button
                                      onClick={() => handleReply(message.id)}
                                      disabled={sending || !replyText.trim()}
                                      className={`px-4 py-2 rounded text-xs font-medium transition ${
                                        sending || !replyText.trim()
                                          ? 'bg-[#FAFAFA] text-[#808080] cursor-not-allowed'
                                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                                      }`}
                                    >
                                      {sending ? 'Enviando...' : 'Enviar Respuesta'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedMessage(null);
                                        setReplyText('');
                                      }}
                                      disabled={sending}
                                      className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium rounded transition disabled:opacity-50"
                                    > 
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              )}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-neutral-600 text-lg">No hay mensajes que coincidan con el filtro</p>
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

      <Footer />
    </main>
  );
}