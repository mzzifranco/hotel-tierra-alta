import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Esquema de validación con Zod: asegura que los datos del formulario tengan el formato correcto.
const contactSchema = z.object({
  fromEmail: z.string().email('Email inválido'),
  fromName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  subject: z.string().min(3, 'El asunto debe tener al menos 3 caracteres'),
  body: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
  bookingCode: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});

// POST - Enviar mensaje/consulta desde formulario público
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = contactSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Obtener metadata de la request
    const headers = request.headers;
    const sourceIp = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown';
    const userAgent = headers.get('user-agent') || 'unknown';
    const referer = headers.get('referer') || null;

    // Crear la consulta usando el modelo Consultation
    const consultation = await prisma.consultation.create({
      data: {
        name: data.fromName,
        email: data.fromEmail,
        subject: data.subject,
        message: data.body,
        phone: data.phone || null,
        bookingCode: data.bookingCode || null,
        status: 'PENDING',
        sourceIp,
        userAgent,
        referer,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado exitosamente. Te contactaremos pronto.',
      id: consultation.id,
    });
  } catch (error: any) {
    console.error('Error enviando mensaje:', error);
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una consulta con estos datos' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error al enviar mensaje. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}