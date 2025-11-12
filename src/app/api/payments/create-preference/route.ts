import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { preference } from '@/lib/mercadopago';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      );
    }

    const { reservationId } = await request.json();

    if (!reservationId) {
      return NextResponse.json(
        { error: 'ID de reserva requerido' },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        room: true,
        user: true,
        payment: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    if (reservation.userId !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'No tienes permiso para pagar esta reserva' },
        { status: 403 }
      );
    }

    if (reservation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Esta reserva no puede ser pagada' },
        { status: 400 }
      );
    }

    if (!reservation.payment || reservation.payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'El pago no está pendiente' },
        { status: 400 }
      );
    }

    // Crear preferencia de pago en MercadoPago
    const preferenceData: any = {
      items: [
        {
          id: reservation.room.id,
          title: `Habitación ${reservation.room.type} - ${reservation.room.number}`,
          description: `Check-in: ${new Date(reservation.checkIn).toLocaleDateString('es-AR')} | Check-out: ${new Date(reservation.checkOut).toLocaleDateString('es-AR')}`,
          quantity: 1,
          unit_price: reservation.totalPrice,
          currency_id: 'ARS',
        },
      ],
      payer: {
        name: reservation.user.name,
        email: reservation.user.email,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success?reservationId=${reservation.id}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/payments/failure?reservationId=${reservation.id}`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/payments/pending?reservationId=${reservation.id}`,
      },
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      external_reference: reservation.payment.id,
      statement_descriptor: 'Tierra Alta',
      metadata: {
        reservation_id: reservation.id,
        payment_id: reservation.payment.id,
        user_id: reservation.userId,
      },
    };

    // Solo agregar teléfono si existe
    if (reservation.user.phone) {
      preferenceData.payer.phone = {
        number: reservation.user.phone,
      };
    }

    console.log('Creando preferencia con URLs:', {
      success: preferenceData.back_urls.success,
      failure: preferenceData.back_urls.failure,
      pending: preferenceData.back_urls.pending,
    });

    const response = await preference.create({ body: preferenceData });

    await prisma.payment.update({
      where: { id: reservation.payment.id },
      data: {
        mercadoPagoId: response.id,
        mercadoPagoData: response as any,
      },
    });

    return NextResponse.json({
      success: true,
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point,
    });
  } catch (error: any) {
    console.error('Error creando preferencia de pago:', error);
    return NextResponse.json(
      { error: 'Error al crear la preferencia de pago', details: error.message },
      { status: 500 }
    );
  }
}