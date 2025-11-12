import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar que sea admin u operador
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'OPERATOR')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Obtener el ID del servicio
    const { id } = await params;
    
    // 3. Obtener las fechas del body
    const { startDate, endDate } = await req.json();

    // 4. Validar fechas
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 });
    }

    if (start >= end) {
      return NextResponse.json(
        { error: 'La fecha de inicio debe ser anterior a la fecha de fin' },
        { status: 400 }
      );
    }

    // 5. Obtener el servicio
    const service = await prisma.hotelService.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    // 6. Mapeo de días
    const dayMap: { [key: string]: number } = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    };

    // 7. Generar slots día por día
    const slots = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      // Obtener el nombre del día (MONDAY, TUESDAY, etc.)
      const dayName = Object.keys(dayMap).find(
        (key) => dayMap[key] === currentDate.getDay()
      );

      // Verificar si el servicio está disponible este día
      if (dayName && service.availableDays.includes(dayName)) {
        // Convertir horas a minutos para facilitar cálculos
        const [startHour, startMinute] = service.startTime.split(':').map(Number);
        const [endHour, endMinute] = service.endTime.split(':').map(Number);

        let currentTime = startHour * 60 + startMinute; // minutos desde medianoche
        const endTime = endHour * 60 + endMinute;

        // Generar slots para este día
        while (currentTime + service.duration <= endTime) {
          // Calcular hora de inicio del slot
          const slotStartHour = Math.floor(currentTime / 60);
          const slotStartMinute = currentTime % 60;
          
          // Calcular hora de fin del slot
          const slotEndTime = currentTime + service.duration;
          const slotEndHour = Math.floor(slotEndTime / 60);
          const slotEndMinute = slotEndTime % 60;

          // Formatear como HH:MM
          const startTimeStr = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute
            .toString()
            .padStart(2, '0')}`;
          const endTimeStr = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute
            .toString()
            .padStart(2, '0')}`;

          // Verificar si ya existe este slot
          const existingSlot = await prisma.serviceTimeSlot.findFirst({
            where: {
              serviceId: id,
              date: new Date(currentDate),
              startTime: startTimeStr,
            },
          });

          // Solo agregar si no existe
          if (!existingSlot) {
            slots.push({
              serviceId: id,
              date: new Date(currentDate),
              startTime: startTimeStr,
              endTime: endTimeStr,
              capacity: service.maxCapacity,
              booked: 0,
              isAvailable: true,
            });
          }

          // Avanzar al siguiente slot
          currentTime += service.slotInterval;
        }
      }

      // Avanzar al siguiente día
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 8. Crear todos los slots en la base de datos
    if (slots.length > 0) {
      await prisma.serviceTimeSlot.createMany({
        data: slots,
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Slots generados exitosamente',
      count: slots.length,
    });

  } catch (error) {
    console.error('Error al generar slots:', error);
    return NextResponse.json(
      { error: 'Error al generar slots' },
      { status: 500 }
    );
  }
}