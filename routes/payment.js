const express = require('express');
const MercadoPago = require('mercadopago');
const pool = require('../config/db');
const router = express.Router();

const mp = new MercadoPago.MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

router.post('/create-preference', async (req, res) => {
  try {
    const { items, customerEmail, orderId } = req.body;

    if (!items || !items.length || !customerEmail) {
      return res.status(400).json({ error: 'Datos insuficientes para crear preferencia' });
    }

    const preferenceItems = items.map(item => ({
      title: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: 'COP'
    }));

    const preference = new MercadoPago.Preference(mp);

    const result = await preference.create({
      body: {
        items: preferenceItems,
        payer: {
          email: customerEmail
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL}/payment/success?order_id=${orderId}`,
          failure: `${process.env.FRONTEND_URL}/payment/failure`,
          pending: `${process.env.FRONTEND_URL}/payment/pending`
        },
        auto_return: 'approved',
        notification_url: `${process.env.BACKEND_URL}/api/payment/webhook`,
        external_reference: orderId ? orderId.toString() : Date.now().toString()
      }
    });

    res.json({
      id: result.id,
      init_point: result.init_point
    });
  } catch (error) {
    console.error('Error creando preferencia:', error);
    res.status(500).json({ error: 'Error creando preferencia de pago' });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data.id;
      
      const payment = new MercadoPago.Payment(mp);
      const paymentInfo = await payment.get({ id: paymentId });

      const externalReference = paymentInfo.external_reference;
      const status = paymentInfo.status;

      if (externalReference) {
        const orderId = parseInt(externalReference);
        
        if (status === 'approved') {
          await pool.execute(
            'UPDATE orders SET payment_status = "pagado", mercado_pago_id = ? WHERE id = ?',
            [paymentId, orderId]
          );
        } else if (status === 'rejected') {
          await pool.execute(
            'UPDATE orders SET payment_status = "rechazado", mercado_pago_id = ? WHERE id = ?',
            [paymentId, orderId]
          );
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error en webhook:', error);
    res.sendStatus(500);
  }
});

router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = new MercadoPago.Payment(mp);
    const paymentInfo = await payment.get({ id: paymentId });

    res.json({
      status: paymentInfo.status,
      status_detail: paymentInfo.status_detail
    });
  } catch (error) {
    console.error('Error verificando pago:', error);
    res.status(500).json({ error: 'Error verificando estado del pago' });
  }
});

module.exports = router;
