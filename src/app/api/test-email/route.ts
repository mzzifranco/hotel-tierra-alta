import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET() {
  console.log('========================================');
  console.log('🧪 TEST DE RESEND');
  console.log('========================================');
  
  // Verificar variables de entorno
  console.log('RESEND_API_KEY existe:', !!process.env.RESEND_API_KEY);
  console.log('RESEND_API_KEY (primeros 10 chars):', process.env.RESEND_API_KEY?.substring(0, 10));
  console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // Verificar que la API key comienza con 're_'
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({
      error: 'RESEND_API_KEY no está configurada',
      hint: 'Agrega RESEND_API_KEY=re_xxx en tu archivo .env.local'
    }, { status: 500 });
  }

  if (!process.env.RESEND_API_KEY.startsWith('re_')) {
    return NextResponse.json({
      error: 'RESEND_API_KEY no tiene el formato correcto',
      hint: 'La API key debe comenzar con "re_"'
    }, { status: 500 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    console.log('📧 Intentando enviar email de prueba...');
    
    const result = await resend.emails.send({
      from: 'Tierra Alta <onboarding@resend.dev>', // ⚠️ Usar el dominio de prueba de Resend
      to: 'delivered@resend.dev', // ⚠️ Email de prueba de Resend
      subject: 'Test Email desde Tierra Alta',
      html: '<h1>¡Funciona!</h1><p>Este es un email de prueba.</p>',
    });

    console.log('📧 Respuesta completa:', JSON.stringify(result, null, 2));

    if (result.data) {
      console.log('✅ EMAIL ENVIADO EXITOSAMENTE');
      return NextResponse.json({
        success: true,
        message: 'Email enviado correctamente',
        emailId: result.data.id,
        data: result.data
      });
    }

    if (result.error) {
      console.error('❌ ERROR DE RESEND:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ ERROR EN CATCH:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}