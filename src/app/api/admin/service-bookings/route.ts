import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Endpoint GET: obtiene todas las reservas de servicios (serviceBookings)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'OPERATOR')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const bookings = await prisma.serviceBooking.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        reservation: {
          select: {
            id: true,
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
            amount: true,
            status: true,
            paymentMethod: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error('Error al obtener reservas de servicios:', error);
    return NextResponse.json(
      { error: 'Error al cargar reservas' },
      { status: 500 }
    );
  }
}