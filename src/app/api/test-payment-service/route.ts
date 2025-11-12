import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/test-payment-service
 * Aprueba un pago de servicio de forma instantánea (solo para desarrollo/testing)
 */
export async function POST(request: Request) {
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

    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID de pago requerido' },
        { status: 400 }
      );
    }

    // Buscar el pago
    const payment = await prisma.servicePayment.findUnique({
      where: { id: paymentId },
      include: {
        booking: true,
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
        { error: 'No tienes permiso para aprobar este pago' },
        { status: 403 }
      );
    }

    // Verificar que el pago está pendiente
    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Este pago ya fue procesado' },
        { status: 400 }
      );
    }

    // Actualizar el pago a APPROVED
    await prisma.servicePayment.update({
      where: { id: paymentId },
      data: {
        status: 'APPROVED',
        paymentMethod: 'test',
        transactionId: `TEST-${Date.now()}`,
        paidAt: new Date(),
      },
    });

    // Actualizar el estado de la reserva de servicio a CONFIRMED
    await prisma.serviceBooking.update({
      where: { id: payment.bookingId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pago de servicio aprobado exitosamente',
    });
  } catch (error) {
    console.error('Error al aprobar pago de prueba:', error);
    return NextResponse.json(
      { error: 'Error al procesar el pago de prueba' },
      { status: 500 }
    );
  }
}