import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/services/[id]
 * Obtiene el detalle de una reserva de servicio específica
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Obtener la reserva de servicio
    const serviceBooking = await prisma.serviceBooking.findUnique({
      where: {
        id,
      },
      include: {
        service: true,
        reservation: {
          include: {
            room: {
              select: {
                id: true,
                number: true,
                type: true,
                floor: true,
                capacity: true,
              },
            },
          },
        },
        payment: true,
        timeSlot: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!serviceBooking) {
      return NextResponse.json(
        { error: 'Reserva de servicio no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la reserva pertenece al usuario
    if (serviceBooking.userId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver esta reserva' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: serviceBooking,
    });
  } catch (error) {
    console.error('Error al obtener detalle de servicio:', error);
    return NextResponse.json(
      { error: 'Error al cargar el detalle del servicio' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/services/[id]
 * Cancela una reserva de servicio
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Obtener la reserva de servicio
    const serviceBooking = await prisma.serviceBooking.findUnique({
      where: { id },
      include: {
        payment: true,
      },
    });

    if (!serviceBooking) {
      return NextResponse.json(
        { error: 'Reserva de servicio no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la reserva pertenece al usuario
    if (serviceBooking.userId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para cancelar esta reserva' },
        { status: 403 }
      );
    }

    // Verificar que se puede cancelar
    if (serviceBooking.status === 'CANCELLED' || serviceBooking.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Esta reserva no puede ser cancelada' },
        { status: 400 }
      );
    }

    // No permitir cancelación si el pago fue aprobado
    if (serviceBooking.payment?.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Esta reserva tiene un pago aprobado. Contacta con el hotel para cancelar.' },
        { status: 400 }
      );
    }

    // Actualizar el estado de la reserva a CANCELLED
    await prisma.serviceBooking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Reserva de servicio cancelada exitosamente',
    });
  } catch (error) {
    console.error('Error al cancelar servicio:', error);
    return NextResponse.json(
      { error: 'Error al cancelar la reserva de servicio' },
      { status: 500 }
    );
  }
}