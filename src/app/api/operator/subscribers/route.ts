import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Obtener todos los suscriptores
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const subscribers = await prisma.subscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const subscribersWithStatusChangedAt = subscribers.map((s) => ({
      ...s,
      statusChangedAt: s.deactivatedAt ?? s.updatedAt ?? s.createdAt,
    }));

    return NextResponse.json({
      success: true,
      subscribers: subscribersWithStatusChangedAt,
    });
  } catch (error) {
    console.error('Error obteniendo suscriptores:', error);
    return NextResponse.json(
      { error: 'Error al obtener suscriptores' },
      { status: 500 }
    );
  }
}

// PATCH - Activar/Desactivar suscriptor
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { subscriberId, active } = await request.json();

    await prisma.subscriber.update({
      where: { id: subscriberId },
      data: { 
        active,
        deactivatedAt: active ? null : new Date(), // Guardar fecha de desactivación
      },
    });

    return NextResponse.json({
      success: true,
      message: `Suscriptor ${active ? 'activado' : 'desactivado'} exitosamente`,
    });
  } catch (error) {
    console.error('Error actualizando suscriptor:', error);
    return NextResponse.json(
      { error: 'Error al actualizar suscriptor' },
      { status: 500 }
    );
  }
}