import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Endpoint PATCH: actualiza una reserva de servicio existente según su ID.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const updateData: any = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
      
      if (body.status === 'CONFIRMED') {
        updateData.confirmedAt = new Date();
      } else if (body.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      } else if (body.status === 'CANCELLED') {
        updateData.cancelledAt = new Date();
      }
    }

    if (body.staffNotes !== undefined) {
      updateData.staffNotes = body.staffNotes;
    }

    const booking = await prisma.serviceBooking.update({
      where: { id },
      data: updateData,
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
      },
    });

    return NextResponse.json({
      success: true,
      booking,
      message: 'Reserva actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    return NextResponse.json(
      { error: 'Error al actualizar reserva' },
      { status: 500 }
    );
  }
}