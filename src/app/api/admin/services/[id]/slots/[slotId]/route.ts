import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * PATCH /api/admin/services/[id]/slots/[slotId]
 * Edita un slot específico (capacidad, disponibilidad, etc.)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  try {
    // 1. Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'OPERATOR')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // 2. Obtener parámetros
    const { id: serviceId, slotId } = await params;
    const body = await req.json();

    // 3. Verificar que el slot existe y pertenece al servicio
    const existingSlot = await prisma.serviceTimeSlot.findFirst({
      where: {
        id: slotId,
        serviceId: serviceId,
      },
    });

    if (!existingSlot) {
      return NextResponse.json(
        { error: 'Slot no encontrado' },
        { status: 404 }
      );
    }

    // 4. Preparar datos para actualizar
    const updateData: any = {};

    // Cambiar disponibilidad
    if (typeof body.isAvailable === 'boolean') {
      updateData.isAvailable = body.isAvailable;
    }

    // Cambiar capacidad (validar que no sea menor a reservas actuales)
    if (body.capacity !== undefined) {
      const newCapacity = parseInt(body.capacity);
      
      if (newCapacity < existingSlot.booked) {
        return NextResponse.json(
          { 
            error: `No puedes reducir la capacidad a ${newCapacity}. Ya hay ${existingSlot.booked} reservas confirmadas.` 
          },
          { status: 400 }
        );
      }

      updateData.capacity = newCapacity;
    }

    // 5. Actualizar el slot
    const updatedSlot = await prisma.serviceTimeSlot.update({
      where: { id: slotId },
      data: updateData,
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      slot: {
        id: updatedSlot.id,
        date: updatedSlot.date,
        startTime: updatedSlot.startTime,
        endTime: updatedSlot.endTime,
        capacity: updatedSlot.capacity,
        booked: updatedSlot.booked,
        available: updatedSlot.capacity - updatedSlot.booked,
        isAvailable: updatedSlot.isAvailable,
      },
      message: 'Slot actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar slot:', error);
    return NextResponse.json(
      { error: 'Error al actualizar slot' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/services/[id]/slots/[slotId]
 * Elimina un slot específico (solo si no tiene reservas)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  try {
    // 1. Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'OPERATOR')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // 2. Obtener parámetros
    const { id: serviceId, slotId } = await params;

    // 3. Verificar que el slot existe y pertenece al servicio
    const existingSlot = await prisma.serviceTimeSlot.findFirst({
      where: {
        id: slotId,
        serviceId: serviceId,
      },
    });

    if (!existingSlot) {
      return NextResponse.json(
        { error: 'Slot no encontrado' },
        { status: 404 }
      );
    }

    // 4. Verificar que no tenga reservas
    if (existingSlot.booked > 0) {
      return NextResponse.json(
        { 
          error: `No puedes eliminar este slot. Tiene ${existingSlot.booked} reservas confirmadas. Desactívalo en su lugar.` 
        },
        { status: 400 }
      );
    }

    // 5. Eliminar el slot
    await prisma.serviceTimeSlot.delete({
      where: { id: slotId },
    });

    return NextResponse.json({
      success: true,
      message: 'Slot eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar slot:', error);
    return NextResponse.json(
      { error: 'Error al eliminar slot' },
      { status: 500 }
    );
  }
}