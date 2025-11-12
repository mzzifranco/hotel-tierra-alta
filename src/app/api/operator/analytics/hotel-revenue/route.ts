// src/app/api/operator/analytics/hotel-revenue/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/operator/analytics/hotel-revenue
 * Obtiene estadísticas de ingresos por reservas hoteleras
 * Query params:
 *  - startDate: fecha inicio (ISO string)
 *  - endDate: fecha fin (ISO string)
 *  - roomType: RoomType (opcional)
 *  - status: ReservationStatus (opcional)
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
    const roomType = searchParams.get('roomType');
    const status = searchParams.get('status');

    // Construir filtros para pagos aprobados
    const paymentWhereClause: Prisma.PaymentWhereInput = {
      status: 'APPROVED', // Solo pagos aprobados
    };

    // Filtrar por fecha de check-in de la reserva
    if (startDate || endDate) {
      paymentWhereClause.reservation = paymentWhereClause.reservation || {};
      paymentWhereClause.reservation.checkIn = {};
      
      if (startDate) {
        paymentWhereClause.reservation.checkIn.gte = new Date(startDate);
      }
      if (endDate) {
        paymentWhereClause.reservation.checkIn.lte = new Date(endDate);
      }
    }

    // Filtros adicionales por tipo de habitación
    if (roomType) {
      paymentWhereClause.reservation = paymentWhereClause.reservation || {};
      paymentWhereClause.reservation.room = {
        type: roomType as any,
      };
    }

    // Filtro por estado de reserva
    if (status) {
      paymentWhereClause.reservation = paymentWhereClause.reservation || {};
      paymentWhereClause.reservation.status = status as any;
    }

    // Obtener todos los pagos con información de la reserva y habitación
    const payments = await prisma.payment.findMany({
      where: paymentWhereClause,
      include: {
        reservation: {
          include: {
            room: {
              select: {
                id: true,
                number: true,
                type: true,
                floor: true,
              },
            },
          },
        },
      },
      orderBy: {
        reservation: {
          checkIn: 'asc',
        },
      },
    });

    // 1. INGRESOS POR TIPO DE HABITACIÓN
    interface RevenueByRoomType {
      roomType: string;
      totalRevenue: number;
      bookingCount: number;
      averageRevenue: number;
      totalNights: number;
      averageNightsPerBooking: number;
    }

    const revenueByRoomType = payments.reduce((acc, payment) => {
      const roomType = payment.reservation.room.type;
      const nights = Math.ceil(
        (new Date(payment.reservation.checkOut).getTime() - 
         new Date(payment.reservation.checkIn).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      
      if (!acc[roomType]) {
        acc[roomType] = {
          roomType,
          totalRevenue: 0,
          bookingCount: 0,
          averageRevenue: 0,
          totalNights: 0,
          averageNightsPerBooking: 0,
        };
      }
      
      acc[roomType].totalRevenue += payment.amount;
      acc[roomType].bookingCount += 1;
      acc[roomType].totalNights += nights;
      
      return acc;
    }, {} as Record<string, RevenueByRoomType>);

    // Calcular promedios
    const roomTypeStats = Object.values(revenueByRoomType).map((stat) => ({
      ...stat,
      averageRevenue: stat.totalRevenue / stat.bookingCount,
      averageNightsPerBooking: stat.totalNights / stat.bookingCount,
    }));

    // 2. INGRESOS POR HABITACIÓN INDIVIDUAL
    interface RevenueByRoom {
      roomId: string;
      roomNumber: string;
      roomType: string;
      floor: number;
      totalRevenue: number;
      bookingCount: number;
      averageRevenue: number;
      occupancyRate: number; // Calculado posteriormente
    }

    const revenueByRoom = payments.reduce((acc, payment) => {
      const roomId = payment.reservation.room.id;
      const roomNumber = payment.reservation.room.number;
      
      if (!acc[roomId]) {
        acc[roomId] = {
          roomId,
          roomNumber,
          roomType: payment.reservation.room.type,
          floor: payment.reservation.room.floor,
          totalRevenue: 0,
          bookingCount: 0,
          averageRevenue: 0,
          occupancyRate: 0,
        };
      }
      
      acc[roomId].totalRevenue += payment.amount;
      acc[roomId].bookingCount += 1;
      
      return acc;
    }, {} as Record<string, RevenueByRoom>);

    const roomStats = Object.values(revenueByRoom).map((room) => ({
      ...room,
      averageRevenue: room.totalRevenue / room.bookingCount,
    }));

    // 3. TENDENCIA TEMPORAL (por mes)
    interface MonthlyRevenue {
      month: string;
      totalRevenue: number;
      bookingCount: number;
      averageRevenue: number;
      totalNights: number;
      revenueByRoomType: Record<string, number>;
    }

    const revenueByMonth = payments.reduce((acc, payment) => {
      const date = new Date(payment.reservation.checkIn);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const nights = Math.ceil(
        (new Date(payment.reservation.checkOut).getTime() - 
         new Date(payment.reservation.checkIn).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          totalRevenue: 0,
          bookingCount: 0,
          averageRevenue: 0,
          totalNights: 0,
          revenueByRoomType: {},
        };
      }
      
      acc[monthKey].totalRevenue += payment.amount;
      acc[monthKey].bookingCount += 1;
      acc[monthKey].totalNights += nights;
      
      const roomType = payment.reservation.room.type;
      acc[monthKey].revenueByRoomType[roomType] = 
        (acc[monthKey].revenueByRoomType[roomType] || 0) + payment.amount;
      
      return acc;
    }, {} as Record<string, MonthlyRevenue>);

    const monthlyTrend = Object.values(revenueByMonth).map((month) => ({
      ...month,
      averageRevenue: month.totalRevenue / month.bookingCount,
    })).sort((a, b) => a.month.localeCompare(b.month));

    // 4. TENDENCIA TEMPORAL (por día)
    interface DailyRevenue {
      date: string;
      totalRevenue: number;
      bookingCount: number;
      checkIns: number;
      averageRevenue: number;
    }

    const revenueByDay = payments.reduce((acc, payment) => {
      const date = new Date(payment.reservation.checkIn);
      const dayKey = date.toISOString().split('T')[0];
      
      if (!acc[dayKey]) {
        acc[dayKey] = {
          date: dayKey,
          totalRevenue: 0,
          bookingCount: 0,
          checkIns: 0,
          averageRevenue: 0,
        };
      }
      
      acc[dayKey].totalRevenue += payment.amount;
      acc[dayKey].bookingCount += 1;
      acc[dayKey].checkIns += 1;
      
      return acc;
    }, {} as Record<string, DailyRevenue>);

    const dailyTrend = Object.values(revenueByDay).map((day) => ({
      ...day,
      averageRevenue: day.totalRevenue / day.bookingCount,
    })).sort((a, b) => a.date.localeCompare(b.date));

    // 5. DISTRIBUCIÓN POR DURACIÓN DE ESTADÍA
    interface StayDurationStats {
      duration: string; // "1 noche", "2-3 noches", etc.
      bookingCount: number;
      totalRevenue: number;
      averageRevenue: number;
    }

    const stayDurations = payments.reduce((acc, payment) => {
      const nights = Math.ceil(
        (new Date(payment.reservation.checkOut).getTime() - 
         new Date(payment.reservation.checkIn).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      
      let durationKey: string;
      if (nights === 1) durationKey = '1 noche';
      else if (nights === 2) durationKey = '2 noches';
      else if (nights === 3) durationKey = '3 noches';
      else if (nights <= 5) durationKey = '4-5 noches';
      else if (nights <= 7) durationKey = '6-7 noches';
      else durationKey = '8+ noches';
      
      if (!acc[durationKey]) {
        acc[durationKey] = {
          duration: durationKey,
          bookingCount: 0,
          totalRevenue: 0,
          averageRevenue: 0,
        };
      }
      
      acc[durationKey].bookingCount += 1;
      acc[durationKey].totalRevenue += payment.amount;
      
      return acc;
    }, {} as Record<string, StayDurationStats>);

    const stayDurationStats = Object.values(stayDurations).map((stat) => ({
      ...stat,
      averageRevenue: stat.totalRevenue / stat.bookingCount,
    }));

    // 6. MÉTRICAS GENERALES
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalBookings = payments.length;
    const averageRevenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    
    const totalNights = payments.reduce((sum, payment) => {
      const nights = Math.ceil(
        (new Date(payment.reservation.checkOut).getTime() - 
         new Date(payment.reservation.checkIn).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      return sum + nights;
    }, 0);
    
    const averageNightsPerBooking = totalBookings > 0 ? totalNights / totalBookings : 0;
    const averageRevenuePerNight = totalNights > 0 ? totalRevenue / totalNights : 0;

    // Top 5 habitaciones por ingresos
    const topRooms = [...roomStats]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Distribución por cantidad de huéspedes
    interface GuestDistribution {
      guestCount: number;
      bookingCount: number;
      totalRevenue: number;
      averageRevenue: number;
    }

    const guestDistribution = payments.reduce((acc, payment) => {
      const guests = payment.reservation.guests;
      
      if (!acc[guests]) {
        acc[guests] = {
          guestCount: guests,
          bookingCount: 0,
          totalRevenue: 0,
          averageRevenue: 0,
        };
      }
      
      acc[guests].bookingCount += 1;
      acc[guests].totalRevenue += payment.amount;
      
      return acc;
    }, {} as Record<number, GuestDistribution>);

    const guestStats = Object.values(guestDistribution).map((stat) => ({
      ...stat,
      averageRevenue: stat.totalRevenue / stat.bookingCount,
    })).sort((a, b) => a.guestCount - b.guestCount);

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenue,
        totalBookings,
        totalNights,
        averageRevenuePerBooking,
        averageNightsPerBooking,
        averageRevenuePerNight,
        dateRange: {
          start: startDate || null,
          end: endDate || null,
        },
      },
      byRoomType: roomTypeStats,
      byRoom: roomStats,
      monthlyTrend,
      dailyTrend,
      stayDurationStats,
      guestDistribution: guestStats,
      topRooms,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de ingresos hoteleros:', error);
    return NextResponse.json(
      { error: 'Error al cargar estadísticas' },
      { status: 500 }
    );
  }
}