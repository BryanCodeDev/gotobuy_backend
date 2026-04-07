const pool = require('./db');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  const maxRetries = 15;
  const retryDelay = 5000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Intentando conectar a la base de datos (intento ${attempt}/${maxRetries})...`);
      
      await pool.execute('SELECT 1');
      console.log('✅ Conexión a la base de datos establecida');

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

      const [existingAdmin] = await pool.execute('SELECT * FROM admin_users WHERE username = ?', ['juancabas']);
      
      if (existingAdmin.length === 0) {
        const hashedPassword = await bcrypt.hash('Juancholo25', 10);
        await pool.execute(
          'INSERT INTO admin_users (username, password, email) VALUES (?, ?, ?)',
          ['juancabas', hashedPassword, 'juancabas@gotobuyy.com']
        );
        console.log('✅ Usuario admin creado por defecto: juancabas / Juancholo25');
      }

      console.log('✅ Base de datos inicializada correctamente');
      return;
    } catch (error) {
      console.error(`❌ Error en intento ${attempt}:`);
      console.error('  Código:', error.code);
      console.error('  Mensaje:', error.message);
      console.error('  Host:', process.env.MYSQLHOST || process.env.DB_HOST);
      console.error('  Puerto:', process.env.MYSQLPORT || process.env.DB_PORT);
      console.error('  Usuario:', process.env.MYSQLUSER || process.env.DB_USER);
      console.error('  Base de datos:', process.env.MYSQLDATABASE || process.env.DB_NAME);
      
      if (attempt === maxRetries) {
        console.error('❌ No se pudo conectar a la base de datos después de', maxRetries, 'intentos');
        console.error('Verifica que las variables de entorno estén configuradas correctamente en Railway');
        throw error;
      }
      
      console.log(`Reintentando en ${retryDelay / 1000} segundos...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

module.exports = initializeDatabase;
