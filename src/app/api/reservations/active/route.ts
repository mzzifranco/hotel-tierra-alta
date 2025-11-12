import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/reservations/active
 * Obtiene las reservas de habitación activas del usuario (confirmadas o pendientes)
 * Para poder asociar servicios a estas reservas
 */
export async function GET() {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener fecha actual
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obtener reservas activas (no canceladas y que no hayan pasado)
    const activeReservations = await prisma.reservation.findMany({
      where: {
        userId: user.id,
        status: {
          in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
        },
        checkOut: {
          gte: today, // Que el checkout sea mayor o igual a hoy
        },
      },
      include: {
        room: {
          select: {
            number: true,
            type: true,
          },
        },
      },
      orderBy: {
        checkIn: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      reservations: activeReservations,
    });
  } catch (error) {
    console.error('Error al obtener reservas activas:', error);
    return NextResponse.json(
      { error: 'Error al cargar las reservas activas' },
      { status: 500 }
    );
  }
}