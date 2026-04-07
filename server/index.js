require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initializeDatabase = require('../config/initDB');

const paymentRoutes = require('../routes/payment');
const orderRoutes = require('../routes/orders');
const authRoutes = require('../routes/auth');

const app = express();
const PORT = process.env.PORT || 8080;

const allowedOrigins = process.env.FRONTEND_URL 
  ? [
      process.env.FRONTEND_URL, 
      process.env.FRONTEND_URL.includes('gotobuyy.com') ? 'https://www.gotobuyy.com' : null,
      'https://gotobuyy.com',
      'https://www.gotobuyy.com'
    ].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // En desarrollo permitir localhost
    if (process.env.NODE_ENV !== 'production' && (!origin || origin.startsWith('http://localhost:'))) {
      return callback(null, true);
    }
    
    // En producción validación estricta
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://sdk.mercadopago.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.mercadopago.com https://www.google-analytics.com https://wonderful-joy-production-9b32.up.railway.app; frame-src 'self' https://www.mercadopago.com https://wonderful-joy-production-9b32.up.railway.app");
  res.setHeader('X-Frame-Options', 'ALLOW-FROM https://gotobuyy.com');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

app.use('/api/payment', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  await initializeDatabase();
  console.log('✅ Base de datos migrada y lista');
});

module.exports = app;