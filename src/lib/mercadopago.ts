import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

// Configuración del cliente de MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
  },
});

// Instancias de los servicios
export const payment = new Payment(client);
export const preference = new Preference(client);

export default client;