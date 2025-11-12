import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Convierte un string de fecha a objeto Date local (sin problemas de zona horaria)
 * Evita que JavaScript interprete la fecha como UTC
 */
function parseLocalDate(dateString: string): Date {
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// POST - Crear nueva reserva
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para hacer una reserva' },
        { status: 401 }
      );
    }

    const { roomId, checkIn, checkOut, guests, specialRequests } = await request.json();

    if (!roomId || !checkIn || !checkOut || !guests) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(guests) || guests < 1) {
      return NextResponse.json(
        { error: 'El número de huéspedes debe ser un entero mayor a 0' },
        { status: 400 }
      );
    }

    if (guests > 10) {
      return NextResponse.json(
        { error: 'El número máximo de huéspedes por reserva es 10' },
        { status: 400 }
      );
    }

    // Convertir strings de fecha a objetos Date locales
    const checkInDate = parseLocalDate(checkIn);
    const checkOutDate = parseLocalDate(checkOut);

    // Validar formato de fechas
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { error: 'Fechas inválidas' },
        { status: 400 }
      );
    }

    // Calcular noches y validar mínimo
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const timeDifference = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.round(timeDifference / millisecondsPerDay);

    if (nights < 1) {
      return NextResponse.json(
        { 
          error: 'La reserva debe ser de al menos 1 noche. La fecha de salida debe ser al menos 1 día después de la fecha de entrada.' 
        },
        { status: 400 }
      );
    }

    if (nights > 365) {
      return NextResponse.json(
        { error: 'La reserva no puede exceder 365 noches' },
        { status: 400 }
      );
    }

    // Validar que check-in no sea en el pasado
    const todayString = new Date().toISOString().split('T')[0];
    const today = parseLocalDate(todayString);
    
    if (checkInDate < today) {
      return NextResponse.json(
        { error: 'La fecha de entrada no puede ser en el pasado' },
        { status: 400 }
      );
    }

    // No permitir reservas con más de 2 años de anticipación
    const maxAdvanceDate = new Date(today);
    maxAdvanceDate.setFullYear(maxAdvanceDate.getFullYear() + 2);
    
    if (checkInDate > maxAdvanceDate) {
      return NextResponse.json(
        { error: 'No se pueden hacer reservas con más de 2 años de anticipación' },
        { status: 400 }
      );
    }

    // Usar transacción para evitar condiciones de carrera
    const result = await prisma.$transaction(async (tx) => {
      // Verificar habitación Y conflictos DENTRO de la transacción
      const room = await tx.room.findUnique({
        where: { id: roomId },
        include: {
          reservations: {
            where: {
              status: {
                in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
              },
              // Buscar reservas que SE SOLAPAN usando lógica inversa
              NOT: {
                OR: [
                  // La reserva existente termina antes o cuando empieza la nueva
                  { checkOut: { lte: checkInDate } },
                  // La reserva existente empieza después o cuando termina la nueva
                  { checkIn: { gte: checkOutDate } }
                ]
              }
            },
          },
        },
      });

      // Validaciones de la habitación
      if (!room) {
        throw new Error('Habitación no encontrada');
      }

      if (room.status === 'CLOSED' || room.status === 'MAINTENANCE') {
        throw new Error('Esta habitación no está disponible actualmente');
      }

      if (guests > room.capacity) {
        throw new Error(`Esta habitación tiene capacidad máxima de ${room.capacity} personas`);
      }

      // Verificar conflictos de fechas
      if (room.reservations.length > 0) {
        const conflictingReservation = room.reservations[0];
        const conflictCheckIn = conflictingReservation.checkIn.toISOString().split('T')[0];
        const conflictCheckOut = conflictingReservation.checkOut.toISOString().split('T')[0];
        
        // Usar parseLocalDate para formatear correctamente
        const conflictCheckInFormatted = parseLocalDate(conflictCheckIn).toLocaleDateString('es-AR');
        const conflictCheckOutFormatted = parseLocalDate(conflictCheckOut).toLocaleDateString('es-AR');
        
        throw new Error(
          `Esta habitación ya está reservada del ${conflictCheckInFormatted} al ${conflictCheckOutFormatted}`
        );
      }

      // Calcular precio total
      const totalPrice = room.price * nights;

      if (totalPrice <= 0) {
        throw new Error('Error en el cálculo del precio total');
      }

      // Crear la reserva
      const reservation = await tx.reservation.create({
        data: {
          checkIn: checkInDate,
          checkOut: checkOutDate,
          totalPrice,
          guests,
          specialRequests: specialRequests || null,
          status: 'PENDING',
          userId: (session.user as any).id,
          roomId: room.id,
        },
        include: {
          room: {
            select: {
              number: true,
              type: true,
              price: true,
            },
          },
        },
      });

      // Crear registro de pago pendiente
      await tx.payment.create({
        data: {
          amount: totalPrice,
          currency: 'ARS',
          status: 'PENDING',
          reservationId: reservation.id,
          userId: (session.user as any).id,
        },
      });

      return { reservation, nights };
    }); // Fin de la transacción

    return NextResponse.json({
      success: true,
      message: 'Reserva creada exitosamente',
      reservation: {
        id: result.reservation.id,
        checkIn: result.reservation.checkIn,
        checkOut: result.reservation.checkOut,
        totalPrice: result.reservation.totalPrice,
        guests: result.reservation.guests,
        status: result.reservation.status,
        room: result.reservation.room,
        nights: result.nights,
      },
    });
  } catch (error: any) {
    console.error('Error creando reserva:', error);

    // Manejo mejorado de errores
    if (error.message && !error.code) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una reserva con estos datos' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear la reserva' },
      { status: 500 }
    );
  }
}