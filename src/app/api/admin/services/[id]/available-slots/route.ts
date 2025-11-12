import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Obtener el ID del servicio
    const { id } = await params;
    
    // 2. Obtener la fecha de los query params
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    // 3. Validar que se envió una fecha
    if (!date) {
      return NextResponse.json(
        { error: 'Fecha requerida' },
        { status: 400 }
      );
    }

    // 4. Convertir la fecha a objeto Date
    const targetDate = new Date(date);
    
    // Validar que sea una fecha válida
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: 'Fecha inválida' },
        { status: 400 }
      );
    }

    // 5. Establecer la fecha al inicio del día (00:00:00)
    targetDate.setHours(0, 0, 0, 0);

    // 6. Calcular el día siguiente para el rango
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // 7. Buscar todos los slots de ese día
    const slots = await prisma.serviceTimeSlot.findMany({
      where: {
        serviceId: id,
        date: {
          gte: targetDate, // mayor o igual a 00:00:00
          lt: nextDay,     // menor a 00:00:00 del día siguiente
        },
        isAvailable: true, // solo los que están activos
      },
      orderBy: {
        startTime: 'asc', // ordenar por hora de inicio
      },
      include: {
        _count: {
          select: {
            bookings: true, // contar las reservas asociadas
          },
        },
      },
    });

    // 8. Filtrar solo los slots que tienen capacidad disponible
    const availableSlots = slots
      .filter((slot) => slot.booked < slot.capacity)
      .map((slot) => ({
        id: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        booked: slot.booked,
        available: slot.capacity - slot.booked, // lugares disponibles
      }));

    // 9. Retornar los slots disponibles
    return NextResponse.json({
      success: true,
      date: targetDate,
      slots: availableSlots,
      total: availableSlots.length,
    });

  } catch (error) {
    console.error('Error al obtener slots disponibles:', error);
    return NextResponse.json(
      { error: 'Error al obtener slots disponibles' },
      { status: 500 }
    );
  }
}