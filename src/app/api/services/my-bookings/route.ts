import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/services/my-bookings
 * Obtiene todas las reservas de servicios del usuario autenticado
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

    // Obtener todas las reservas de servicios del usuario
    const serviceBookings = await prisma.serviceBooking.findMany({
      where: {
        userId: user.id,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            category: true,
            price: true,
            duration: true,
            images: true,
            mainImage: true,
          },
        },
        reservation: {
          select: {
            id: true,
            checkIn: true,
            checkOut: true,
            room: {
              select: {
                number: true,
                type: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            paymentMethod: true,
          },
        },
        timeSlot: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        bookingDate: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      bookings: serviceBookings,
    });
  } catch (error) {
    console.error('Error al obtener reservas de servicios:', error);
    return NextResponse.json(
      { error: 'Error al cargar las reservas de servicios' },
      { status: 500 }
    );
  }
}