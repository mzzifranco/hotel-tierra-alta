import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NewsletterCategory } from '@prisma/client';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/newsletters/send
 * Envía un newsletter a todos los suscriptores activos y registra el envío.
 * Requiere usuario ADMIN autenticado.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Buscar el usuario en la base de datos usando el email de la sesión
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que sea ADMIN (opcional, dependiendo de tus requisitos)
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo administradores pueden enviar newsletters' },
        { status: 403 }
      );
    }

    const { subject, htmlContent, category } = await request.json();

    if (!subject || !htmlContent) {
      return NextResponse.json(
        { error: 'Asunto y contenido son requeridos' },
        { status: 400 }
      );
    }

    // Validar que la categoría sea válida (si se proporciona)
    if (category && !Object.values(NewsletterCategory).includes(category)) {
      return NextResponse.json(
        { error: 'Categoría inválida' },
        { status: 400 }
      );
    }

    // Obtener solo suscriptores activos
    const subscribers = await prisma.subscriber.findMany({
      where: { active: true }
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No hay suscriptores activos' },
        { status: 400 }
      );
    }

    let sent = 0;
    let failed = 0;

    // Enviar emails individualmente con su link de desuscripción
    for (const subscriber of subscribers) {
      try {
        // Generar URL de desuscripción personalizada
        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${subscriber.unsubscribeToken}`;
        
        // Reemplazar placeholder con URL real
        const personalizedContent = htmlContent.replace('{{UNSUBSCRIBE_URL}}', unsubscribeUrl);

        await resend.emails.send({
          from: 'Hotel Tierra Alta <marcuzzifrancoluciano@gmail.com>',
          to: subscriber.email,
          subject: subject,
          html: personalizedContent,
        });

        sent++;
      } catch (error) {
        console.error(`Error enviando a ${subscriber.email}:`, error);
        failed++;
      }
    }

    // Registrar el newsletter enviado con la categoría
    await prisma.newsletter.create({
      data: {
        subject,
        content: htmlContent,
        category: category || NewsletterCategory.GENERAL,
        sentTo: sent,
        sentBy: user.id, // Usar el ID del usuario de la base de datos
      },
    });

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: subscribers.length,
    });
  } catch (error) {
    console.error('Error enviando newsletter:', error);
    return NextResponse.json(
      { error: 'Error al enviar newsletter' },
      { status: 500 }
    );
  }
}