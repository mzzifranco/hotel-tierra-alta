import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Convierte un string de fecha a objeto Date local (sin problemas de zona horaria)
 */
function parseLocalDate(dateString: string): Date {
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// GET - Buscar habitaciones disponibles
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const guests = searchParams.get('guests');
    const type = searchParams.get('type');

    // Validar fechas requeridas
    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Fechas de check-in y check-out son requeridas' },
        { status: 400 }
      );
    }

    //Usar parseLocalDate en lugar de new Date()
    const checkInDate = parseLocalDate(checkIn);
    const checkOutDate = parseLocalDate(checkOut);

    // Validar que las fechas sean válidas
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { error: 'Fechas inválidas' },
        { status: 400 }
      );
    }

    // Validar que check-out sea después de check-in
    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: 'La fecha de salida debe ser posterior a la fecha de entrada' },
        { status: 400 }
      );
    }

    //Validar que check-in no sea en el pasado usando fecha local
    const todayString = new Date().toISOString().split('T')[0];
    const today = parseLocalDate(todayString);
    
    if (checkInDate < today) {
      return NextResponse.json(
        { error: 'La fecha de entrada no puede ser en el pasado' },
        { status: 400 }
      );
    }

    // Construir filtros
    const filters: any = {
      status: {
        in: ['AVAILABLE', 'OCCUPIED'], // Incluimos OCCUPIED porque puede estar disponible para fechas futuras
      },
    };

    if (guests) {
      filters.capacity = {
        gte: parseInt(guests),
      };
    }

    if (type && type !== 'all') {
      filters.type = type;
    }

    // Obtener todas las habitaciones que cumplen los filtros básicos
    const rooms = await prisma.room.findMany({
      where: filters,
      include: {
        reservations: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
            },
            // Buscar reservas que se solapan con las fechas solicitadas
            OR: [
              {
                AND: [
                  { checkIn: { lte: checkInDate } },
                  { checkOut: { gt: checkInDate } },
                ],
              },
              {
                AND: [
                  { checkIn: { lt: checkOutDate } },
                  { checkOut: { gte: checkOutDate } },
                ],
              },
              {
                AND: [
                  { checkIn: { gte: checkInDate } },
                  { checkOut: { lte: checkOutDate } },
                ],
              },
            ],
          },
        },
      },
    });

    // Filtrar habitaciones que NO tienen reservas en conflicto
    const availableRooms = rooms.filter(room => room.reservations.length === 0);

    //Calcular noches usando Math.round en lugar de Math.ceil
    const nights = Math.round(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const roomsWithPricing = availableRooms.map(room => ({
      id: room.id,
      number: room.number,
      type: room.type,
      price: room.price,
      capacity: room.capacity,
      floor: room.floor,
      amenities: room.amenities,
      images: room.images,
      description: room.description,
      status: room.status,
      nights,
      totalPrice: room.price * nights,
    }));

    return NextResponse.json({
      success: true,
      rooms: roomsWithPricing,
      searchParams: {
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        nights,
        guests: guests ? parseInt(guests) : null,
        type: type || 'all',
      },
    });
  } catch (error) {
    console.error('Error buscando habitaciones:', error);
    return NextResponse.json(
      { error: 'Error al buscar habitaciones disponibles' },
      { status: 500 }
    );
  }
}