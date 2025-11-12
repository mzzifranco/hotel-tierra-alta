import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions, isStaff } from '@/lib/auth';

/**
 * GET /api/subscribers/stats/monthly
 * Devuelve conteo ACUMULADO de suscriptores por fin de cada mes (UTC).
 * Requiere usuario staff.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    const user = session.user as { role: string };
    if (!isStaff(user.role as any)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    // Trae solo createdAt, ordenado
    const all = await prisma.subscriber.findMany({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    if (all.length === 0) {
      return NextResponse.json({ success: true, stats: [{ month: 'Sin datos', count: 0 }] });
    }

    // Utilidades mes (UTC)
    const startOfMonthUTC = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
    const endOfMonthUTC   = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    let current = startOfMonthUTC(new Date(all[0].createdAt));
    const now = new Date();

    const stats: { month: string; count: number }[] = [];
    let i = 0; // puntero acumulado

    while (current <= now) {
      const end = endOfMonthUTC(current);

      // avanza acumulado hasta fin de mes
      while (i < all.length && all[i].createdAt <= end) i++;

      const y = current.getUTCFullYear();
      const m = String(current.getUTCMonth() + 1).padStart(2, '0');
      stats.push({ month: `${y}-${m}`, count: i }); // acumulado total hasta fin de mes

      // siguiente mes
      current = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 1));
    }

    return NextResponse.json({ success: true, stats });
  } catch (e) {
    console.error('Error obteniendo estadísticas de suscriptores (mensual):', e);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
