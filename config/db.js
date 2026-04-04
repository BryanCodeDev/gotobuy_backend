const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('=== Variables de entorno DB ===');
console.log('MYSQLHOST:', process.env.MYSQLHOST);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('MYSQLPORT:', process.env.MYSQLPORT);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('MYSQLUSER:', process.env.MYSQLUSER);
console.log('DB_USER:', process.env.DB_USER);
console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('==============================');

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway',
  port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '57841'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000,
  acquireTimeout: 20000,
  enableKeepAlive: true,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;
