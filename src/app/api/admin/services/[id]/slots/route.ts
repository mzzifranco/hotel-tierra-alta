import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/services/[id]/slots
 * Lista todos los slots de un servicio con filtros opcionales
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'OPERATOR')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // 2. Obtener parámetros
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const onlyAvailable = searchParams.get('onlyAvailable') === 'true';

    // 3. Construir filtros
    const where: any = {
      serviceId: id,
    };

    // Filtro por rango de fechas
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    // Filtro solo disponibles
    if (onlyAvailable) {
      where.isAvailable = true;
    }

    // 4. Obtener slots
    const slots = await prisma.serviceTimeSlot.findMany({
      where,
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // 5. Formatear respuesta con info útil
    const formattedSlots = slots.map((slot) => ({
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity,
      booked: slot.booked,
      available: slot.capacity - slot.booked,
      isAvailable: slot.isAvailable,
      utilizationPercent: Math.round((slot.booked / slot.capacity) * 100),
      status: slot.booked >= slot.capacity ? 'FULL' : slot.booked > 0 ? 'PARTIAL' : 'EMPTY',
    }));

    // 6. Estadísticas generales
    const stats = {
      total: slots.length,
      available: slots.filter((s) => s.isAvailable).length,
      disabled: slots.filter((s) => !s.isAvailable).length,
      full: formattedSlots.filter((s) => s.status === 'FULL').length,
      empty: formattedSlots.filter((s) => s.status === 'EMPTY').length,
      partial: formattedSlots.filter((s) => s.status === 'PARTIAL').length,
      totalCapacity: slots.reduce((sum, s) => sum + s.capacity, 0),
      totalBooked: slots.reduce((sum, s) => sum + s.booked, 0),
    };

    return NextResponse.json({
      success: true,
      slots: formattedSlots,
      stats,
    });
  } catch (error) {
    console.error('Error al obtener slots:', error);
    return NextResponse.json(
      { error: 'Error al obtener slots' },
      { status: 500 }
    );
  }
}