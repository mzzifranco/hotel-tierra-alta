import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Endpoint POST: guarda una nueva consulta de contacto en la base de datos.
export async function POST(request: Request) {
  try {
    const { name, subject, email, message, bookingCode } = await request.json();

    // Validaciones
    if (!name || !subject || !email || !message) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios son requeridos' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    if (bookingCode && bookingCode.length > 32) {
      return NextResponse.json(
        { error: 'Código de reserva demasiado largo' },
        { status: 400 }
      );
    }

    // Obtener metadata de la request
    const headers = request.headers;
    const sourceIp = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown';
    const userAgent = headers.get('user-agent') || 'unknown';
    const referer = headers.get('referer') || null;

    // Crear la consulta
    const newConsultation = await prisma.consultation.create({
      data: {
        name,
        email,
        subject,
        message,
        bookingCode: bookingCode || null,
        phone: null,
        status: 'PENDING',
        sourceIp,
        userAgent,
        referer,
      },
    });

    return NextResponse.json({
      success: true,
      message: '¡Mensaje enviado con éxito! Te contactaremos pronto.',
      consultationId: newConsultation.id,
    });

  } catch (error: any) {
    console.error('Error al guardar consulta:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una consulta con estos datos' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error al procesar el mensaje. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}