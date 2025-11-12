import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RoomType, RoomStatus } from '@prisma/client';

// GET - Listar todas las habitaciones (incluidas cerradas/mantenimiento)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const rooms = await prisma.room.findMany({
      include: {
        _count: {
          select: {
            reservations: {
              where: {
                status: {
                  in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
                },
              },
            },
          },
        },
      },
      orderBy: {
        number: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      rooms,
    });
  } catch (error) {
    console.error('Error obteniendo habitaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener habitaciones' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva habitación
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { number, type, price, capacity, floor, amenities, images, description } = await request.json();

    // Validaciones
    if (!number || !type || !price || !capacity || floor === undefined) {
      return NextResponse.json(
        { error: 'Campos requeridos: number, type, price, capacity, floor' },
        { status: 400 }
      );
    }

    // Verificar que el número de habitación no exista
    const existingRoom = await prisma.room.findUnique({
      where: { number },
    });

    if (existingRoom) {
      return NextResponse.json(
        { error: 'Ya existe una habitación con ese número' },
        { status: 400 }
      );
    }

    // Validar tipo de habitación
    const validTypes: RoomType[] = ['SUITE_SINGLE', 'SUITE_DOUBLE', 'VILLA_PETIT', 'VILLA_GRANDE'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de habitación inválido' },
        { status: 400 }
      );
    }

    // Crear habitación
    const room = await prisma.room.create({
      data: {
        number,
        type,
        price: parseFloat(price),
        capacity: parseInt(capacity),
        floor: parseInt(floor),
        amenities: amenities || [],
        images: images || [],
        description: description || null,
        status: 'AVAILABLE',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Habitación creada exitosamente',
      room,
    });
  } catch (error: any) {
    console.error('Error creando habitación:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una habitación con ese número' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear habitación' },
      { status: 500 }
    );
  }
}