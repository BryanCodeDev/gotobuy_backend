# GoToBuy - Backend API

## Despliegue en Railway

1. Conecta este repositorio a Railway
2. Configura el directorio raíz como `backend`
3. Añade el plugin MySQL
4. Configura las variables de entorno

## Variables de Entorno Requeridas

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gotobuyy
DB_PORT=3306
JWT_SECRET=tu_secret_key_aqui
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxx
MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxx
MERCADO_PAGO_CLIENT_ID=xxx
MERCADO_PAGO_CLIENT_SECRET=xxx
FRONTEND_URL=https://tudominio.netlify.app
BACKEND_URL=https://tu-backend.railway.app
PORT=5000
```

## Estructura

```
backend/
├── server/
│   ├── config/
│   │   ├── db.js
│   │   └── initDB.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── orders.js
│   │   └── payment.js
│   └── index.js
├── package.json
├── railway.json
└── Procfile
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Login de admin
- `POST /api/auth/verify` - Verificar token JWT

### Pedidos
- `GET /api/orders` - Obtener todos los pedidos
- `GET /api/orders/stats` - Estadísticas
- `GET /api/orders/:id` - Obtener pedido por ID
- `POST /api/orders` - Crear nuevo pedido
- `PUT /api/orders/:id/status` - Actualizar estado

### Pagos
- `POST /api/payment/create-preference` - Crear preferencia Mercado Pago
- `POST /api/payment/webhook` - Webhook de Mercado Pago
- `GET /api/payment/status/:paymentId` - Estado del pago
