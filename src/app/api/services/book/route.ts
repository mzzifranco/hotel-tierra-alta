import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/services/book
 * Crea una reserva de servicio asociada a una reserva de habitación con validación de TimeSlots
 */
export async function POST(request: Request) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // 3. Obtener datos del body
    const body = await request.json();
    const {
      serviceId,
      reservationId,
      bookingDate,
      bookingTime,
      participants,
      specialRequests,
    } = body;

    // 4. Validaciones básicas
    if (!serviceId || !reservationId || !bookingDate || !bookingTime || !participants) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // 5. Verificar que el servicio existe y está activo
    const service = await prisma.hotelService.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    if (!service.isActive) {
      return NextResponse.json(
        { error: 'Este servicio no está disponible actualmente' },
        { status: 400 }
      );
    }

    // 6. Verificar que la reserva existe y pertenece al usuario
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reserva de habitación no encontrada' },
        { status: 404 }
      );
    }

    if (reservation.userId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para usar esta reserva' },
        { status: 403 }
      );
    }

    // 7. Verificar que la reserva está activa
    if (reservation.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'No puedes reservar servicios en una reserva cancelada' },
        { status: 400 }
      );
    }

    // 8. Validar número de participantes
    if (participants < service.minCapacity || participants > service.maxCapacity) {
      return NextResponse.json(
        { 
          error: `El número de participantes debe estar entre ${service.minCapacity} y ${service.maxCapacity}` 
        },
        { status: 400 }
      );
    }

    // 9. Validar que la fecha del servicio esté dentro del rango de la reserva
    const serviceDate = new Date(bookingDate);
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);

    // Normalizar fechas (sin hora)
    serviceDate.setHours(0, 0, 0, 0);
    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);

    if (serviceDate < checkIn || serviceDate >= checkOut) {
      return NextResponse.json(
        { error: 'La fecha del servicio debe estar dentro de tu estadía' },
        { status: 400 }
      );
    }

    // 10. BUSCAR EL TIMESLOT
    let timeSlot = await prisma.serviceTimeSlot.findFirst({
      where: {
        serviceId,
        date: serviceDate,
        startTime: bookingTime,
      },
    });

    // 11. SI NO EXISTE EL TIMESLOT, CREARLO (fallback automático)
    if (!timeSlot) {
      console.log(`⚠️ TimeSlot no encontrado para ${bookingTime}, creando uno nuevo...`);
      
      // Calcular endTime basado en la duración del servicio
      const [hours, minutes] = bookingTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + service.duration;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes
        .toString()
        .padStart(2, '0')}`;

      timeSlot = await prisma.serviceTimeSlot.create({
        data: {
          serviceId,
          date: serviceDate,
          startTime: bookingTime,
          endTime,
          capacity: service.maxCapacity,
          booked: 0,
          isAvailable: true,
        },
      });

      console.log(`TimeSlot creado: ${timeSlot.id}`);
    }

    // 12. VERIFICAR DISPONIBILIDAD EN EL TIMESLOT
    if (!timeSlot.isAvailable) {
      return NextResponse.json(
        { error: 'Este horario no está disponible' },
        { status: 400 }
      );
    }

    // 13. VERIFICAR CAPACIDAD DISPONIBLE
    const availableCapacity = timeSlot.capacity - timeSlot.booked;
    
    if (availableCapacity <= 0) {
      return NextResponse.json(
        { error: 'Este horario está completamente reservado' },
        { status: 400 }
      );
    }

    if (participants > availableCapacity) {
      return NextResponse.json(
        { error: `Solo quedan ${availableCapacity} ${availableCapacity === 1 ? 'lugar' : 'lugares'} disponibles en este horario` },
        { status: 400 }
      );
    }

    // 14. Calcular precio total
    const totalPrice = service.pricePerPerson 
      ? service.price * participants 
      : service.price;

    // 15. CREAR LA RESERVA CON TRANSACCIÓN (garantiza atomicidad)
    const result = await prisma.$transaction(async (tx) => {
      // Crear la reserva del servicio
      const serviceBooking = await tx.serviceBooking.create({
        data: {
          serviceId,
          timeSlotId: timeSlot!.id, // Asociar con el TimeSlot
          userId: user.id,
          reservationId,
          bookingDate: serviceDate,
          bookingTime,
          participants,
          totalPrice,
          specialRequests: specialRequests || null,
          status: 'PENDING',
        },
        include: {
          service: true,
          reservation: {
            include: {
              room: true,
            },
          },
          timeSlot: true, // Incluir el TimeSlot en la respuesta
        },
      });

      // 16. ACTUALIZAR EL CONTADOR DE RESERVAS EN EL TIMESLOT
      await tx.serviceTimeSlot.update({
        where: { id: timeSlot!.id },
        data: {
          booked: {
            increment: participants,
          },
        },
      });

      // 17. Crear el registro de pago pendiente
      const payment = await tx.servicePayment.create({
        data: {
          bookingId: serviceBooking.id,
          userId: user.id,
          amount: totalPrice,
          currency: 'ARS',
          status: 'PENDING',
        },
      });

      return { serviceBooking, payment };
    });

    console.log(`✅ Reserva creada exitosamente: ${result.serviceBooking.id}`);
    console.log(`✅ TimeSlot actualizado: ${timeSlot.booked} -> ${timeSlot.booked + participants}`);

    return NextResponse.json({
      success: true,
      booking: result.serviceBooking,
      payment: result.payment,
      message: 'Reserva de servicio creada exitosamente',
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error al crear reserva de servicio:', error);
    return NextResponse.json(
      { error: 'Error al crear la reserva de servicio' },
      { status: 500 }
    );
  }
}