import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions, isStaff } from '@/lib/auth';

// POST - Marcar habitación como limpia o sucia
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: roomId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = session.user as { role: string };
    if (!isStaff(user.role as any)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { action } = await request.json();

    // Validar acción
    if (!action || !['mark_clean', 'mark_dirty'].includes(action)) {
      return NextResponse.json(
        { error: 'Acción inválida. Use: mark_clean o mark_dirty' },
        { status: 400 }
      );
    }

    // Obtener habitación actual
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        reservations: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
            },
          },
          orderBy: {
            checkIn: 'asc',
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Habitación no encontrada' },
        { status: 404 }
      );
    }

    // Definir el nuevo estado basado en la acción
    let newStatus: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE' | 'CLOSED';

    if (action === 'mark_clean') {
      // Validar que la habitación esté en CLEANING
      if (room.status !== 'CLEANING') {
        return NextResponse.json(
          { 
            error: `No se puede marcar como limpia. Estado actual: ${room.status}. Solo se pueden limpiar habitaciones en estado CLEANING.` 
          },
          { status: 400 }
        );
      }

      // Verificar si hay reservas activas o que inician hoy
      const now = new Date();
      const hasActiveReservation = room.reservations.some(
        (res) => res.checkIn <= now && res.checkOut > now
      );

      if (hasActiveReservation) {
        // Hay huésped actualmente, marcar como OCCUPIED
        newStatus = 'OCCUPIED';
      } else {
        // No hay huésped, marcar como AVAILABLE
        newStatus = 'AVAILABLE';
      }

    } else if (action === 'mark_dirty') {
      // Marcar como que necesita limpieza
      if (room.status === 'CLOSED' || room.status === 'MAINTENANCE') {
        return NextResponse.json(
          { 
            error: `No se puede marcar para limpieza. La habitación está en ${room.status}` 
          },
          { status: 400 }
        );
      }
      newStatus = 'CLEANING';
    } else {
      return NextResponse.json(
        { error: 'Acción no válida' },
        { status: 400 }
      );
    }

    // Actualizar estado de la habitación
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: { status: newStatus },
    });

    return NextResponse.json({
      success: true,
      message: action === 'mark_clean' 
        ? 'Habitación marcada como limpia'
        : 'Habitación marcada para limpieza',
      room: {
        id: updatedRoom.id,
        number: updatedRoom.number,
        status: updatedRoom.status,
        floor: updatedRoom.floor,
        type: updatedRoom.type,
      },
    });
  } catch (error) {
    console.error('Error actualizando estado de limpieza:', error);
    return NextResponse.json(
      { error: 'Error al actualizar estado de limpieza' },
      { status: 500 }
    );
  }
}

// GET - Obtener lista de habitaciones que necesitan limpieza
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = session.user as { role: string };
    if (!isStaff(user.role as any)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener todas las habitaciones en estado CLEANING
    const roomsNeedingCleaning = await prisma.room.findMany({
      where: {
        status: 'CLEANING',
      },
      orderBy: [
        { floor: 'asc' },
        { number: 'asc' },
      ],
      include: {
        reservations: {
          where: {
            status: 'CHECKED_OUT',
            checkOut: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
            },
          },
          orderBy: {
            checkOut: 'desc',
          },
          take: 1,
        },
      },
    });

    const roomsWithInfo = roomsNeedingCleaning.map((room) => ({
      id: room.id,
      number: room.number,
      type: room.type,
      floor: room.floor,
      status: room.status,
      lastCheckOut: room.reservations[0]?.checkOut || null,
    }));

    return NextResponse.json({
      success: true,
      rooms: roomsWithInfo,
      total: roomsWithInfo.length,
    });
  } catch (error) {
    console.error('Error obteniendo habitaciones para limpieza:', error);
    return NextResponse.json(
      { error: 'Error al obtener habitaciones para limpieza' },
      { status: 500 }
    );
  }
}