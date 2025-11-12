import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RoomStatus, RoomType } from '@prisma/client';

// PATCH - Actualizar habitación
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();

    // Verificar que la habitación existe
    const existingRoom = await prisma.room.findUnique({
      where: { id },
    });

    if (!existingRoom) {
      return NextResponse.json(
        { error: 'Habitación no encontrada' },
        { status: 404 }
      );
    }

    // Si se está cambiando el número, verificar que no exista otro con ese número
    if (data.number && data.number !== existingRoom.number) {
      const duplicateRoom = await prisma.room.findUnique({
        where: { number: data.number },
      });

      if (duplicateRoom) {
        return NextResponse.json(
          { error: 'Ya existe una habitación con ese número' },
          { status: 400 }
        );
      }
    }

    // Validar tipo si se está actualizando
    if (data.type) {
      const validTypes: RoomType[] = ['SUITE_SINGLE', 'SUITE_DOUBLE', 'VILLA_PETIT', 'VILLA_GRANDE'];
      if (!validTypes.includes(data.type)) {
        return NextResponse.json(
          { error: 'Tipo de habitación inválido' },
          { status: 400 }
        );
      }
    }

    // Validar estado si se está actualizando
    if (data.status) {
      const validStatuses: RoomStatus[] = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING', 'CLOSED'];
      if (!validStatuses.includes(data.status)) {
        return NextResponse.json(
          { error: 'Estado inválido' },
          { status: 400 }
        );
      }
    }

    // Construir objeto de actualización
    const updateData: any = {};
    if (data.number !== undefined) updateData.number = data.number;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.price !== undefined) updateData.price = parseFloat(data.price);
    if (data.capacity !== undefined) updateData.capacity = parseInt(data.capacity);
    if (data.floor !== undefined) updateData.floor = parseInt(data.floor);
    if (data.amenities !== undefined) updateData.amenities = data.amenities;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;

    const room = await prisma.room.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Habitación actualizada exitosamente',
      room,
    });
  } catch (error) {
    console.error('Error actualizando habitación:', error);
    return NextResponse.json(
      { error: 'Error al actualizar habitación' },
      { status: 500 }
    );
  }
}

// DELETE - Cambiar estado a CLOSED (no eliminar físicamente)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;

    // Verificar que la habitación existe
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        reservations: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
            },
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Habitación no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que no tenga reservas activas
    if (room.reservations.length > 0) {
      return NextResponse.json(
        { error: 'No se puede cerrar una habitación con reservas activas' },
        { status: 400 }
      );
    }

    // Cambiar estado a CLOSED en lugar de eliminar
    const updatedRoom = await prisma.room.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Habitación cerrada exitosamente',
      room: updatedRoom,
    });
  } catch (error) {
    console.error('Error cerrando habitación:', error);
    return NextResponse.json(
      { error: 'Error al cerrar habitación' },
      { status: 500 }
    );
  }
}