import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/newsletter/unsubscribe
 * Desactiva a un suscriptor usando un token de desuscripción.
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token requerido' },
        { status: 400 }
      );
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: { unsubscribeToken: token }
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 404 }
      );
    }

    if (!subscriber.active) {
      return NextResponse.json({
        success: true,
        alreadyUnsubscribed: true
      });
    }

    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { 
        active: false,
        deactivatedAt: new Date(), // Guardar fecha
      }
    });

    return NextResponse.json({
      success: true,
      alreadyUnsubscribed: false
    });
  } catch (error) {
    console.error('Error al desuscribir:', error);
    return NextResponse.json(
      { error: 'Error al procesar la desuscripción' },
      { status: 500 }
    );
  }
}