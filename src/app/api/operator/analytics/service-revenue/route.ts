// src/app/api/operator/analytics/service-revenue/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/operator/analytics/service-revenue
 * Obtiene estadísticas de ingresos por servicios
 * Query params:
 *  - startDate: fecha inicio (ISO string)
 *  - endDate: fecha fin (ISO string)
 *  - serviceType: SPA | EXPERIENCE (opcional)
 *  - category: ServiceCategory (opcional)
 */
export async function GET(request: Request) {
  try {
    // Verificar autenticación y rol
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'OPERATOR' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta información' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const serviceType = searchParams.get('serviceType') as 'SPA' | 'EXPERIENCE' | null;
    const category = searchParams.get('category');

    // CORRECCIÓN: Construir filtros usando bookingDate del ServiceBooking
    const whereClause: Prisma.ServicePaymentWhereInput = {
      status: 'APPROVED', // Solo pagos aprobados
    };

    // CORRECCIÓN CRÍTICA: Filtrar por fecha del servicio (bookingDate) NO por createdAt del pago
    if (startDate || endDate) {
      whereClause.booking = whereClause.booking || {};
      whereClause.booking.bookingDate = {};
      
      if (startDate) {
        whereClause.booking.bookingDate.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.booking.bookingDate.lte = new Date(endDate);
      }
    }

    // Filtros adicionales por tipo de servicio y categoría
    if (serviceType || category) {
      whereClause.booking = whereClause.booking || {};
      whereClause.booking.service = whereClause.booking.service || {};
      
      if (serviceType) {
        whereClause.booking.service.type = serviceType;
      }
      
      if (category) {
        whereClause.booking.service.category = category as any;
      }
    }

    // Obtener todos los pagos con información del servicio
    const payments = await prisma.servicePayment.findMany({
      where: whereClause,
      include: {
        booking: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                type: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        booking: {
          bookingDate: 'asc', // Ordenar por fecha del servicio
        },
      },
    });

    // 1. INGRESOS POR SERVICIO INDIVIDUAL
    interface ServiceRevenue {
      serviceId: string;
      serviceName: string;
      type: string;
      category: string;
      totalRevenue: number;
      bookingCount: number;
      averageRevenue: number;
    }

    const revenueByService = payments.reduce((acc, payment) => {
      const serviceId = payment.booking.service.id;
      const serviceName = payment.booking.service.name;
      
      if (!acc[serviceId]) {
        acc[serviceId] = {
          serviceId,
          serviceName,
          type: payment.booking.service.type,
          category: payment.booking.service.category,
          totalRevenue: 0,
          bookingCount: 0,
          averageRevenue: 0,
        };
      }
      
      acc[serviceId].totalRevenue += payment.amount;
      acc[serviceId].bookingCount += 1;
      
      return acc;
    }, {} as Record<string, ServiceRevenue>);

    // Calcular promedio y convertir a array
    const serviceStats = Object.values(revenueByService).map((service) => ({
      ...service,
      averageRevenue: service.totalRevenue / service.bookingCount,
    }));

    // 2. INGRESOS POR TIPO DE SERVICIO (SPA vs EXPERIENCE)
    interface RevenueByType {
      type: string;
      totalRevenue: number;
      bookingCount: number;
    }

    const revenueByType = payments.reduce((acc, payment) => {
      const type = payment.booking.service.type;
      
      if (!acc[type]) {
        acc[type] = {
          type,
          totalRevenue: 0,
          bookingCount: 0,
        };
      }
      
      acc[type].totalRevenue += payment.amount;
      acc[type].bookingCount += 1;
      
      return acc;
    }, {} as Record<string, RevenueByType>);

    // 3. INGRESOS POR CATEGORÍA
    interface RevenueByCategory {
      category: string;
      type: string;
      totalRevenue: number;
      bookingCount: number;
    }

    const revenueByCategory = payments.reduce((acc, payment) => {
      const category = payment.booking.service.category;
      
      if (!acc[category]) {
        acc[category] = {
          category,
          type: payment.booking.service.type,
          totalRevenue: 0,
          bookingCount: 0,
        };
      }
      
      acc[category].totalRevenue += payment.amount;
      acc[category].bookingCount += 1;
      
      return acc;
    }, {} as Record<string, RevenueByCategory>);

    // 4. TENDENCIA TEMPORAL (por mes)
    // CORRECCIÓN CRÍTICA: Usar bookingDate del servicio, NO createdAt del pago
    interface MonthlyRevenue {
      month: string;
      totalRevenue: number;
      bookingCount: number;
      spaRevenue: number;
      experienceRevenue: number;
    }

    const revenueByMonth = payments.reduce((acc, payment) => {
      // ✅ CAMBIO CRÍTICO: Usar bookingDate en lugar de payment.createdAt
      const date = new Date(payment.booking.bookingDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          totalRevenue: 0,
          bookingCount: 0,
          spaRevenue: 0,
          experienceRevenue: 0,
        };
      }
      
      acc[monthKey].totalRevenue += payment.amount;
      acc[monthKey].bookingCount += 1;
      
      if (payment.booking.service.type === 'SPA') {
        acc[monthKey].spaRevenue += payment.amount;
      } else {
        acc[monthKey].experienceRevenue += payment.amount;
      }
      
      return acc;
    }, {} as Record<string, MonthlyRevenue>);

    // Ordenar por mes
    const monthlyTrend = Object.values(revenueByMonth).sort((a, b) => 
      a.month.localeCompare(b.month)
    );

    // 5. TENDENCIA TEMPORAL (por día)
    // CORRECCIÓN CRÍTICA: Usar bookingDate del servicio, NO createdAt del pago
    interface DailyRevenue {
      date: string;
      totalRevenue: number;
      bookingCount: number;
    }

    const revenueByDay = payments.reduce((acc, payment) => {
      // ✅ CAMBIO CRÍTICO: Usar bookingDate en lugar de payment.createdAt
      const date = new Date(payment.booking.bookingDate);
      const dayKey = date.toISOString().split('T')[0];
      
      if (!acc[dayKey]) {
        acc[dayKey] = {
          date: dayKey,
          totalRevenue: 0,
          bookingCount: 0,
        };
      }
      
      acc[dayKey].totalRevenue += payment.amount;
      acc[dayKey].bookingCount += 1;
      
      return acc;
    }, {} as Record<string, DailyRevenue>);

    const dailyTrend = Object.values(revenueByDay).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    // 6. MÉTRICAS GENERALES
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalBookings = payments.length;
    const averageRevenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Top 5 servicios por ingresos
    const topServices = [...serviceStats]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenue,
        totalBookings,
        averageRevenuePerBooking,
        dateRange: {
          start: startDate || null,
          end: endDate || null,
        },
      },
      byService: serviceStats,
      byType: Object.values(revenueByType),
      byCategory: Object.values(revenueByCategory),
      monthlyTrend,
      dailyTrend,
      topServices,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de ingresos:', error);
    return NextResponse.json(
      { error: 'Error al cargar estadísticas' },
      { status: 500 }
    );
  }
}