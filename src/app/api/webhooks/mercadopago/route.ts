import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { payment as mpPayment } from '@/lib/mercadopago';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('Webhook recibido de MercadoPago:', body);

    // MercadoPago envía el tipo de notificación
    const { type, data } = body;

    // Solo procesamos notificaciones de pago
    if (type === 'payment') {
      const paymentId = data.id;

      // Obtener información del pago de MercadoPago
      const mpPaymentData = await mpPayment.get({ id: paymentId });

      console.log('Datos del pago de MP:', mpPaymentData);

      // Buscar el payment en nuestra base de datos usando external_reference
      const externalReference = mpPaymentData.external_reference;

      if (!externalReference) {
        console.error('No se encontró external_reference en el pago');
        return NextResponse.json({ error: 'External reference no encontrado' }, { status: 400 });
      }

      const payment = await prisma.payment.findUnique({
        where: { id: externalReference },
        include: {
          reservation: true,
        },
      });

      if (!payment) {
        console.error('Payment no encontrado en BD:', externalReference);
        return NextResponse.json({ error: 'Payment no encontrado' }, { status: 404 });
      }

      // Actualizar el estado del pago según el estado de MercadoPago
      let newPaymentStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED' = 'PENDING';
      let newReservationStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' = 'PENDING';

      switch (mpPaymentData.status) {
        case 'approved':
          newPaymentStatus = 'APPROVED';
          newReservationStatus = 'CONFIRMED';
          break;
        case 'rejected':
        case 'cancelled':
          newPaymentStatus = 'REJECTED';
          newReservationStatus = 'CANCELLED';
          break;
        case 'refunded':
          newPaymentStatus = 'REFUNDED';
          newReservationStatus = 'CANCELLED';
          break;
        case 'pending':
        case 'in_process':
        case 'in_mediation':
          newPaymentStatus = 'PENDING';
          newReservationStatus = 'PENDING';
          break;
      }

      // Actualizar el pago
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newPaymentStatus,
          paymentMethod: mpPaymentData.payment_method_id || null,
          transactionId: paymentId.toString(),
          mercadoPagoData: mpPaymentData as any,
        },
      });

      // Actualizar el estado de la reserva
      await prisma.reservation.update({
        where: { id: payment.reservationId },
        data: {
          status: newReservationStatus,
        },
      });

      console.log(`Pago ${payment.id} actualizado a ${newPaymentStatus}`);
      console.log(`Reserva ${payment.reservationId} actualizada a ${newReservationStatus}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error procesando webhook:', error);
    return NextResponse.json(
      { error: 'Error procesando webhook', details: error.message },
      { status: 500 }
    );
  }
}

// GET para verificar que el endpoint está activo
export async function GET() {
  return NextResponse.json({
    message: 'Webhook de MercadoPago activo',
    timestamp: new Date().toISOString(),
  });
}