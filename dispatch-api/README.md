# Dispatch API Mock

API simulada para gestión de despachos y entregas. Proporciona endpoints para verificar disponibilidad de entrega, crear despachos y rastrear el estado de las entregas.

## 🚀 Inicio Rápido

### Instalación

```bash
cd dispatch-api
npm install
```

### Ejecución

```bash
# Modo producción
npm start

# Modo desarrollo (con auto-reload)
npm run dev
```

La API estará disponible en: `http://localhost:3002`

---

## 📡 Endpoints

### 1. Verificar Disponibilidad de Entrega

Consulta si hay disponibilidad de entrega para una dirección y obtiene la fecha estimada.

**Endpoint:** `POST /api/dispatch/check-availability`

**Request:**
```json
{
  "address": "Calle Principal 123, Centro, Ciudad"
}
```

**Response:**
```json
{
  "available": true,
  "estimatedDeliveryDate": "2025-12-06T00:00:00.000Z",
  "deliveryDays": 1,
  "zone": "Express",
  "deliveryCost": 10.00
}
```

**Zonas de Entrega:**
- **Express**: 1 día (palabras clave: centro, downtown, norte)
- **Standard**: 3 días (palabras clave: sur, este, oeste)
- **Extended**: 5 días (palabras clave: rural, remoto, provincia)
- **Premium**: 1 día (palabras clave: urgente, express, premium)

---

### 2. Crear Despacho

Crea un nuevo registro de despacho para una venta.

**Endpoint:** `POST /api/dispatch/create`

**Request:**
```json
{
  "saleId": "uuid-de-la-venta",
  "customerName": "Juan Pérez",
  "customerAddress": "Calle Principal 123",
  "customerEmail": "juan@email.com",
  "deliveryDate": "2025-12-06T00:00:00.000Z",
  "items": [
    {
      "productId": "prod-001",
      "quantity": 2,
      "description": "Producto de ejemplo"
    }
  ]
}
```

**Response:**
```json
{
  "dispatchId": "DISPATCH-1733280000-abc123",
  "status": "PENDING",
  "trackingNumber": "TRK-1733280000",
  "estimatedDeliveryDate": "2025-12-06T00:00:00.000Z",
  "createdAt": "2025-12-03T10:00:00.000Z"
}
```

---

### 3. Consultar Despacho

Obtiene los detalles completos de un despacho.

**Endpoint:** `GET /api/dispatch/:dispatchId`

**Response:**
```json
{
  "id": "DISPATCH-1733280000-abc123",
  "saleId": "uuid-de-la-venta",
  "trackingNumber": "TRK-1733280000",
  "status": "PENDING",
  "customer": {
    "name": "Juan Pérez",
    "address": "Calle Principal 123",
    "email": "juan@email.com"
  },
  "items": [
    {
      "productId": "prod-001",
      "quantity": 2,
      "description": "Producto de ejemplo"
    }
  ],
  "estimatedDeliveryDate": "2025-12-06T00:00:00.000Z",
  "createdAt": "2025-12-03T10:00:00.000Z",
  "updatedAt": "2025-12-03T10:00:00.000Z",
  "history": [
    {
      "status": "PENDING",
      "timestamp": "2025-12-03T10:00:00.000Z",
      "location": "Warehouse",
      "notes": "Dispatch created and pending processing"
    }
  ]
}
```

---

### 4. Actualizar Estado de Despacho

Actualiza el estado de un despacho en el sistema.

**Endpoint:** `PATCH /api/dispatch/:dispatchId/status`

**Request:**
```json
{
  "status": "IN_TRANSIT",
  "location": "Distribution Center",
  "notes": "Package in transit to delivery address"
}
```

**Estados Válidos:**
- `PENDING` - Pendiente de procesamiento
- `IN_TRANSIT` - En tránsito
- `OUT_FOR_DELIVERY` - En ruta de entrega
- `DELIVERED` - Entregado
- `CANCELLED` - Cancelado
- `RETURNED` - Devuelto

**Response:**
```json
{
  "dispatchId": "DISPATCH-1733280000-abc123",
  "status": "IN_TRANSIT",
  "updatedAt": "2025-12-03T14:30:00.000Z"
}
```

---

## 🔧 Endpoints de Debug

### Listar Todos los Despachos

**Endpoint:** `GET /api/dispatch`

**Query Parameters:**
- `status` (opcional): Filtrar por estado
- `saleId` (opcional): Filtrar por ID de venta

**Ejemplo:**
```
GET /api/dispatch?status=PENDING
GET /api/dispatch?saleId=uuid-de-venta
```

---

### Consultar Zonas de Entrega

**Endpoint:** `GET /api/dispatch/zones`

**Response:**
```json
{
  "data": [
    {
      "name": "Express",
      "keywords": ["centro", "downtown", "city center", "norte"],
      "deliveryDays": 1,
      "cost": 10.00,
      "available": true,
      "description": "Same day or next day delivery for central areas"
    }
  ],
  "total": 4
}
```

---

### Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "service": "dispatch-api",
  "timestamp": "2025-12-03T10:00:00.000Z",
  "uptime": 3600,
  "stats": {
    "totalDispatches": 10,
    "byStatus": {
      "PENDING": 3,
      "IN_TRANSIT": 5,
      "DELIVERED": 2
    },
    "deliveryZones": 4
  }
}
```

---

## 🐳 Docker

### Construir Imagen

```bash
docker build -t dispatch-api-mock .
```

### Ejecutar Contenedor

```bash
docker run -p 3002:3002 dispatch-api-mock
```

---

## 📝 Configuración de Zonas

Las zonas de entrega se configuran en `src/deliveryZones.js`. Puedes agregar o modificar zonas según tus necesidades:

```javascript
{
  name: 'Express',
  keywords: ['centro', 'downtown'],
  deliveryDays: 1,
  cost: 10.00,
  available: true,
  description: 'Express delivery'
}
```

---

## 🔄 Integración con Sales API

La API de ventas se conecta automáticamente a esta API cuando:

1. Se selecciona "Envío a Domicilio"
2. Se finaliza una venta con estado COMPLETED

**Variables de Entorno en Sales API:**
```env
DISPATCH_API_URL=http://localhost:3002
```

---

## 📊 Ejemplos de Uso

### Verificar Disponibilidad

```bash
curl -X POST http://localhost:3002/api/dispatch/check-availability \
  -H "Content-Type: application/json" \
  -d '{"address": "Calle Centro 123"}'
```

### Crear Despacho

```bash
curl -X POST http://localhost:3002/api/dispatch/create \
  -H "Content-Type: application/json" \
  -d '{
    "saleId": "sale-123",
    "customerName": "Juan Pérez",
    "customerAddress": "Calle Centro 123",
    "customerEmail": "juan@email.com",
    "items": [{"productId": "prod-1", "quantity": 2}]
  }'
```

### Actualizar Estado

```bash
curl -X PATCH http://localhost:3002/api/dispatch/DISPATCH-123/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_TRANSIT",
    "location": "Distribution Center"
  }'
```

---

## 🧪 Testing

Esta es una API mock para pruebas. Los datos se almacenan en memoria y se pierden al reiniciar el servidor.

**Características:**
- ✅ Detección automática de zonas por palabras clave
- ✅ Cálculo de fechas de entrega
- ✅ Historial de estados
- ✅ Números de tracking únicos
- ✅ Validación de datos

---

## 📄 Licencia

MIT
