const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [orders] = await pool.execute('SELECT * FROM orders ORDER BY created_at DESC');
    
    const parsedOrders = orders.map(order => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    }));

    res.json(parsedOrders);
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [totalSales] = await pool.execute('SELECT SUM(total) as total FROM orders WHERE payment_status = "pagado"');
    const [totalOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders');
    const [pendingOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders WHERE status = "nuevo"');
    const [deliveredOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders WHERE status = "entregado"');

    const [recentOrders] = await pool.execute(`
      SELECT * FROM orders ORDER BY created_at DESC LIMIT 10
    `);

    const parsedRecentOrders = recentOrders.map(order => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    }));

    res.json({
      totalSales: totalSales[0].total || 0,
      totalOrders: totalOrders[0].count,
      pendingOrders: pendingOrders[0].count,
      deliveredOrders: deliveredOrders[0].count,
      recentOrders: parsedRecentOrders
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      customerLastname,
      customerPhone,
      customerEmail,
      department,
      city,
      address,
      paymentMethod,
      items,
      subtotal,
      shippingCost,
      total
    } = req.body;

    if (!customerName || !customerPhone || !customerEmail || !department || !city || !address || !paymentMethod) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados' });
    }

    const [result] = await pool.execute(
      `INSERT INTO orders (
        customer_name, customer_lastname, customer_phone, customer_email,
        department, city, address, payment_method, items, subtotal, shipping_cost, total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerName,
        customerLastname || '',
        customerPhone,
        customerEmail,
        department,
        city,
        address,
        paymentMethod,
        JSON.stringify(items),
        subtotal,
        shippingCost || 0,
        total
      ]
    );

    res.status(201).json({
      message: 'Pedido creado exitosamente',
      orderId: result.insertId
    });
  } catch (error) {
    console.error('Error creando pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const updates = [];
    const values = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
    }

    if (paymentStatus) {
      updates.push('payment_status = ?');
      values.push(paymentStatus);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay actualizaciones para realizar' });
    }

    values.push(id);
    await pool.execute(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Pedido actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const order = orders[0];
    order.items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

    res.json(order);
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
