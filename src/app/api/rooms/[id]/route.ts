import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener una habitación por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // AGREGAR AWAIT
    
    const room = await prisma.room.findUnique({
      where: { id }, // USAR LA VARIABLE
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
        status: true,
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Habitación no encontrada' },
        { status: 404 }
      );
    }

    if (room.status === 'CLOSED' || room.status === 'MAINTENANCE') {
      return NextResponse.json(
        { error: 'Esta habitación no está disponible actualmente' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error('Error obteniendo habitación:', error);
    return NextResponse.json(
      { error: 'Error al obtener la habitación' },
      { status: 500 }
    );
  }
}