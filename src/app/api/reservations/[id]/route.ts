import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Convierte un string de fecha a objeto Date local (sin problemas de zona horaria)
 */
function parseLocalDate(dateString: string | Date): Date {
  if (dateString instanceof Date) return dateString;
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// GET - Obtener una reserva por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        room: {
          select: {
            id: true,
            number: true,
            type: true,
            price: true,
            capacity: true,
            floor: true,
            amenities: true,
            images: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            paymentMethod: true,
            transactionId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario sea dueño de la reserva o sea staff
    const userRole = (session.user as any).role;
    const isOwner = reservation.userId === (session.user as any).id;
    const isStaff = userRole === 'OPERATOR' || userRole === 'ADMIN';

    if (!isOwner && !isStaff) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver esta reserva' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      reservation,
    });
  } catch (error) {
    console.error('Error obteniendo reserva:', error);
    return NextResponse.json(
      { error: 'Error al obtener la reserva' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar estado de la reserva (solo para staff)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    const isStaff = userRole === 'OPERATOR' || userRole === 'ADMIN';

    if (!isStaff) {
      return NextResponse.json(
        { error: 'No tienes permiso para realizar esta acción' },
        { status: 403 }
      );
    }

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'El estado es requerido' },
        { status: 400 }
      );
    }

    // Validar que el estado sea válido
    const validStatuses = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      );
    }

    // Usar transacción para actualizar reserva Y habitación
    const result = await prisma.$transaction(async (tx) => {
      // Obtener la reserva actual
      const currentReservation = await tx.reservation.findUnique({
        where: { id },
        include: { room: true },
      });

      if (!currentReservation) {
        throw new Error('Reserva no encontrada');
      }

      // ✅ CORRECCIÓN: Validar transiciones de estado con fecha local
      const todayString = new Date().toISOString().split('T')[0];
      const now = parseLocalDate(todayString);
      const checkInDate = parseLocalDate(currentReservation.checkIn.toISOString());
      
      // No permitir confirmar reservas pasadas
      if (status === 'CONFIRMED' && checkInDate < now) {
        throw new Error('No puedes confirmar una reserva cuya fecha ya pasó');
      }

      // No permitir check-in si la fecha no ha llegado
      if (status === 'CHECKED_IN' && checkInDate > now) {
        throw new Error('No puedes hacer check-in antes de la fecha de entrada');
      }

      // Actualizar la reserva
      const updatedReservation = await tx.reservation.update({
        where: { id },
        data: { status },
        include: {
          room: {
            select: {
              number: true,
              type: true,
            },
          },
        },
      });

      // Sincronizar estado de la habitación según el nuevo estado de la reserva
      let newRoomStatus = currentReservation.room.status;

      switch (status) {
        case 'CHECKED_IN':
          // Huésped hizo check-in → habitación ocupada
          newRoomStatus = 'OCCUPIED';
          break;
        
        case 'CHECKED_OUT':
          // Huésped hizo check-out → habitación necesita limpieza
          newRoomStatus = 'CLEANING';
          break;
        
        case 'CANCELLED':
          // Reserva cancelada → verificar si hay otras reservas activas
          const activeReservations = await tx.reservation.findMany({
            where: {
              roomId: currentReservation.roomId,
              id: { not: id },
              status: {
                in: ['CONFIRMED', 'CHECKED_IN'],
              },
            },
          });

          // Si no hay otras reservas activas, marcar como disponible
          if (activeReservations.length === 0) {
            newRoomStatus = 'AVAILABLE';
          }
          break;

        case 'CONFIRMED':
          // Reserva confirmada pero no check-in todavía
          // Mantener estado actual si no es AVAILABLE
          if (currentReservation.room.status === 'AVAILABLE') {
            newRoomStatus = 'AVAILABLE';
          }
          break;
      }

      // Actualizar estado de la habitación si cambió
      if (newRoomStatus !== currentReservation.room.status) {
        await tx.room.update({
          where: { id: currentReservation.roomId },
          data: { status: newRoomStatus },
        });
      }

      return {
        reservation: updatedReservation,
        roomStatus: newRoomStatus,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Estado de reserva actualizado',
      reservation: result.reservation,
      roomStatusUpdated: result.roomStatus,
    });
  } catch (error: any) {
    console.error('Error actualizando reserva:', error);

    if (error.message && !error.code) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar la reserva' },
      { status: 500 }
    );
  }
}

// DELETE - Cancelar reserva
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      );
    }

    // Usar transacción para cancelar Y actualizar habitación
    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id },
        include: {
          payment: true,
          room: true,
        },
      });

      if (!reservation) {
        throw new Error('Reserva no encontrada');
      }

      // Verificar permisos
      const userRole = (session.user as any).role;
      const isOwner = reservation.userId === (session.user as any).id;
      const isStaff = userRole === 'OPERATOR' || userRole === 'ADMIN';

      if (!isOwner && !isStaff) {
        throw new Error('No tienes permiso para cancelar esta reserva');
      }

      // Solo se pueden cancelar reservas PENDING o CONFIRMED
      if (!['PENDING', 'CONFIRMED'].includes(reservation.status)) {
        throw new Error('No se puede cancelar esta reserva en su estado actual');
      }

      // Si hay un pago aprobado, no se puede cancelar
      if (reservation.payment?.status === 'APPROVED') {
        throw new Error('No se puede cancelar una reserva con pago aprobado. Contacta al hotel.');
      }

      // Cancelar la reserva
      const updatedReservation = await tx.reservation.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Verificar si hay otras reservas activas para esta habitación
      const activeReservations = await tx.reservation.findMany({
        where: {
          roomId: reservation.roomId,
          id: { not: id },
          status: {
            in: ['CONFIRMED', 'CHECKED_IN'],
          },
        },
      });

      // Si no hay otras reservas activas, liberar la habitación
      if (activeReservations.length === 0 && reservation.room.status === 'OCCUPIED') {
        await tx.room.update({
          where: { id: reservation.roomId },
          data: { status: 'AVAILABLE' },
        });
      }

      return updatedReservation;
    });

    return NextResponse.json({
      success: true,
      message: 'Reserva cancelada exitosamente',
      reservation: result,
    });
  } catch (error: any) {
    console.error('Error cancelando reserva:', error);

    if (error.message && !error.code) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al cancelar la reserva' },
      { status: 500 }
    );
  }
}