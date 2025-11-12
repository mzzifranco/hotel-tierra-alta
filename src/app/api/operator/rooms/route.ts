import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions, isStaff } from '@/lib/auth';

/**
 * POST /api/rooms/[id]/status
 * Cambia el estado operativo de una habitación según la acción recibida.
 * Requiere usuario autenticado con rol de staff.
 */
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

    if (!action) {
      return NextResponse.json(
        { error: 'Se requiere especificar una acción' },
        { status: 400 }
      );
    }

    // VALIDACIÓN: Acciones válidas
    const validActions = ['OPEN', 'CLOSED', 'MAINTENANCE', 'CLEANING', 'DIRTY', 'CLEAN'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { 
          error: `Acción inválida. Acciones permitidas: ${validActions.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Usar transacción para consistencia
    const result = await prisma.$transaction(async (tx) => {
      // Obtener habitación actual con reservas
      const room = await tx.room.findUnique({
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
        throw new Error('Habitación no encontrada');
      }

      // Analizar estado de las reservas
      const now = new Date();
      const hasCheckedIn = room.reservations.some((res) => res.status === 'CHECKED_IN');
      const hasActiveReservations = room.reservations.length > 0;
      const hasFutureReservations = room.reservations.some((res) => res.checkIn > now);
      const nextCheckIn = room.reservations[0]?.checkIn;

      let newStatus: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE' | 'CLOSED';
      let validationMessage = '';

      // VALIDACIONES por acción
      switch (action) {
        case 'OPEN':
          if (room.status !== 'CLOSED') {
            throw new Error(
              `No se puede abrir una habitación en estado ${room.status}. Solo se pueden abrir habitaciones CLOSED.`
            );
          }

          if (hasActiveReservations) {
            newStatus = 'CLEANING';
            validationMessage = 'Habitación abierta pero marcada para limpieza (tiene reservas pendientes)';
          } else {
            newStatus = 'AVAILABLE';
            validationMessage = 'Habitación abierta y disponible';
          }
          break;

        case 'CLOSED':
          if (hasCheckedIn) {
            throw new Error(
              'No se puede cerrar una habitación con huésped actualmente alojado. Por favor, espera al check-out.'
            );
          }

          if (hasActiveReservations) {
            const daysUntilNext = nextCheckIn 
              ? Math.ceil((nextCheckIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              : 0;

            throw new Error(
              `No se puede cerrar. Hay ${room.reservations.length} reserva(s) activa(s). ` +
              `Próxima reserva en ${daysUntilNext} día(s). Cancela las reservas primero.`
            );
          }

          newStatus = 'CLOSED';
          validationMessage = 'Habitación cerrada exitosamente';
          break;

        case 'MAINTENANCE':
          if (hasCheckedIn) {
            throw new Error(
              'No se puede poner en mantenimiento con huésped dentro. Espera al check-out.'
            );
          }

          if (room.status === 'CLOSED') {
            throw new Error(
              'No se puede poner en mantenimiento una habitación cerrada. Primero ábrela.'
            );
          }

          if (hasFutureReservations && nextCheckIn) {
            const daysUntilNext = Math.ceil(
              (nextCheckIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilNext <= 3) {
              validationMessage = `⚠️ ADVERTENCIA: Próxima reserva en ${daysUntilNext} día(s). Asegúrate de terminar el mantenimiento a tiempo.`;
            }
          }

          newStatus = 'MAINTENANCE';
          break;

        case 'CLEANING':
        case 'DIRTY':
          if (room.status === 'CLOSED') {
            throw new Error(
              'No se puede limpiar una habitación cerrada. Primero ábrela.'
            );
          }

          if (hasCheckedIn) {
            throw new Error(
              'No se puede marcar para limpieza con huésped dentro. Espera al check-out.'
            );
          }

          newStatus = 'CLEANING';
          validationMessage = 'Habitación marcada para limpieza';
          break;

        case 'CLEAN':
          if (room.status !== 'CLEANING') {
            throw new Error(
              `No se puede marcar como limpia desde estado ${room.status}. Solo habitaciones en CLEANING pueden marcarse como limpias.`
            );
          }

          if (hasCheckedIn) {
            newStatus = 'OCCUPIED';
            validationMessage = 'Habitación limpia y ocupada (hay huésped)';
          } else {
            newStatus = 'AVAILABLE';
            validationMessage = 'Habitación limpia y disponible';
          }
          break;

        default:
          throw new Error('Acción no reconocida');
      }

      // Actualizar estado de la habitación
      const updatedRoom = await tx.room.update({
        where: { id: roomId },
        data: { status: newStatus },
      });

      return {
        room: updatedRoom,
        message: validationMessage,
        reservationInfo: {
          hasActiveReservations,
          hasCheckedIn,
          totalActiveReservations: room.reservations.length,
          nextCheckIn: nextCheckIn || null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      message: result.message || `Habitación actualizada a ${result.room.status}`,
      room: {
        id: result.room.id,
        number: result.room.number,
        status: result.room.status,
        floor: result.room.floor,
        type: result.room.type,
      },
      reservationInfo: result.reservationInfo,
    });
  } catch (error: any) {
    console.error('Error actualizando habitación:', error);

    if (error.message && !error.code) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar habitación' },
      { status: 500 }
    );
  }
}