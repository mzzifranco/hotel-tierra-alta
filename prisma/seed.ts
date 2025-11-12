import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpiar datos existentes en el orden correcto (respetando foreign keys)
  await prisma.servicePayment.deleteMany();
  await prisma.serviceBooking.deleteMany();
  await prisma.serviceTimeSlot.deleteMany();
  await prisma.hotelService.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.newsletter.deleteMany();
  await prisma.subscriber.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Datos anteriores eliminados');

  // Hash de contraseñas
  const hashedPassword = await bcrypt.hash('password123', 10);

  // ========================================
  // CREAR USUARIOS
  // ========================================

  const admin = await prisma.user.create({
    data: {
      email: 'admin@tierraalta.com',
      name: 'Admin Principal',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+54 9 387 5714927',
    },
  });

  const operator = await prisma.user.create({
    data: {
      email: 'operador@tierraalta.com',
      name: 'Operador Hotel',
      password: hashedPassword,
      role: 'OPERATOR',
      phone: '+54 9 387 5551234',
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'cliente@example.com',
      name: 'María Cliente',
      password: hashedPassword,
      role: 'USER',
      phone: '+54 9 387 5559876',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'juan.gomez@gmail.com',
      name: 'Juan Gómez',
      password: hashedPassword,
      role: 'USER',
      phone: '+54 9 387 4445566',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'laura.martinez@hotmail.com',
      name: 'Laura Martínez',
      password: hashedPassword,
      role: 'USER',
      phone: '+54 9 381 6667788',
    },
  });

  const user4 = await prisma.user.create({
    data: {
      email: 'carlos.rodriguez@yahoo.com',
      name: 'Carlos Rodríguez',
      password: hashedPassword,
      role: 'USER',
      phone: '+54 9 387 7778899',
    },
  });

  const user5 = await prisma.user.create({
    data: {
      email: 'ana.lopez@outlook.com',
      name: 'Ana López',
      password: hashedPassword,
      role: 'USER',
      phone: '+54 9 387 8889900',
    },
  });

  const user6 = await prisma.user.create({
    data: {
      email: 'diego.fernandez@gmail.com',
      name: 'Diego Fernández',
      password: hashedPassword,
      role: 'USER',
      phone: '+54 9 381 9990011',
    },
  });

  const user7 = await prisma.user.create({
    data: {
      email: 'sofia.perez@gmail.com',
      name: 'Sofía Pérez',
      password: hashedPassword,
      role: 'USER',
      phone: '+54 9 387 1112233',
    },
  });

  const user8 = await prisma.user.create({
    data: {
      email: 'roberto.sanchez@hotmail.com',
      name: 'Roberto Sánchez',
      password: hashedPassword,
      role: 'USER',
      phone: '+54 9 387 2223344',
    },
  });

  console.log('✅ Usuarios creados (8 clientes + 1 operador + 1 admin)');

  // ========================================
  // CREAR SERVICIOS
  // ========================================

  const meditacion = await prisma.hotelService.create({
    data: {
      name: 'Meditación & Mindfulness',
      description: 'Practique los principios de la atención plena con sesiones guiadas de meditación para alcanzar la paz interior y la claridad mental.',
      shortDescription: 'Sesiones guiadas de meditación y atención plena',
      type: 'SPA',
      category: 'SPIRITUAL_ILLUMINATION',
      price: 3500,
      pricePerPerson: true,
      duration: 60,
      minCapacity: 1,
      maxCapacity: 8,
      isActive: true,
      availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      startTime: '07:00',
      endTime: '20:00',
      slotInterval: 60,
      images: ['/meditation1.jpg'],
      mainImage: '/meditation1.jpg',
      requiresReservation: true,
      advanceBookingHours: 6,
    },
  });

  const entrenamiento = await prisma.hotelService.create({
    data: {
      name: 'Entrenamiento Personal',
      description: 'Programas de entrenamiento personalizados diseñados por expertos para ayudarle a alcanzar sus objetivos de fitness.',
      shortDescription: 'Sesiones personalizadas con entrenador experto',
      type: 'SPA',
      category: 'PHYSICAL_OPTIMISATION',
      price: 4500,
      pricePerPerson: true,
      duration: 90,
      minCapacity: 1,
      maxCapacity: 2,
      isActive: true,
      availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      startTime: '06:00',
      endTime: '21:00',
      slotInterval: 90,
      images: ['/personal_training.jpg'],
      mainImage: '/personal_training.jpg',
      requiresReservation: true,
      advanceBookingHours: 12,
    },
  });

  const terapias = await prisma.hotelService.create({
    data: {
      name: 'Terapias Holísticas',
      description: 'Descubra el equilibrio a través de nuestra gama de tratamientos holísticos que incluyen aromaterapia, sanación sonora y trabajo energético.',
      shortDescription: 'Aromaterapia, sanación sonora y trabajo energético',
      type: 'SPA',
      category: 'MENTAL_EQUILIBRIUM',
      price: 5500,
      pricePerPerson: true,
      duration: 120,
      minCapacity: 1,
      maxCapacity: 4,
      isActive: true,
      availableDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      startTime: '10:00',
      endTime: '19:00',
      slotInterval: 120,
      images: ['/holistic_therapies.jpg'],
      mainImage: '/holistic_therapies.jpg',
      requiresReservation: true,
      advanceBookingHours: 24,
    },
  });

  const yoga = await prisma.hotelService.create({
    data: {
      name: 'Yoga & Pilates',
      description: 'Fortalezca su cuerpo y calme su mente con nuestras clases de yoga y pilates dirigidas por expertos en un entorno sereno.',
      shortDescription: 'Clases de yoga y pilates en entorno rodeado de naturaleza',
      type: 'SPA',
      category: 'PHYSICAL_OPTIMISATION',
      price: 3000,
      pricePerPerson: true,
      duration: 75,
      minCapacity: 1,
      maxCapacity: 12,
      isActive: true,
      availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      startTime: '06:30',
      endTime: '18:00',
      slotInterval: 75,
      images: ['/zen1.jpg'],
      mainImage: '/zen1.jpg',
      requiresReservation: true,
      advanceBookingHours: 6,
    },
  });

  const cocinaAndina = await prisma.hotelService.create({
    data: {
      name: 'Cocina Andina',
      description: 'Taller exclusivo para aprender platos regionales con chefs locales. Descubra los secretos de la cocina tradicional del norte argentino.',
      shortDescription: 'Taller de cocina regional con chef local',
      type: 'EXPERIENCE',
      category: 'CULINARY_EXPERIENCE',
      price: 8000,
      pricePerPerson: true,
      duration: 180,
      minCapacity: 2,
      maxCapacity: 8,
      isActive: true,
      availableDays: ['TUESDAY', 'THURSDAY', 'SATURDAY'],
      startTime: '10:00',
      endTime: '16:00',
      slotInterval: 180,
      images: ['/offer-0.jpg'],
      mainImage: '/offer-0.jpg',
      requiresReservation: true,
      advanceBookingHours: 48,
    },
  });

  const olivares = await prisma.hotelService.create({
    data: {
      name: 'Olivares de Cafayate',
      description: 'Recorrido entre olivos centenarios con degustación de aceites artesanales. Experiencia única en campos de olivos históricos.',
      shortDescription: 'Tour por olivares con degustación de aceites',
      type: 'EXPERIENCE',
      category: 'NATURE_CULTURE',
      price: 6500,
      pricePerPerson: true,
      duration: 150,
      minCapacity: 2,
      maxCapacity: 15,
      isActive: true,
      availableDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY', 'SUNDAY'],
      startTime: '09:00',
      endTime: '17:00',
      slotInterval: 150,
      images: ['/offer-2.jpg'],
      mainImage: '/offer-2.jpg',
      requiresReservation: true,
      advanceBookingHours: 24,
    },
  });

  const bodegas = await prisma.hotelService.create({
    data: {
      name: 'Bodegas del Valle',
      description: 'Visita a viñedos variados y cavas históricas con cata exclusiva guiada. Recorra las mejores bodegas de los Valles Calchaquíes.',
      shortDescription: 'Tour de bodegas con cata de vinos premium',
      type: 'EXPERIENCE',
      category: 'WINE_EXPERIENCE',
      price: 12000,
      pricePerPerson: true,
      duration: 240,
      minCapacity: 2,
      maxCapacity: 12,
      isActive: true,
      availableDays: ['TUESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      startTime: '10:00',
      endTime: '18:00',
      slotInterval: 240,
      images: ['/offer-3.jpg'],
      mainImage: '/offer-3.jpg',
      requiresReservation: true,
      advanceBookingHours: 48,
    },
  });

  const teJardines = await prisma.hotelService.create({
    data: {
      name: 'Té en los Jardines',
      description: 'Ceremonia de té con blends andinos servida al aire libre con vistas a los cerros. Momento de relajación y conexión con la naturaleza.',
      shortDescription: 'Ceremonia de té andino en jardines',
      type: 'EXPERIENCE',
      category: 'RELAXATION_NATURE',
      price: 4000,
      pricePerPerson: true,
      duration: 90,
      minCapacity: 1,
      maxCapacity: 20,
      isActive: true,
      availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      startTime: '15:00',
      endTime: '19:00',
      slotInterval: 90,
      images: ['/offer-4.jpg'],
      mainImage: '/offer-4.jpg',
      requiresReservation: true,
      advanceBookingHours: 12,
    },
  });

  console.log('✅ Servicios creados (4 SPA + 4 Experiencias)');

  // ========================================
  // CREAR HABITACIONES
  // ========================================

  const room100 = await prisma.room.create({
    data: {
      number: '100',
      type: 'SUITE_SINGLE',
      price: 8000,
      capacity: 1,
      floor: 1,
      amenities: ['Ropa de cama premium', 'Carta de almohadas', 'Baño en mármol', 'Espacio de trabajo', 'Secador profesional', 'Amenidades de baño', 'Café y té', 'Wi-Fi'],
      images: ['/feat-3.jpg'],
      description: 'Elegancia en un ambiente acogedor.',
      status: 'AVAILABLE',
    },
  });

  const room102 = await prisma.room.create({
    data: {
      number: '102',
      type: 'SUITE_SINGLE',
      price: 8000,
      capacity: 1,
      floor: 1,
      amenities: ['Ropa de cama premium', 'Carta de almohadas', 'Baño en mármol', 'Espacio de trabajo', 'Secador profesional', 'Amenidades de baño', 'Café y té', 'Wi-Fi'],
      images: ['/feat-3.jpg'],
      description: 'Elegancia en un ambiente acogedor.',
      status: 'MAINTENANCE',
    },
  });

  const room201 = await prisma.room.create({
    data: {
      number: '201',
      type: 'SUITE_DOUBLE',
      price: 12000,
      capacity: 2,
      floor: 2,
      amenities: ['Ropa de cama premium', 'Carta de almohadas', 'Baño en mármol', 'Espacio de trabajo', 'Secador profesional', 'Amenidades de baño', 'Café y té', 'Wi-Fi'],
      images: ['/feat-3.jpg'],
      description: 'Amplitud y confort para compartir.',
      status: 'AVAILABLE',
    },
  });

  const room202 = await prisma.room.create({
    data: {
      number: '202',
      type: 'SUITE_DOUBLE',
      price: 12000,
      capacity: 2,
      floor: 2,
      amenities: ['Ropa de cama premium', 'Carta de almohadas', 'Baño en mármol', 'Espacio de trabajo', 'Secador profesional', 'Amenidades de baño', 'Café y té', 'Wi-Fi'],
      images: ['/feat-3.jpg'],
      description: 'Amplitud y confort para compartir.',
      status: 'CLEANING',
    },
  });

  const room203 = await prisma.room.create({
    data: {
      number: '203',
      type: 'SUITE_DOUBLE',
      price: 13000,
      capacity: 2,
      floor: 2,
      amenities: ['Ropa de cama premium', 'Carta de almohadas', 'Baño en mármol', 'Espacio de trabajo', 'Secador profesional', 'Amenidades de baño', 'Café y té', 'Wi-Fi'],
      images: ['/feat-3.jpg'],
      description: 'Amplitud y confort para compartir.',
      status: 'AVAILABLE',
    },
  });

  const room204 = await prisma.room.create({
    data: {
      number: '204',
      type: 'SUITE_DOUBLE',
      price: 13000,
      capacity: 2,
      floor: 2,
      amenities: ['Ropa de cama premium', 'Carta de almohadas', 'Baño en mármol', 'Espacio de trabajo', 'Secador profesional', 'Amenidades de baño', 'Café y té', 'Wi-Fi'],
      images: ['/feat-3.jpg'],
      description: 'Amplitud y confort para compartir.',
      status: 'AVAILABLE',
    },
  });

  const room301 = await prisma.room.create({
    data: {
      number: '301',
      type: 'VILLA_PETIT',
      price: 18000,
      capacity: 3,
      floor: 1,
      amenities: ['Terraza privada', 'Sala de estar', 'Cocina equipada', 'Chimenea', 'Piscina o jacuzzi', 'Batas y pantuflas', 'Parrilla exterior', 'Bar a pedido'],
      images: ['/mosaic-1a.jpg'],
      description: 'Refugio íntimo y privado.',
      status: 'OCCUPIED',
    },
  });

  const room302 = await prisma.room.create({
    data: {
      number: '302',
      type: 'VILLA_PETIT',
      price: 18000,
      capacity: 3,
      floor: 1,
      amenities: ['Terraza privada', 'Sala de estar', 'Cocina equipada', 'Chimenea', 'Piscina o jacuzzi', 'Batas y pantuflas', 'Parrilla exterior', 'Bar a pedido'],
      images: ['/mosaic-1a.jpg'],
      description: 'Refugio íntimo y privado.',
      status: 'AVAILABLE',
    },
  });

  const room401 = await prisma.room.create({
    data: {
      number: '401',
      type: 'VILLA_GRANDE',
      price: 25000,
      capacity: 5,
      floor: 1,
      amenities: ['Terraza privada', 'Sala de estar', 'Cocina equipada', 'Chimenea', 'Piscina o jacuzzi', 'Batas y pantuflas', 'Parrilla exterior', 'Bar a pedido'],
      images: ['/mosaic-1a.jpg'],
      description: 'Espacios amplios con patio y piscina.',
      status: 'AVAILABLE',
    },
  });

  const room402 = await prisma.room.create({
    data: {
      number: '402',
      type: 'VILLA_GRANDE',
      price: 25000,
      capacity: 5,
      floor: 1,
      amenities: ['Terraza privada', 'Sala de estar', 'Cocina equipada', 'Chimenea', 'Piscina o jacuzzi', 'Batas y pantuflas', 'Parrilla exterior', 'Bar a pedido'],
      images: ['/mosaic-1a.jpg'],
      description: 'Espacios amplios con patio y piscina.',
      status: 'AVAILABLE',
    },
  });

  console.log('✅ Habitaciones creadas (10 habitaciones)');

  // ========================================
  // RESERVAS HISTÓRICAS (YA COMPLETADAS)
  // ========================================

  // MAYO - 1 reserva
  const mayCheckIn = new Date();
  mayCheckIn.setMonth(mayCheckIn.getMonth() - 5);
  mayCheckIn.setDate(10);
  const mayCheckOut = new Date(mayCheckIn);
  mayCheckOut.setDate(mayCheckIn.getDate() + 3);

  const reservationMay = await prisma.reservation.create({
    data: {
      checkIn: mayCheckIn,
      checkOut: mayCheckOut,
      totalPrice: 39000,
      guests: 2,
      status: 'CHECKED_OUT',
      specialRequests: 'Escapada de fin de semana',
      userId: user5.id,
      roomId: room204.id,
    },
  });

  await prisma.payment.create({
    data: {
      amount: 39000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-' + (Date.now() - 12960000000),
      reservationId: reservationMay.id,
      userId: user5.id,
    },
  });

  // Servicio para reserva de Mayo
  const mayServiceDate = new Date(mayCheckIn);
  mayServiceDate.setDate(mayCheckIn.getDate() + 1);

  const serviceBookingMay = await prisma.serviceBooking.create({
    data: {
      serviceId: teJardines.id,
      userId: user5.id,
      reservationId: reservationMay.id,
      bookingDate: mayServiceDate,
      bookingTime: '15:00',
      participants: 2,
      totalPrice: 8000,
      status: 'COMPLETED',
      completedAt: mayServiceDate,
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBookingMay.id,
      userId: user5.id,
      amount: 8000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-SRV-' + (Date.now() - 12960000000),
      paidAt: mayServiceDate,
    },
  });

  // JUNIO - 2 reservas
  const junCheckIn1 = new Date();
  junCheckIn1.setMonth(junCheckIn1.getMonth() - 4);
  junCheckIn1.setDate(5);
  const junCheckOut1 = new Date(junCheckIn1);
  junCheckOut1.setDate(junCheckIn1.getDate() + 4);

  const reservationJun1 = await prisma.reservation.create({
    data: {
      checkIn: junCheckIn1,
      checkOut: junCheckOut1,
      totalPrice: 72000,
      guests: 3,
      status: 'CHECKED_OUT',
      userId: user6.id,
      roomId: room301.id,
    },
  });

  await prisma.payment.create({
    data: {
      amount: 72000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'Transferencia',
      transactionId: 'TRANS-' + (Date.now() - 10800000000),
      reservationId: reservationJun1.id,
      userId: user6.id,
    },
  });

  // Servicios para primera reserva de Junio
  const junServiceDate1a = new Date(junCheckIn1);
  junServiceDate1a.setDate(junCheckIn1.getDate() + 1);

  const serviceBookingJun1a = await prisma.serviceBooking.create({
    data: {
      serviceId: yoga.id,
      userId: user6.id,
      reservationId: reservationJun1.id,
      bookingDate: junServiceDate1a,
      bookingTime: '06:30',
      participants: 3,
      totalPrice: 9000,
      status: 'COMPLETED',
      completedAt: junServiceDate1a,
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBookingJun1a.id,
      userId: user6.id,
      amount: 9000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'Transferencia',
      transactionId: 'TRANS-SRV-' + (Date.now() - 10800000000),
      paidAt: junServiceDate1a,
    },
  });

  const junServiceDate1b = new Date(junCheckIn1);
  junServiceDate1b.setDate(junCheckIn1.getDate() + 2);

  const serviceBookingJun1b = await prisma.serviceBooking.create({
    data: {
      serviceId: olivares.id,
      userId: user6.id,
      reservationId: reservationJun1.id,
      bookingDate: junServiceDate1b,
      bookingTime: '09:00',
      participants: 3,
      totalPrice: 19500,
      status: 'COMPLETED',
      completedAt: junServiceDate1b,
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBookingJun1b.id,
      userId: user6.id,
      amount: 19500,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'Transferencia',
      transactionId: 'TRANS-SRV-' + (Date.now() - 10750000000),
      paidAt: junServiceDate1b,
    },
  });

  const junCheckIn2 = new Date();
  junCheckIn2.setMonth(junCheckIn2.getMonth() - 4);
  junCheckIn2.setDate(20);
  const junCheckOut2 = new Date(junCheckIn2);
  junCheckOut2.setDate(junCheckIn2.getDate() + 2);

  const reservationJun2 = await prisma.reservation.create({
    data: {
      checkIn: junCheckIn2,
      checkOut: junCheckOut2,
      totalPrice: 16000,
      guests: 1,
      status: 'CHECKED_OUT',
      userId: user7.id,
      roomId: room100.id,
    },
  });

  await prisma.payment.create({
    data: {
      amount: 16000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-' + (Date.now() - 10368000000),
      reservationId: reservationJun2.id,
      userId: user7.id,
    },
  });

  // Servicio para segunda reserva de Junio
  const junServiceDate2 = new Date(junCheckIn2);
  junServiceDate2.setDate(junCheckIn2.getDate() + 1);

  const serviceBookingJun2 = await prisma.serviceBooking.create({
    data: {
      serviceId: meditacion.id,
      userId: user7.id,
      reservationId: reservationJun2.id,
      bookingDate: junServiceDate2,
      bookingTime: '07:00',
      participants: 1,
      totalPrice: 3500,
      status: 'COMPLETED',
      completedAt: junServiceDate2,
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBookingJun2.id,
      userId: user7.id,
      amount: 3500,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-SRV-' + (Date.now() - 10368000000),
      paidAt: junServiceDate2,
    },
  });

  // JULIO - 2 reservas
  const julCheckIn1 = new Date();
  julCheckIn1.setMonth(julCheckIn1.getMonth() - 3);
  julCheckIn1.setDate(8);
  const julCheckOut1 = new Date(julCheckIn1);
  julCheckOut1.setDate(julCheckIn1.getDate() + 5);

  const reservationJul1 = await prisma.reservation.create({
    data: {
      checkIn: julCheckIn1,
      checkOut: julCheckOut1,
      totalPrice: 125000,
      guests: 5,
      status: 'CHECKED_OUT',
      specialRequests: 'Vacaciones familiares',
      userId: user8.id,
      roomId: room402.id,
    },
  });

  await prisma.payment.create({
    data: {
      amount: 125000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-' + (Date.now() - 8640000000),
      reservationId: reservationJul1.id,
      userId: user8.id,
    },
  });

  // Servicios para primera reserva de Julio
  const julServiceDate1a = new Date(julCheckIn1);
  julServiceDate1a.setDate(julCheckIn1.getDate() + 1);

  const serviceBookingJul1a = await prisma.serviceBooking.create({
    data: {
      serviceId: cocinaAndina.id,
      userId: user8.id,
      reservationId: reservationJul1.id,
      bookingDate: julServiceDate1a,
      bookingTime: '10:00',
      participants: 4,
      totalPrice: 32000,
      status: 'COMPLETED',
      specialRequests: 'Experiencia familiar',
      completedAt: julServiceDate1a,
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBookingJul1a.id,
      userId: user8.id,
      amount: 32000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-SRV-' + (Date.now() - 8640000000),
      paidAt: julServiceDate1a,
    },
  });

  const julServiceDate1b = new Date(julCheckIn1);
  julServiceDate1b.setDate(julCheckIn1.getDate() + 3);

  const serviceBookingJul1b = await prisma.serviceBooking.create({
    data: {
      serviceId: bodegas.id,
      userId: user8.id,
      reservationId: reservationJul1.id,
      bookingDate: julServiceDate1b,
      bookingTime: '10:00',
      participants: 2,
      totalPrice: 24000,
      status: 'COMPLETED',
      specialRequests: 'Solo adultos',
      completedAt: julServiceDate1b,
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBookingJul1b.id,
      userId: user8.id,
      amount: 24000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-SRV-' + (Date.now() - 8380000000),
      paidAt: julServiceDate1b,
    },
  });

  const julCheckIn2 = new Date();
  julCheckIn2.setMonth(julCheckIn2.getMonth() - 3);
  julCheckIn2.setDate(25);
  const julCheckOut2 = new Date(julCheckIn2);
  julCheckOut2.setDate(julCheckIn2.getDate() + 3);

  const reservationJul2 = await prisma.reservation.create({
    data: {
      checkIn: julCheckIn2,
      checkOut: julCheckOut2,
      totalPrice: 36000,
      guests: 2,
      status: 'CHECKED_OUT',
      userId: user4.id,
      roomId: room201.id,
    },
  });

  await prisma.payment.create({
    data: {
      amount: 36000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-' + (Date.now() - 8208000000),
      reservationId: reservationJul2.id,
      userId: user4.id,
    },
  });

  // Servicio para segunda reserva de Julio
  const julServiceDate2 = new Date(julCheckIn2);
  julServiceDate2.setDate(julCheckIn2.getDate() + 1);

  const serviceBookingJul2 = await prisma.serviceBooking.create({
    data: {
      serviceId: entrenamiento.id,
      userId: user4.id,
      reservationId: reservationJul2.id,
      bookingDate: julServiceDate2,
      bookingTime: '06:00',
      participants: 1,
      totalPrice: 4500,
      status: 'COMPLETED',
      completedAt: julServiceDate2,
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBookingJul2.id,
      userId: user4.id,
      amount: 4500,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-SRV-' + (Date.now() - 8208000000),
      paidAt: julServiceDate2,
    },
  });

  // Reserva 1: Hace 3 meses - Juan Gómez (AGOSTO)
  const res1CheckIn = new Date();
  res1CheckIn.setMonth(res1CheckIn.getMonth() - 2);
  res1CheckIn.setDate(10);
  const res1CheckOut = new Date(res1CheckIn);
  res1CheckOut.setDate(res1CheckIn.getDate() + 4);

  const reservation1 = await prisma.reservation.create({
    data: {
      checkIn: res1CheckIn,
      checkOut: res1CheckOut,
      totalPrice: 52000,
      guests: 2,
      status: 'CHECKED_OUT',
      specialRequests: 'Luna de miel, decoración especial',
      userId: user2.id,
      roomId: room203.id,
    },
  });

  await prisma.payment.create({
    data: {
      amount: 52000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-' + (Date.now() - 7776000000),
      reservationId: reservation1.id,
      userId: user2.id,
    },
  });

  // Servicios para reserva 1
  const res1ServiceDate = new Date(res1CheckIn);
  res1ServiceDate.setDate(res1CheckIn.getDate() + 1);

  const serviceBooking1 = await prisma.serviceBooking.create({
    data: {
      serviceId: terapias.id,
      userId: user2.id,
      reservationId: reservation1.id,
      bookingDate: res1ServiceDate,
      bookingTime: '10:00',
      participants: 2,
      totalPrice: 11000,
      status: 'COMPLETED',
      specialRequests: 'Primera vez, quisiéramos una introducción',
      completedAt: res1ServiceDate,
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBooking1.id,
      userId: user2.id,
      amount: 11000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-SRV-' + (Date.now() - 7776000000),
      paidAt: new Date(res1CheckIn),
    },
  });

  // Reserva 2: Hace 2 meses - Laura Martínez (SEPTIEMBRE)
  const res2CheckIn = new Date();
  res2CheckIn.setMonth(res2CheckIn.getMonth() - 1);
  res2CheckIn.setDate(15);
  const res2CheckOut = new Date(res2CheckIn);
  res2CheckOut.setDate(res2CheckIn.getDate() + 3);

  const reservation2 = await prisma.reservation.create({
    data: {
      checkIn: res2CheckIn,
      checkOut: res2CheckOut,
      totalPrice: 24000,
      guests: 1,
      status: 'CHECKED_OUT',
      specialRequests: 'Retiro personal, necesito tranquilidad',
      userId: user3.id,
      roomId: room100.id,
    },
  });

  await prisma.payment.create({
    data: {
      amount: 24000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'Transferencia',
      transactionId: 'TRANS-' + (Date.now() - 5184000000),
      reservationId: reservation2.id,
      userId: user3.id,
    },
  });

  // Servicios para reserva 2
  const res2ServiceDate1 = new Date(res2CheckIn);
  const res2ServiceDate2 = new Date(res2CheckIn);
  res2ServiceDate2.setDate(res2CheckIn.getDate() + 1);

  const serviceBooking2a = await prisma.serviceBooking.create({
    data: {
      serviceId: meditacion.id,
      userId: user3.id,
      reservationId: reservation2.id,
      bookingDate: res2ServiceDate1,
      bookingTime: '07:00',
      participants: 1,
      totalPrice: 3500,
      status: 'COMPLETED',
      completedAt: res2ServiceDate1,
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBooking2a.id,
      userId: user3.id,
      amount: 3500,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-SRV-' + (Date.now() - 5184000000),
      paidAt: res2ServiceDate1,
    },
  });

  const serviceBooking2b = await prisma.serviceBooking.create({
    data: {
      serviceId: yoga.id,
      userId: user3.id,
      reservationId: reservation2.id,
      bookingDate: res2ServiceDate2,
      bookingTime: '06:30',
      participants: 1,
      totalPrice: 3000,
      status: 'COMPLETED',
      completedAt: res2ServiceDate2,
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBooking2b.id,
      userId: user3.id,
      amount: 3000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-SRV-' + (Date.now() - 5180000000),
      paidAt: res2ServiceDate2,
    },
  });

  // Reserva 3: Hace 1 mes - Carlos Rodríguez
  const res3CheckIn = new Date();
  res3CheckIn.setMonth(res3CheckIn.getMonth() - 1);
  res3CheckIn.setDate(20);
  const res3CheckOut = new Date(res3CheckIn);
  res3CheckOut.setDate(res3CheckIn.getDate() + 5);

  const reservation3 = await prisma.reservation.create({
    data: {
      checkIn: res3CheckIn,
      checkOut: res3CheckOut,
      totalPrice: 90000,
      guests: 3,
      status: 'CHECKED_OUT',
      specialRequests: 'Viaje familiar, necesitamos cuna para bebé',
      userId: user4.id,
      roomId: room301.id,
    },
  });

  await prisma.payment.create({
    data: {
      amount: 90000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-' + (Date.now() - 2592000000),
      reservationId: reservation3.id,
      userId: user4.id,
    },
  });

  // Servicios para reserva 3
  const res3ServiceDate = new Date(res3CheckIn);
  res3ServiceDate.setDate(res3CheckIn.getDate() + 2);

  const serviceBooking3 = await prisma.serviceBooking.create({
    data: {
      serviceId: bodegas.id,
      userId: user4.id,
      reservationId: reservation3.id,
      bookingDate: res3ServiceDate,
      bookingTime: '10:00',
      participants: 2,
      totalPrice: 24000,
      status: 'COMPLETED',
      specialRequests: 'Solo los adultos, el niño se queda en el hotel',
      completedAt: res3ServiceDate,
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBooking3.id,
      userId: user4.id,
      amount: 24000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-SRV-' + (Date.now() - 2592000000),
      paidAt: res3ServiceDate,
    },
  });

  // Reserva 4: Hace 3 semanas - Ana López
  const res4CheckIn = new Date();
  res4CheckIn.setDate(res4CheckIn.getDate() - 21);
  const res4CheckOut = new Date(res4CheckIn);
  res4CheckOut.setDate(res4CheckIn.getDate() + 2);

  const reservation4 = await prisma.reservation.create({
    data: {
      checkIn: res4CheckIn,
      checkOut: res4CheckOut,
      totalPrice: 26000,
      guests: 2,
      status: 'CHECKED_OUT',
      userId: user5.id,
      roomId: room204.id,
    },
  });

  await prisma.payment.create({
    data: {
      amount: 26000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-' + (Date.now() - 1814400000),
      reservationId: reservation4.id,
      userId: user5.id,
    },
  });

  // Servicios para reserva 4
  const res4ServiceDate = new Date(res4CheckIn);
  res4ServiceDate.setDate(res4CheckIn.getDate() + 1);

  const serviceBooking4 = await prisma.serviceBooking.create({
    data: {
      serviceId: entrenamiento.id,
      userId: user5.id,
      reservationId: reservation4.id,
      bookingDate: res4ServiceDate,
      bookingTime: '06:00',
      participants: 1,
      totalPrice: 4500,
      status: 'COMPLETED',
      completedAt: res4ServiceDate,
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBooking4.id,
      userId: user5.id,
      amount: 4500,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-SRV-' + (Date.now() - 1814400000),
      paidAt: res4ServiceDate,
    },
  });

  // Reserva 5: Hace 2 semanas - Diego Fernández
  const res5CheckIn = new Date();
  res5CheckIn.setDate(res5CheckIn.getDate() - 14);
  const res5CheckOut = new Date(res5CheckIn);
  res5CheckOut.setDate(res5CheckIn.getDate() + 7);

  const reservation5 = await prisma.reservation.create({
    data: {
      checkIn: res5CheckIn,
      checkOut: res5CheckOut,
      totalPrice: 175000,
      guests: 5,
      status: 'CHECKED_OUT',
      specialRequests: 'Celebración aniversario familiar',
      userId: user6.id,
      roomId: room401.id,
    },
  });

  await prisma.payment.create({
    data: {
      amount: 175000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-' + (Date.now() - 1209600000),
      reservationId: reservation5.id,
      userId: user6.id,
    },
  });

  // Servicios para reserva 5
  const res5ServiceDate1 = new Date(res5CheckIn);
  res5ServiceDate1.setDate(res5CheckIn.getDate() + 2);
  const res5ServiceDate2 = new Date(res5CheckIn);
  res5ServiceDate2.setDate(res5CheckIn.getDate() + 4);

  const serviceBooking5a = await prisma.serviceBooking.create({
    data: {
      serviceId: cocinaAndina.id,
      userId: user6.id,
      reservationId: reservation5.id,
      bookingDate: res5ServiceDate1,
      bookingTime: '10:00',
      participants: 4,
      totalPrice: 32000,
      status: 'COMPLETED',
      specialRequests: 'Taller familiar, niños incluidos',
      completedAt: res5ServiceDate1,
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBooking5a.id,
      userId: user6.id,
      amount: 32000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-SRV-' + (Date.now() - 1209600000),
      paidAt: res5ServiceDate1,
    },
  });

  const serviceBooking5b = await prisma.serviceBooking.create({
    data: {
      serviceId: olivares.id,
      userId: user6.id,
      reservationId: reservation5.id,
      bookingDate: res5ServiceDate2,
      bookingTime: '09:00',
      participants: 5,
      totalPrice: 32500,
      status: 'COMPLETED',
      completedAt: res5ServiceDate2,
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBooking5b.id,
      userId: user6.id,
      amount: 32500,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-SRV-' + (Date.now() - 1205000000),
      paidAt: res5ServiceDate2,
    },
  });

  // Reserva 6: Hace 1 semana - Sofía Pérez
  const res6CheckIn = new Date();
  res6CheckIn.setDate(res6CheckIn.getDate() - 7);
  const res6CheckOut = new Date(res6CheckIn);
  res6CheckOut.setDate(res6CheckIn.getDate() + 3);

  const reservation6 = await prisma.reservation.create({
    data: {
      checkIn: res6CheckIn,
      checkOut: res6CheckOut,
      totalPrice: 36000,
      guests: 2,
      status: 'CHECKED_OUT',
      specialRequests: 'Aniversario de pareja',
      userId: user7.id,
      roomId: room201.id,
    },
  });

  await prisma.payment.create({
    data: {
      amount: 36000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-' + (Date.now() - 604800000),
      reservationId: reservation6.id,
      userId: user7.id,
    },
  });

  // Servicios para reserva 6
  const res6ServiceDate = new Date(res6CheckIn);
  res6ServiceDate.setDate(res6CheckIn.getDate() + 1);

  const serviceBooking6a = await prisma.serviceBooking.create({
    data: {
      serviceId: teJardines.id,
      userId: user7.id,
      reservationId: reservation6.id,
      bookingDate: res6ServiceDate,
      bookingTime: '15:00',
      participants: 2,
      totalPrice: 8000,
      status: 'COMPLETED',
      completedAt: res6ServiceDate,
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBooking6a.id,
      userId: user7.id,
      amount: 8000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-SRV-' + (Date.now() - 604800000),
      paidAt: res6ServiceDate,
    },
  });

  const serviceBooking6b = await prisma.serviceBooking.create({
    data: {
      serviceId: terapias.id,
      userId: user7.id,
      reservationId: reservation6.id,
      bookingDate: res6ServiceDate,
      bookingTime: '10:00',
      participants: 2,
      totalPrice: 11000,
      status: 'COMPLETED',
      completedAt: res6ServiceDate,
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBooking6b.id,
      userId: user7.id,
      amount: 11000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-SRV-' + (Date.now() - 604700000),
      paidAt: res6ServiceDate,
    },
  });

  console.log('✅ Reservas históricas creadas (10 reservas completadas con servicios distribuidas en 6 meses)');

  // ========================================
  // RESERVAS ACTIVAS Y FUTURAS
  // ========================================

  // Reserva actual - Roberto Sánchez (checked in)
  const resCurrentCheckIn = new Date();
  resCurrentCheckIn.setDate(resCurrentCheckIn.getDate() - 2);
  const resCurrentCheckOut = new Date();
  resCurrentCheckOut.setDate(resCurrentCheckOut.getDate() + 3);

  const reservationCurrent = await prisma.reservation.create({
    data: {
      checkIn: resCurrentCheckIn,
      checkOut: resCurrentCheckOut,
      totalPrice: 54000,
      guests: 3,
      status: 'CHECKED_IN',
      specialRequests: 'Habitación cerca del SPA',
      userId: user8.id,
      roomId: room302.id,
    },
  });

  await prisma.payment.create({
    data: {
      amount: 54000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-' + (Date.now() - 172800000),
      reservationId: reservationCurrent.id,
      userId: user8.id,
    },
  });

  // Servicios para reserva actual
  const resCurrentServiceDate = new Date();
  resCurrentServiceDate.setDate(resCurrentServiceDate.getDate() + 1);

  const serviceBookingCurrent = await prisma.serviceBooking.create({
    data: {
      serviceId: yoga.id,
      userId: user8.id,
      reservationId: reservationCurrent.id,
      bookingDate: resCurrentServiceDate,
      bookingTime: '06:30',
      participants: 2,
      totalPrice: 6000,
      status: 'CONFIRMED',
      specialRequests: 'Nivel principiante',
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBookingCurrent.id,
      userId: user8.id,
      amount: 6000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-SRV-' + Date.now(),
      paidAt: new Date(),
    },
  });

  // Reserva futura 1 - María Cliente (próxima semana)
  const resFuture1CheckIn = new Date();
  resFuture1CheckIn.setDate(resFuture1CheckIn.getDate() + 7);
  const resFuture1CheckOut = new Date(resFuture1CheckIn);
  resFuture1CheckOut.setDate(resFuture1CheckIn.getDate() + 6);

  const reservationFuture1 = await prisma.reservation.create({
    data: {
      checkIn: resFuture1CheckIn,
      checkOut: resFuture1CheckOut,
      totalPrice: 78000,
      guests: 2,
      status: 'CONFIRMED',
      specialRequests: 'Cama matrimonial y vista a la montaña',
      userId: user1.id,
      roomId: room203.id,
    },
  });

  await prisma.payment.create({
    data: {
      amount: 78000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-' + Date.now(),
      reservationId: reservationFuture1.id,
      userId: user1.id,
    },
  });

  // Servicios para reserva futura 1
  const resFuture1ServiceDate = new Date(resFuture1CheckIn);
  resFuture1ServiceDate.setDate(resFuture1CheckIn.getDate() + 1);

  const serviceBookingFuture1 = await prisma.serviceBooking.create({
    data: {
      serviceId: yoga.id,
      userId: user1.id,
      reservationId: reservationFuture1.id,
      bookingDate: resFuture1ServiceDate,
      bookingTime: '07:00',
      participants: 2,
      totalPrice: 6000,
      status: 'CONFIRMED',
      specialRequests: 'Preferimos sesión al aire libre',
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBookingFuture1.id,
      userId: user1.id,
      amount: 6000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-SRV-' + (Date.now() + 1000),
      paidAt: new Date(),
    },
  });

  // Reserva futura 2 - Juan Gómez (en 2 semanas)
  const resFuture2CheckIn = new Date();
  resFuture2CheckIn.setDate(resFuture2CheckIn.getDate() + 14);
  const resFuture2CheckOut = new Date(resFuture2CheckIn);
  resFuture2CheckOut.setDate(resFuture2CheckIn.getDate() + 4);

  const reservationFuture2 = await prisma.reservation.create({
    data: {
      checkIn: resFuture2CheckIn,
      checkOut: resFuture2CheckOut,
      totalPrice: 100000,
      guests: 5,
      status: 'CONFIRMED',
      specialRequests: 'Reunión familiar',
      userId: user2.id,
      roomId: room402.id,
    },
  });

  await prisma.payment.create({
    data: {
      amount: 100000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'Transferencia',
      transactionId: 'TRANS-' + (Date.now() + 2000),
      reservationId: reservationFuture2.id,
      userId: user2.id,
    },
  });

  // Servicios para reserva futura 2
  const resFuture2ServiceDate = new Date(resFuture2CheckIn);
  resFuture2ServiceDate.setDate(resFuture2CheckIn.getDate() + 1);

  const serviceBookingFuture2 = await prisma.serviceBooking.create({
    data: {
      serviceId: bodegas.id,
      userId: user2.id,
      reservationId: reservationFuture2.id,
      bookingDate: resFuture2ServiceDate,
      bookingTime: '10:00',
      participants: 4,
      totalPrice: 48000,
      status: 'CONFIRMED',
      specialRequests: 'Grupo familiar, incluir degustación completa',
    },
  });

  await prisma.servicePayment.create({
    data: {
      bookingId: serviceBookingFuture2.id,
      userId: user2.id,
      amount: 48000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-SRV-' + (Date.now() + 3000),
      paidAt: new Date(),
    },
  });

  // Reserva futura 3 - Laura Martínez (en 3 semanas)
  const resFuture3CheckIn = new Date();
  resFuture3CheckIn.setDate(resFuture3CheckIn.getDate() + 21);
  const resFuture3CheckOut = new Date(resFuture3CheckIn);
  resFuture3CheckOut.setDate(resFuture3CheckIn.getDate() + 2);

  const reservationFuture3 = await prisma.reservation.create({
    data: {
      checkIn: resFuture3CheckIn,
      checkOut: resFuture3CheckOut,
      totalPrice: 16000,
      guests: 1,
      status: 'CONFIRMED',
      specialRequests: 'Necesito espacio tranquilo para trabajar',
      userId: user3.id,
      roomId: room100.id,
    },
  });

  await prisma.payment.create({
    data: {
      amount: 16000,
      currency: 'ARS',
      status: 'APPROVED',
      paymentMethod: 'MercadoPago',
      transactionId: 'MP-' + (Date.now() + 4000),
      reservationId: reservationFuture3.id,
      userId: user3.id,
    },
  });

  console.log('✅ Reservas activas y futuras creadas (4 reservas)');

  // ========================================
  // GENERAR TIME SLOTS
  // ========================================

  console.log('⏰ Generando slots de tiempo para los próximos 30 días...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 30);

  const allServices = [
    meditacion,
    entrenamiento,
    terapias,
    yoga,
    cocinaAndina,
    olivares,
    bodegas,
    teJardines,
  ];

  const dayMap: { [key: string]: number } = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  };

  let totalSlotsCreated = 0;

  for (const service of allServices) {
    const slots = [];
    const currentDate = new Date(today);

    console.log(`   Generando slots para: ${service.name}`);

    while (currentDate <= futureDate) {
      const dayName = Object.keys(dayMap).find(
        (key) => dayMap[key] === currentDate.getDay()
      );

      if (dayName && service.availableDays.includes(dayName)) {
        const [startHour, startMinute] = service.startTime.split(':').map(Number);
        const [endHour, endMinute] = service.endTime.split(':').map(Number);

        let currentTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        while (currentTime + service.duration <= endTime) {
          const slotStartHour = Math.floor(currentTime / 60);
          const slotStartMinute = currentTime % 60;

          const slotEndTime = currentTime + service.duration;
          const slotEndHour = Math.floor(slotEndTime / 60);
          const slotEndMinute = slotEndTime % 60;

          const startTimeStr = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute
            .toString()
            .padStart(2, '0')}`;
          const endTimeStr = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute
            .toString()
            .padStart(2, '0')}`;

          slots.push({
            serviceId: service.id,
            date: new Date(currentDate),
            startTime: startTimeStr,
            endTime: endTimeStr,
            capacity: service.maxCapacity,
            booked: 0,
            isAvailable: true,
          });

          currentTime += service.slotInterval;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (slots.length > 0) {
      await prisma.serviceTimeSlot.createMany({
        data: slots,
      });
      totalSlotsCreated += slots.length;
      console.log(`   ✓ ${slots.length} slots creados para ${service.name}`);
    }
  }

  console.log(`✅ Total de slots creados: ${totalSlotsCreated}`);

  // ========================================
  // CONSULTAS
  // ========================================

  await prisma.consultation.createMany({
    data: [
      {
        name: 'Juan Pérez',
        subject: 'Consulta sobre tarifas grupales',
        message: '¿Tienen descuentos para grupos de más de 10 personas?',
        email: 'grupo@empresa.com',
        phone: '+54 9 387 5558888',
        status: 'PENDING',
      },
      {
        name: 'María Cliente',
        subject: 'Disponibilidad en diciembre',
        message: 'Quisiera saber disponibilidad para la última semana de diciembre',
        email: 'vacaciones@mail.com',
        phone: '+54 9 387 5557777',
        status: 'IN_REVIEW',
        userId: user1.id,
      },
      {
        name: 'Carlos Rodríguez',
        subject: 'Consulta sobre servicios',
        message: '¿El hotel cuenta con servicio de traslado desde el aeropuerto?',
        email: 'carlos@mail.com',
        phone: '+54 9 387 5556666',
        status: 'RESOLVED',
        response: 'Sí, contamos con servicio de traslado. El costo es de $5000 por trayecto.',
        respondedAt: new Date(),
      },
      {
        name: 'Patricia Gómez',
        subject: 'Consulta sobre accesibilidad',
        message: '¿Las habitaciones están adaptadas para personas con movilidad reducida?',
        email: 'patricia.g@mail.com',
        phone: '+54 9 387 4443322',
        status: 'RESOLVED',
        response: 'Sí, contamos con habitaciones adaptadas. Por favor indíquenos sus necesidades específicas.',
        respondedAt: new Date(),
      },
      {
        name: 'Martín Torres',
        subject: 'Reserva para evento corporativo',
        message: 'Necesitamos organizar un retiro corporativo para 20 personas en noviembre',
        email: 'mtorres@empresa.com',
        phone: '+54 9 387 3332211',
        status: 'IN_REVIEW',
      },
    ],
  });

  console.log('✅ Consultas creadas');

  // ========================================
  // SUSCRIPTORES CON FECHAS DISTRIBUIDAS
  // ========================================

  // Julio - 1 suscriptor
  const julyDate = new Date();
  julyDate.setMonth(julyDate.getMonth() - 3);
  julyDate.setDate(15);

  await prisma.subscriber.create({
    data: {
      email: 'subscriber1@example.com',
      active: true,
      createdAt: julyDate,
    },
  });

  // Agosto - 2 suscriptores más (total acumulado: 3)
  const augustDate1 = new Date();
  augustDate1.setMonth(augustDate1.getMonth() - 2);
  augustDate1.setDate(10);

  const augustDate2 = new Date();
  augustDate2.setMonth(augustDate2.getMonth() - 2);
  augustDate2.setDate(25);

  await prisma.subscriber.create({
    data: {
      email: 'subscriber2@example.com',
      active: true,
      createdAt: augustDate1,
    },
  });

  await prisma.subscriber.create({
    data: {
      email: 'subscriber3@example.com',
      active: true,
      createdAt: augustDate2,
    },
  });

  // Septiembre - 2 suscriptores más (total acumulado: 5)
  const septDate1 = new Date();
  septDate1.setMonth(septDate1.getMonth() - 1);
  septDate1.setDate(5);

  const septDate2 = new Date();
  septDate2.setMonth(septDate2.getMonth() - 1);
  septDate2.setDate(20);

  await prisma.subscriber.create({
    data: {
      email: 'subscriber4@example.com',
      active: true,
      createdAt: septDate1,
    },
  });

  await prisma.subscriber.create({
    data: {
      email: user1.email,
      active: true,
      createdAt: septDate2,
    },
  });

  // Octubre - 3 suscriptores más (total acumulado: 8)
  const octDate1 = new Date();
  octDate1.setDate(5);

  const octDate2 = new Date();
  octDate2.setDate(12);

  const octDate3 = new Date();
  octDate3.setDate(18);

  await prisma.subscriber.create({
    data: {
      email: user2.email,
      active: true,
      createdAt: octDate1,
    },
  });

  await prisma.subscriber.create({
    data: {
      email: user3.email,
      active: true,
      createdAt: octDate2,
    },
  });

  await prisma.subscriber.create({
    data: {
      email: 'unsubscribed@example.com',
      active: false,
      createdAt: octDate3,
      deactivatedAt: new Date(),
    },
  });

  console.log('✅ Suscriptores creados con fechas distribuidas');

  // ========================================
  // RESUMEN FINAL
  // ========================================

  console.log('');
  console.log('🎉 Seed completado exitosamente!');
  console.log('');
  console.log('📝 Usuarios creados:');
  console.log('   Admin: admin@tierraalta.com / password123');
  console.log('   Operador: operador@tierraalta.com / password123');
  console.log('   Clientes: 8 usuarios (cliente@example.com, juan.gomez@gmail.com, etc.)');
  console.log('');
  console.log('📊 Datos creados:');
  console.log('   - 10 habitaciones');
  console.log('   - 8 servicios (4 SPA + 4 Experiencias)');
  console.log('   - 10 reservas de habitaciones:');
  console.log('     * 6 completadas (históricas)');
  console.log('     * 1 activa (check-in)');
  console.log('     * 3 futuras (confirmadas)');
  console.log('   - 12 reservas de servicios con pagos');
  console.log('   - 5 consultas (3 resueltas, 2 pendientes)');
  console.log('   - 8 suscriptores al newsletter');
  console.log(`   - ${totalSlotsCreated} slots de tiempo para servicios`);
  console.log('');
  console.log('💰 Total facturado histórico: ~$600,000 ARS');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });