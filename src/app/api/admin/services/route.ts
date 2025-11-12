import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/services
 * Obtiene todos los servicios (para admin)
 */
export async function GET() {
  try {
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

    const services = await prisma.hotelService.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      services,
    });
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    return NextResponse.json(
      { error: 'Error al cargar servicios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/services
 * Crea un nuevo servicio
 */
export async function POST(request: Request) {
  try {
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
    
    // LOG 1: Ver qué datos llegan
    console.log('📦 Body recibido:', JSON.stringify(body, null, 2));

    // Validaciones básicas
    if (!body.name || !body.type || !body.category || body.price === undefined || !body.duration || !body.minCapacity || !body.maxCapacity) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar que el tipo sea válido
    if (!['SPA', 'EXPERIENCE'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Tipo de servicio inválido' },
        { status: 400 }
      );
    }

    // Validar categoría según el tipo
    const validCategories = {
      SPA: ['SPIRITUAL_ILLUMINATION', 'PHYSICAL_OPTIMISATION', 'MENTAL_EQUILIBRIUM'],
      EXPERIENCE: ['CULINARY_EXPERIENCE', 'NATURE_CULTURE', 'WINE_EXPERIENCE', 'RELAXATION_NATURE']
    };

    if (!validCategories[body.type as 'SPA' | 'EXPERIENCE'].includes(body.category)) {
      return NextResponse.json(
        { error: 'Categoría inválida para el tipo de servicio seleccionado' },
        { status: 400 }
      );
    }

    // Preparar las imágenes
    let images: string[] = [];
    if (Array.isArray(body.images)) {
      images = body.images.filter((img: string) => img && img.trim());
    } else if (typeof body.images === 'string' && body.images.trim()) {
      images = body.images.split(',').map((img: string) => img.trim()).filter((img: string) => img);
    }
    
    // LOG 2: Ver imágenes procesadas
    console.log('🖼️ Imágenes procesadas:', images);

    // Preparar los días disponibles
    const defaultDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    let availableDays = defaultDays;
    
    if (body.availableDays) {
      if (Array.isArray(body.availableDays) && body.availableDays.length > 0) {
        availableDays = body.availableDays;
      }
    }
    
    // LOG 3: Ver días disponibles
    console.log('📅 Días disponibles:', availableDays);

    // Preparar datos para crear el servicio
    const serviceData = {
      name: String(body.name).trim(),
      description: body.description ? String(body.description).trim() : '',
      shortDescription: body.shortDescription ? String(body.shortDescription).trim() : null,
      type: body.type,
      category: body.category,
      price: parseFloat(String(body.price)),
      pricePerPerson: Boolean(body.pricePerPerson),
      duration: parseInt(String(body.duration)),
      minCapacity: parseInt(String(body.minCapacity)),
      maxCapacity: parseInt(String(body.maxCapacity)),
      images: images,
      mainImage: body.mainImage ? String(body.mainImage).trim() : null,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      availableDays: availableDays,
      startTime: body.startTime ? String(body.startTime).trim() : '09:00',
      endTime: body.endTime ? String(body.endTime).trim() : '21:00',
      slotInterval: body.slotInterval ? parseInt(String(body.slotInterval)) : 60,
      requiresReservation: body.requiresReservation !== undefined ? Boolean(body.requiresReservation) : true,
      advanceBookingHours: body.advanceBookingHours ? parseInt(String(body.advanceBookingHours)) : 24,
    };

    // LOG 4: Ver datos finales antes de crear
    console.log('✅ Datos finales para Prisma:', JSON.stringify(serviceData, null, 2));

    const service = await prisma.hotelService.create({
      data: serviceData,
    });

    console.log('✅ Servicio creado exitosamente:', service.id);

    return NextResponse.json({
      success: true,
      service,
      message: 'Servicio creado exitosamente',
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error al crear servicio:', error);
    
    // LOG 5: Ver el error completo
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Error al crear el servicio: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error desconocido al crear el servicio' },
      { status: 500 }
    );
  }
}