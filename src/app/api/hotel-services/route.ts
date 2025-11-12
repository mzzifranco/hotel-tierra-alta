import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/hotel-services
 * Obtiene servicios filtrados por tipo
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = searchParams.get('limit');

    // Construir filtros
    const where: any = {
      isActive: true,
    };

    if (type) {
      where.type = type;
    }

    // Opciones de consulta
    const queryOptions: any = {
      where,
      orderBy: {
        createdAt: 'desc',
      },
    };

    if (limit) {
      queryOptions.take = parseInt(limit);
    }

    // Obtener servicios
    const services = await prisma.hotelService.findMany(queryOptions);

    return NextResponse.json({
      success: true,
      services,
      count: services.length,
    });
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    return NextResponse.json(
      { error: 'Error al cargar los servicios' },
      { status: 500 }
    );
  }
}