import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Listar todos los usuarios (solo ADMIN)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = session.user as { role: string };
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado. Solo administradores.' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            reservations: true,
            consultations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar rol de usuario (solo ADMIN)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = session.user as { id: string; role: string };
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado. Solo administradores.' }, { status: 403 });
    }

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'ID de usuario y rol son requeridos' },
        { status: 400 }
      );
    }

    // Validar que el rol sea válido
    if (!['USER', 'OPERATOR', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      );
    }

    // Prevenir que un admin se quite a sí mismo el rol de admin
    if (userId === user.id && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No puedes cambiar tu propio rol de administrador' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error actualizando usuario:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

// PUT - Activar/Desactivar usuario (solo ADMIN)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = session.user as { id: string; role: string };
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado. Solo administradores.' }, { status: 403 });
    }

    const { userId, active } = await request.json();

    if (!userId || typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'ID de usuario y estado son requeridos' },
        { status: 400 }
      );
    }

    // Prevenir que un admin se desactive a sí mismo
    if (userId === user.id && !active) {
      return NextResponse.json(
        { error: 'No puedes desactivar tu propia cuenta' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { active },
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error cambiando estado de usuario:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error al cambiar estado del usuario' },
      { status: 500 }
    );
  }
}