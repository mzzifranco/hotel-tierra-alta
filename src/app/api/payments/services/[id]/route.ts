import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/payments/services/[id]
 * Obtiene los datos del pago de un servicio
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

    // Obtener el pago con toda la información relacionada
    const payment = await prisma.servicePayment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            service: true,
            reservation: {
              include: {
                room: {
                  select: {
                    number: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el pago pertenece al usuario
    if (payment.userId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver este pago' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Error al obtener pago de servicio:', error);
    return NextResponse.json(
      { error: 'Error al cargar los datos del pago' },
      { status: 500 }
    );
  }
}