// src/app/api/payments/[id]/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        reservation: {
          include: {
            room: {
              select: {
                number: true,
                type: true,
                price: true,
                images: true,
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

    // Verificar permisos
    const userRole = (session.user as any).role;
    const isOwner = payment.userId === (session.user as any).id;
    const isStaff = userRole === 'OPERATOR' || userRole === 'ADMIN';

    if (!isOwner && !isStaff) {
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
    console.error('Error obteniendo pago:', error);
    return NextResponse.json(
      { error: 'Error al obtener el pago' },
      { status: 500 }
    );
  }
}