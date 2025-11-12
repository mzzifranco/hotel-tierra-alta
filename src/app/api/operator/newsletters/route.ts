import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions, isStaff } from '@/lib/auth';

// GET /api/newsletters
// Devuelve todas las newsletters enviadas, accesible solo a usuarios con rol de staff (ADMIN u OPERATOR).
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = session.user as { role: string };
    if (!isStaff(user.role as any)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const newsletters = await prisma.newsletter.findMany({
      include: {
        sender: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      newsletters,
    });
  } catch (error) {
    console.error('Error obteniendo newsletters:', error);
    return NextResponse.json(
      { error: 'Error al obtener newsletters' },
      { status: 500 }
    );
  }
}