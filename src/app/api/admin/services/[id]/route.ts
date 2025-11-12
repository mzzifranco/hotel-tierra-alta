import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/services/[id]
 * Obtiene un servicio específico
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const service = await prisma.hotelService.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error('Error al obtener servicio:', error);
    return NextResponse.json(
      { error: 'Error al cargar el servicio' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/services/[id]
 * Actualiza un servicio (completo o parcial)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();

    // Preparar datos para actualizar (solo los que vengan en el body)
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.shortDescription !== undefined) updateData.shortDescription = body.shortDescription?.trim() || null;
    
    // Validar tipo y categoría si vienen
    if (body.type !== undefined) {
      if (!['SPA', 'EXPERIENCE'].includes(body.type)) {
        return NextResponse.json(
          { error: 'Tipo de servicio inválido' },
          { status: 400 }
        );
      }
      updateData.type = body.type;
    }
    
    if (body.category !== undefined) {
      const validCategories = {
        SPA: ['SPIRITUAL_ILLUMINATION', 'PHYSICAL_OPTIMISATION', 'MENTAL_EQUILIBRIUM'],
        EXPERIENCE: ['CULINARY_EXPERIENCE', 'NATURE_CULTURE', 'WINE_EXPERIENCE', 'RELAXATION_NATURE']
      };
      
      // Si también viene el tipo, validar contra ese, sino obtener el servicio actual
      let typeToValidate = body.type;
      if (!typeToValidate) {
        const currentService = await prisma.hotelService.findUnique({
          where: { id },
          select: { type: true }
        });
        typeToValidate = currentService?.type;
      }
      
      if (typeToValidate && !validCategories[typeToValidate as 'SPA' | 'EXPERIENCE'].includes(body.category)) {
        return NextResponse.json(
          { error: 'Categoría inválida para el tipo de servicio' },
          { status: 400 }
        );
      }
      
      updateData.category = body.category;
    }
    
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.pricePerPerson !== undefined) updateData.pricePerPerson = Boolean(body.pricePerPerson);
    if (body.duration !== undefined) updateData.duration = parseInt(body.duration);
    if (body.minCapacity !== undefined) updateData.minCapacity = parseInt(body.minCapacity);
    if (body.maxCapacity !== undefined) updateData.maxCapacity = parseInt(body.maxCapacity);
    
    // Manejo correcto de imágenes
    if (body.images !== undefined) {
      if (Array.isArray(body.images)) {
        updateData.images = body.images.filter((img: string) => img && img.trim());
      } else if (typeof body.images === 'string') {
        updateData.images = body.images
          .split(',')
          .map((img: string) => img.trim())
          .filter((img: string) => img);
      } else {
        updateData.images = [];
      }
    }
    
    if (body.mainImage !== undefined) updateData.mainImage = body.mainImage?.trim() || null;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    
    // Validar availableDays si viene
    if (body.availableDays !== undefined) {
      const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      if (Array.isArray(body.availableDays)) {
        const invalidDays = body.availableDays.filter((day: string) => !validDays.includes(day));
        if (invalidDays.length > 0) {
          return NextResponse.json(
            { error: `Días inválidos: ${invalidDays.join(', ')}` },
            { status: 400 }
          );
        }
        updateData.availableDays = body.availableDays;
      }
    }
    
    if (body.startTime !== undefined) updateData.startTime = body.startTime.trim();
    if (body.endTime !== undefined) updateData.endTime = body.endTime.trim();
    if (body.slotInterval !== undefined) updateData.slotInterval = parseInt(body.slotInterval);
    if (body.requiresReservation !== undefined) updateData.requiresReservation = Boolean(body.requiresReservation);
    if (body.advanceBookingHours !== undefined) updateData.advanceBookingHours = parseInt(body.advanceBookingHours);

    const service = await prisma.hotelService.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      service,
      message: 'Servicio actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    
    // Mejor manejo de errores
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Error al actualizar el servicio: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error desconocido al actualizar el servicio' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/services/[id]
 * Elimina un servicio
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo administradores pueden eliminar servicios' }, { status: 403 });
    }

    // Verificar si tiene reservas asociadas
    const bookingsCount = await prisma.serviceBooking.count({
      where: { serviceId: id },
    });

    if (bookingsCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un servicio con reservas asociadas. Desactívalo en su lugar.' },
        { status: 400 }
      );
    }

    await prisma.hotelService.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Servicio eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    
    // Mejor manejo de errores
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Error al eliminar el servicio: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error desconocido al eliminar el servicio' },
      { status: 500 }
    );
  }
}