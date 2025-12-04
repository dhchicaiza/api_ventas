# Configuración de la API de Despachos

## Variables de Entorno

Para configurar la URL de la API de despachos, edita el archivo `.env` en el directorio `backend`:

```env
DISPATCH_API_URL="http://localhost:3002"  # Cambiar por la URL real de la API de despachos
```

## Endpoints de la API de Despachos

La aplicación espera que la API de despachos implemente los siguientes endpoints:

### 1. Verificar Disponibilidad de Entrega

**Endpoint:** `POST /api/dispatch/check-availability`

**Request Body:**
```json
{
  "address": "Dirección del cliente"
}
```

**Response:**
```json
{
  "available": true,
  "estimatedDeliveryDate": "2025-12-06T00:00:00.000Z",
  "deliveryDays": 3
}
```

**Campos de Respuesta:**
- `available` (boolean): Indica si hay disponibilidad de entrega
- `estimatedDeliveryDate` (string ISO 8601): Fecha estimada de entrega
- `deliveryDays` (number): Días estimados para la entrega

---

### 2. Crear Despacho

**Endpoint:** `POST /api/dispatch/create`

**Request Body:**
```json
{
  "saleId": "uuid-de-la-venta",
  "customerName": "Nombre del Cliente",
  "customerAddress": "Dirección de entrega",
  "customerEmail": "email@cliente.com",
  "deliveryDate": "2025-12-06T00:00:00.000Z",
  "items": [
    {
      "productId": "prod-001",
      "quantity": 2,
      "description": "Descripción del producto (opcional)"
    }
  ]
}
```

**Response:**
```json
{
  "dispatchId": "DISPATCH-123456",
  "status": "PENDING",
  "trackingNumber": "TRK-123456",
  "estimatedDeliveryDate": "2025-12-06T00:00:00.000Z"
}
```

**Campos de Respuesta:**
- `dispatchId` (string): ID único del despacho
- `status` (string): Estado del despacho (PENDING, IN_TRANSIT, DELIVERED, etc.)
- `trackingNumber` (string, opcional): Número de seguimiento
- `estimatedDeliveryDate` (string ISO 8601): Fecha estimada de entrega

---

### 3. Consultar Estado de Despacho

**Endpoint:** `GET /api/dispatch/{dispatchId}`

**Response:**
```json
{
  "dispatchId": "DISPATCH-123456",
  "status": "IN_TRANSIT",
  "trackingNumber": "TRK-123456",
  "estimatedDeliveryDate": "2025-12-06T00:00:00.000Z",
  "currentLocation": "Centro de distribución",
  "history": [
    {
      "status": "PENDING",
      "timestamp": "2025-12-03T10:00:00.000Z",
      "location": "Almacén"
    },
    {
      "status": "IN_TRANSIT",
      "timestamp": "2025-12-04T08:00:00.000Z",
      "location": "Centro de distribución"
    }
  ]
}
```

---

## Comportamiento de Fallback

Si la API de despachos no está disponible o falla, el sistema utiliza datos simulados (mock):

- **Disponibilidad**: Siempre disponible
- **Días de entrega**: 3 días desde la fecha actual
- **Dispatch ID**: Generado automáticamente con timestamp
- **Tracking Number**: Generado automáticamente

Esto permite que el sistema funcione incluso sin la API de despachos configurada.

---

## Flujo de Integración

### Al Seleccionar Envío a Domicilio:

1. El usuario selecciona un cliente
2. El sistema llama a `POST /api/dispatch/check-availability` con la dirección del cliente
3. Se muestra la fecha estimada de entrega en la interfaz

### Al Finalizar una Venta con Envío:

1. El usuario finaliza la venta (estado COMPLETED)
2. El sistema llama a `POST /api/dispatch/create` con los datos de la venta
3. El `dispatchId` se guarda en el registro de la venta
4. El despacho queda registrado en ambos sistemas

### Ventas Pendientes:

- Las ventas guardadas como PENDIENTE NO crean despachos
- Solo cuando se finalizan (cambian a COMPLETED) se crea el despacho

---

## Configuración para Producción

1. Actualizar la variable `DISPATCH_API_URL` en el archivo `.env`:
   ```env
   DISPATCH_API_URL="https://api-despachos.tudominio.com"
   ```

2. Asegurarse de que la API de despachos esté accesible desde el servidor backend

3. Verificar que la API de despachos implemente los endpoints especificados

4. Reiniciar el contenedor backend:
   ```bash
   docker compose restart backend
   ```

---

## Pruebas

Para probar la integración sin la API real:

1. El sistema usa datos simulados automáticamente
2. Fecha de entrega: 3 días desde hoy
3. Los despachos se "crean" pero solo en memoria (no persisten)

Para probar con la API real:

1. Configurar `DISPATCH_API_URL` con la URL correcta
2. Crear una venta con envío a domicilio
3. Verificar los logs del backend para ver las llamadas a la API
4. Verificar que el `dispatchId` se guarde en la venta
