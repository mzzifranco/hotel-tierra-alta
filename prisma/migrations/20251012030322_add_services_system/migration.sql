-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('SPA', 'EXPERIENCE');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('SPIRITUAL_ILLUMINATION', 'PHYSICAL_OPTIMISATION', 'MENTAL_EQUILIBRIUM', 'CULINARY_EXPERIENCE', 'NATURE_CULTURE', 'WINE_EXPERIENCE', 'RELAXATION_NATURE');

-- CreateEnum
CREATE TYPE "ServiceBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ServicePaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'FAILED');

-- CreateTable
CREATE TABLE "hotel_services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "type" "ServiceType" NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "pricePerPerson" BOOLEAN NOT NULL DEFAULT true,
    "duration" INTEGER NOT NULL,
    "minCapacity" INTEGER NOT NULL DEFAULT 1,
    "maxCapacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "availableDays" TEXT[],
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotInterval" INTEGER NOT NULL DEFAULT 60,
    "images" TEXT[],
    "mainImage" TEXT,
    "requiresReservation" BOOLEAN NOT NULL DEFAULT true,
    "advanceBookingHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotel_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_time_slots" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "booked" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_bookings" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "timeSlotId" TEXT,
    "userId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "bookingTime" TEXT NOT NULL,
    "participants" INTEGER NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "status" "ServiceBookingStatus" NOT NULL DEFAULT 'PENDING',
    "specialRequests" TEXT,
    "staffNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "service_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_payments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "status" "ServicePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "mercadoPagoId" TEXT,
    "mercadoPagoData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "service_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hotel_services_type_category_idx" ON "hotel_services"("type", "category");

-- CreateIndex
CREATE INDEX "hotel_services_isActive_idx" ON "hotel_services"("isActive");

-- CreateIndex
CREATE INDEX "service_time_slots_serviceId_date_idx" ON "service_time_slots"("serviceId", "date");

-- CreateIndex
CREATE INDEX "service_time_slots_date_isAvailable_idx" ON "service_time_slots"("date", "isAvailable");

-- CreateIndex
CREATE INDEX "service_bookings_userId_idx" ON "service_bookings"("userId");

-- CreateIndex
CREATE INDEX "service_bookings_reservationId_idx" ON "service_bookings"("reservationId");

-- CreateIndex
CREATE INDEX "service_bookings_serviceId_bookingDate_idx" ON "service_bookings"("serviceId", "bookingDate");

-- CreateIndex
CREATE INDEX "service_bookings_status_idx" ON "service_bookings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "service_payments_bookingId_key" ON "service_payments"("bookingId");

-- CreateIndex
CREATE INDEX "service_payments_userId_idx" ON "service_payments"("userId");

-- CreateIndex
CREATE INDEX "service_payments_status_idx" ON "service_payments"("status");

-- CreateIndex
CREATE INDEX "service_payments_transactionId_idx" ON "service_payments"("transactionId");

-- AddForeignKey
ALTER TABLE "service_time_slots" ADD CONSTRAINT "service_time_slots_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "hotel_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "hotel_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "service_time_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_payments" ADD CONSTRAINT "service_payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "service_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_payments" ADD CONSTRAINT "service_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
