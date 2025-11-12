import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions, isStaff } from '@/lib/auth';
import { Resend } from 'resend';
import { ConsultationStatus } from '@prisma/client';

const resend = new Resend(process.env.RESEND_API_KEY);

// GET - Listar consultas (mensajes)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = session.user;
    if (!isStaff(user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const consultations = await prisma.consultation.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Mapear estados del schema al frontend
    const statusMap: Record<ConsultationStatus, string> = {
      PENDING: 'OPEN',
      IN_REVIEW: 'OPEN',
      RESOLVED: 'REPLIED',
      ARCHIVED: 'ARCHIVED',
    };

    // Adaptar al formato que espera el frontend
    const messages = consultations.map(c => ({
      id: c.id,
      fromEmail: c.email,
      fromName: c.name,
      subject: c.subject,
      body: c.message,
      status: statusMap[c.status],
      receivedAt: c.createdAt.toISOString(),
      bookingCode: c.bookingCode,
      replyBody: c.response,
      repliedAt: c.respondedAt?.toISOString() || null,
      repliedBy: c.user ? { name: c.user.name } : null,
    }));

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
}

// PATCH - Responder consulta con envío de email
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = session.user;
    if (!isStaff(user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { messageId, replyBody } = await request.json();

    if (!messageId || !replyBody?.trim()) {
      return NextResponse.json(
        { error: 'ID de mensaje y respuesta requeridos' },
        { status: 400 }
      );
    }

    // Obtener la consulta original
    const originalConsultation = await prisma.consultation.findUnique({
      where: { id: messageId },
    });

    if (!originalConsultation) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar la consulta con el userId del que responde
    const consultation = await prisma.consultation.update({
      where: { id: messageId },
      data: {
        status: ConsultationStatus.RESOLVED,
        response: replyBody,
        respondedAt: new Date(),
        userId: user.id, // Asociar al usuario que respondió
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Enviar email con Resend
    let emailSent = false;
    try {
      await resend.emails.send({
        from: 'Hotel Tierra Alta <onboarding@resend.dev>',
        replyTo: process.env.NEXT_PUBLIC_HOTEL_EMAIL || 'contacto@tierraalta.com',
        to: originalConsultation.email,
        subject: `Re: ${originalConsultation.subject}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#404040;margin:0;padding:20px;background:#f5f5f5}
                .email-container{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.15)}
                .header{background:#fff;color:#000;padding:30px 20px;text-align:center;border-bottom:1px solid #e5e5e5}
                .header h1{margin:0;font-size:28px;font-weight:600}
                .content{background:#f3eee7;padding:30px}
                .content p{margin:0 0 14px 0;font-size:15px}
                .greeting{font-size:16px;margin-bottom:20px}
                .reply-box{background:#fff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #404040}
                .original-message{background:rgba(255,255,255,0.6);padding:18px;margin-top:20px;border-radius:8px;font-size:14px}
                .original-message p{margin:6px 0;font-size:14px}
                .divider{height:1px;background:#e5e5e5;margin:20px 0}
                .footer{text-align:center;padding:20px;font-size:12px;color:#999;background:#f5f5f5}
                .footer p{margin:4px 0}
                .footer a{color:#404040;text-decoration:underline}
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="header">
                  <h1>Tierra Alta</h1>
                </div>
                <div class="content">
                  <p class="greeting">Estimado/a ${originalConsultation.name},</p>
                  <p>Gracias por contactarte con Hotel Tierra Alta. Hemos recibido tu consulta y aquí está nuestra respuesta:</p>
                  
                  <div class="reply-box">
                    <p>${replyBody.replace(/\n/g, '<br>')}</p>
                  </div>
                  
                  <p>Si tienes más preguntas, no dudes en contactarnos.</p>
                  <p style="margin-top:16px">Saludos cordiales,<br><strong>Equipo Tierra Alta</strong></p>
                  
                  <div class="divider"></div>
                  
                  <div class="original-message">
                    <p><strong>Tu consulta original:</strong></p>
                    <p><strong>Asunto:</strong> ${originalConsultation.subject}</p>
                    ${originalConsultation.bookingCode ? `<p><strong>Código de reserva:</strong> ${originalConsultation.bookingCode}</p>` : ''}
                    <p style="margin-top:12px">${originalConsultation.message.replace(/\n/g, '<br>')}</p>
                  </div>
                </div>
              </div>
              
              <div class="footer">
                <p><strong>Tierra Alta</strong></p>
                <p>Malbec y General Güemes, Cafayate, Salta, Argentina</p>
                <p>Tel: ${process.env.NEXT_PUBLIC_HOTEL_PHONE || '+54 9 387 5714027'} | Email: ${process.env.NEXT_PUBLIC_HOTEL_EMAIL || 'contacto@tierraalta.com'}</p>
              </div>
            </body>
          </html>
        `,
      });

      emailSent = true;
      console.log(`✅ Email de respuesta enviado a ${originalConsultation.email}`);
    } catch (emailError) {
      console.error('❌ Error enviando email:', emailError);
      // No retornamos error, solo logueamos
    }

    return NextResponse.json({
      success: true,
      message: {
        id: consultation.id,
        fromEmail: consultation.email,
        fromName: consultation.name,
        subject: consultation.subject,
        body: consultation.message,
        status: 'REPLIED',
        replyBody: consultation.response,
        repliedAt: consultation.respondedAt,
        repliedBy: consultation.user ? { name: consultation.user.name } : null,
      },
      emailSent,
    });
  } catch (error) {
    console.error('Error respondiendo mensaje:', error);
    return NextResponse.json(
      { error: 'Error al responder mensaje' },
      { status: 500 }
    );
  }
}

// PUT - Cambiar estado de consulta (Archivar/Desarchivar)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = session.user;
    if (!isStaff(user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { messageId, status } = await request.json();

    if (!messageId || !status) {
      return NextResponse.json(
        { error: 'ID de mensaje y estado requeridos' },
        { status: 400 }
      );
    }

    // Mapear estados del frontend al schema de Prisma
    const statusMap: Record<string, ConsultationStatus> = {
      'OPEN': ConsultationStatus.PENDING,
      'REPLIED': ConsultationStatus.RESOLVED,
      'ARCHIVED': ConsultationStatus.ARCHIVED,
    };

    const newStatus = statusMap[status];

    if (!newStatus) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      );
    }

    const consultation = await prisma.consultation.update({
      where: { id: messageId },
      data: { status: newStatus },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: consultation.id,
        status: status, // Retornar el estado en formato frontend
      },
    });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    return NextResponse.json(
      { error: 'Error al actualizar estado' },
      { status: 500 }
    );
  }
}