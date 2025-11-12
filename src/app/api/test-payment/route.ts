import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID requerido' },
        { status: 400 }
      );
    }

    // Actualizar el pago
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'APPROVED',
        paymentMethod: 'credit_card',
        transactionId: 'TEST-' + Date.now(),
      },
    });

    // Obtener la reserva
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (payment) {
      // Actualizar la reserva
      await prisma.reservation.update({
        where: { id: payment.reservationId },
        data: {
          status: 'CONFIRMED',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Pago aprobado (TEST)',
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error:', err);
    return NextResponse.json(
      { error: err.message || 'Error al procesar pago de prueba' },
      { status: 500 }
    );
  }
}