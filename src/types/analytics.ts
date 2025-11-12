// src/types/analytics.ts

export interface ServiceRevenueData {
  serviceId: string;
  serviceName: string;
  type: string;
  category: string;
  totalRevenue: number;
  bookingCount: number;
  averageRevenue: number;
}

export interface RevenueByType {
  type: string;
  totalRevenue: number;
  bookingCount: number;
}

export interface RevenueByCategory {
  category: string;
  type: string;
  totalRevenue: number;
  bookingCount: number;
}

export interface MonthlyRevenue {
  month: string;
  totalRevenue: number;
  bookingCount: number;
  spaRevenue: number;
  experienceRevenue: number;
}

export interface DailyRevenue {
  date: string;
  totalRevenue: number;
  bookingCount: number;
}

export interface ServiceRevenueSummary {
  totalRevenue: number;
  totalBookings: number;
  averageRevenuePerBooking: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

export interface ServiceRevenueAnalytics {
  success: boolean;
  summary: ServiceRevenueSummary;
  byService: ServiceRevenueData[];
  byType: RevenueByType[];
  byCategory: RevenueByCategory[];
  monthlyTrend: MonthlyRevenue[];
  dailyTrend: DailyRevenue[];
  topServices: ServiceRevenueData[];
}

export interface FilterValues {
  startDate: string;
  endDate: string;
  serviceType: 'ALL' | 'SPA' | 'EXPERIENCE';
  category: string;
}