import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/newsletter/subscribe
 * Suscribe o reactiva un email. Envía correo de bienvenida con link de desuscripción.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email válido es requerido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { email }
    });

    if (existingSubscriber) {
      if (existingSubscriber.active) {
        return NextResponse.json(
          { error: 'Este email ya está suscrito' },
          { status: 400 }
        );
      } else {
        // Reactivar suscripción
        const token = crypto.randomBytes(32).toString('hex');
        await prisma.subscriber.update({
          where: { email },
          data: { 
            active: true,
            unsubscribeToken: token 
          }
        });
        
        console.log('🔄 Reactivando suscripción para:', email);
        await sendWelcomeEmail(email, token);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Suscripción reactivada exitosamente'
        });
      }
    }

    // Crear nuevo suscriptor con token
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.subscriber.create({
      data: {
        email,
        active: true,
        unsubscribeToken: token
      }
    });

    console.log('✅ Nuevo suscriptor creado:', email);
    console.log('🔑 Token generado:', token);
    
    // Enviar email de bienvenida
    await sendWelcomeEmail(email, token);

    return NextResponse.json({ 
      success: true, 
      message: 'Suscripción exitosa. Revisa tu email.'
    });
  } catch (error: any) {
    console.error('❌ Error al suscribir:', error);
    
    return NextResponse.json(
      { error: 'Error al procesar la suscripción' },
      { status: 500 }
    );
  }
}

async function sendWelcomeEmail(email: string, token: string) {
  console.log('📧 Intentando enviar email a:', email);
  console.log('🔗 Token para desuscripción:', token);
  
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${token}`;
  console.log('🌐 URL de desuscripción:', unsubscribeUrl);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            color: #404040;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .header { 
            background-color: white;
            color: black;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 1px solid #e5e5e5;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content { 
            background-color: #f3eee7;
            padding: 30px;
            border-radius: 0;
          }
          .content p {
            margin: 0 0 14px 0;
            font-size: 15px;
            line-height: 1.6;
          }
          .content h2 {
            font-size: 22px;
            margin: 0 0 16px 0;
            color: #000;
            font-weight: 600;
          }
          .content ul {
            margin: 16px 0;
            padding-left: 24px;
          }
          .content li {
            margin-bottom: 8px;
          }
          .button {
            display: inline-block;
            padding: 12px 28px;
            background-color: #008236;
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
          }
          .footer { 
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #999;
            background-color: #f5f5f5;
          }
          .footer p {
            margin: 4px 0;
          }
          .footer a {
            color: #404040;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>Tierra Alta</h1>
          </div>
          <div class="content">
            <h2>¡Bienvenido a nuestra comunidad!</h2>
            
            <p>Gracias por suscribirte al newsletter de Tierra Alta Hotel. Estamos emocionados de tenerte con nosotros.</p>
            
            <p>Recibirás nuestras últimas noticias, ofertas exclusivas y todo lo que necesitas saber sobre tu próxima estadía en el Valle Calchaquí.</p>
            
            <p><strong>¿Qué puedes esperar?</strong></p>
            <ul>
              <li>Ofertas especiales y promociones exclusivas</li>
              <li>Novedades sobre nuestros servicios y eventos</li>
              <li>Consejos para disfrutar al máximo tu visita</li>
              <li>Contenido sobre turismo en Salta y el Valle Calchaquí</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="button">
                Visitar Nuestro Sitio
              </a>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Tierra Alta</strong></p>
          <p>Malbec y General Güemes, Cafayate, Salta, Argentina</p>
          <p>Tel: +54 9 387 5714027 | Email: onboarding@resend.dev</p>
          <p style="margin-top: 12px;">
            ¿No quieres recibir más emails? 
            <a href="${unsubscribeUrl}">Desuscribirse</a>
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    console.log('🚀 Llamando a Resend API...');
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: '¡Bienvenido a Tierra Alta Newsletter!',
      html: htmlContent,
    });
    
    console.log('✅ Email enviado exitosamente. ID:', result.data?.id);
    console.log('📦 Respuesta completa de Resend:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error);
    console.error('📋 Detalles del error:', JSON.stringify(error, null, 2));
    // No lanza error para no fallar la suscripción
  }
}