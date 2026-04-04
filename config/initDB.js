const pool = require('./db');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        customer_lastname VARCHAR(100),
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(100) NOT NULL,
        department VARCHAR(50) NOT NULL,
        city VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        payment_method ENUM('contraentrega', 'tarjeta') NOT NULL DEFAULT 'contraentrega',
        payment_status ENUM('pendiente', 'pagado', 'rechazado') NOT NULL DEFAULT 'pendiente',
        items JSON NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
        total DECIMAL(10, 2) NOT NULL,
        status ENUM('nuevo', 'procesando', 'enviado', 'entregado', 'cancelado') NOT NULL DEFAULT 'nuevo',
        mercado_pago_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [existingAdmin] = await pool.execute('SELECT * FROM admin_users WHERE username = ?', ['admin']);
    
    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.execute(
        'INSERT INTO admin_users (username, password, email) VALUES (?, ?, ?)',
        ['admin', hashedPassword, 'admin@gotobuyy.com']
      );
      console.log('✅ Usuario admin creado por defecto: admin / admin123');
    }

    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
}

module.exports = initializeDatabase;
