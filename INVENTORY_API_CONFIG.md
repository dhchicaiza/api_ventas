# Configuración de la API de Inventarios

## Variables de Entorno

Para configurar la URL de la API de inventarios, edita el archivo `.env` en el directorio `backend`:

```env
INVENTORY_API_URL="http://localhost:3001"  # Cambiar por la URL real de la API de inventarios
```

## Endpoints de la API de Inventarios

La aplicación espera que la API de inventarios implemente los siguientes endpoints:

### 1. Búsqueda de Productos

**Endpoint:** `GET /api/v1/products/search`

**Query Parameters:**
- `query` (required): Término de búsqueda (mínimo 2 caracteres)
- `limit` (optional): Número máximo de resultados (default: 50, max: 100)
- `offset` (optional): Offset para paginación (default: 0)

**Ejemplo:**
```
GET /api/v1/products/search?query=laptop&limit=10&offset=0
```

**Response:**
```json
{
  "data": [
    {
      "id": "prod-001",
      "sku": "LAP-001",
      "name": "Laptop Dell XPS 13",
      "description": "Laptop ultraligera de alto rendimiento",
      "price": 1299.99,
      "stockQuantity": 15,
      "availabilityType": "STOCK",
      "estimatedDays": null,
      "active": true,
      "category": "Electronics",
      "brand": "Dell",
      "imageUrl": "https://example.com/laptop.jpg",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-12-03T00:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

**Campos de Producto:**
- `id` (string): ID único del producto
- `sku` (string): Código SKU del producto
- `name` (string): Nombre del producto
- `description` (string): Descripción detallada
- `price` (number): Precio unitario
- `stockQuantity` (number): Cantidad en stock
- `availabilityType` (string): Tipo de disponibilidad
  - `STOCK`: Producto en stock físico
  - `ON_DEMAND`: Producto bajo pedido
  - `PRE_ORDER`: Pre-orden
- `estimatedDays` (number, nullable): Días estimados de entrega (para ON_DEMAND y PRE_ORDER)
- `active` (boolean): Si el producto está activo
- `category` (string): Categoría del producto
- `brand` (string): Marca del producto
- `imageUrl` (string, nullable): URL de la imagen
- `createdAt` (string ISO 8601): Fecha de creación
- `updatedAt` (string ISO 8601): Última actualización

---

### 2. Obtener Producto por ID

**Endpoint:** `GET /api/v1/products/:productId`

**Response:**
```json
{
  "id": "prod-001",
  "sku": "LAP-001",
  "name": "Laptop Dell XPS 13",
  "description": "Laptop ultraligera de alto rendimiento",
  "price": 1299.99,
  "stockQuantity": 15,
  "availabilityType": "STOCK",
  "estimatedDays": null,
  "active": true,
  "category": "Electronics",
  "brand": "Dell",
  "imageUrl": "https://example.com/laptop.jpg",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-12-03T00:00:00.000Z"
}
```

**Error Response (404):**
```json
{
  "error": "Producto no encontrado",
  "productId": "prod-999"
}
```

---

### 3. Consultar Disponibilidad

**Endpoint:** `GET /api/v1/products/:productId/availability`

**Response:**
```json
{
  "productId": "prod-001",
  "availabilityType": "STOCK",
  "quantity": 15,
  "estimatedDays": null,
  "available": true,
  "lastUpdated": "2025-12-03T10:00:00.000Z"
}
```

**Campos de Respuesta:**
- `productId` (string): ID del producto
- `availabilityType` (string): Tipo de disponibilidad
- `quantity` (number): Cantidad disponible (considerando reservas activas)
- `estimatedDays` (number, nullable): Días estimados para productos bajo pedido
- `available` (boolean): Si hay disponibilidad
- `lastUpdated` (string ISO 8601): Última actualización

---

### 4. Crear Reserva

**Endpoint:** `POST /api/v1/reservations`

**Request Body:**
```json
{
  "productId": "prod-001",
  "quantity": 2,
  "salesChannel": "ONLINE",
  "metadata": {
    "saleId": "sale-123",
    "customerId": "customer-456"
  }
}
```

**Campos de Request:**
- `productId` (string, required): ID del producto a reservar
- `quantity` (number, required): Cantidad a reservar (> 0)
- `salesChannel` (string, required): Canal de venta
  - `IN_STORE`: Venta en tienda
  - `ONLINE`: Venta en línea
  - `PHONE`: Venta telefónica
- `metadata` (object, optional): Datos adicionales

**Response (201):**
```json
{
  "id": "uuid-reserva",
  "productId": "prod-001",
  "quantity": 2,
  "status": "ACTIVE",
  "expiresAt": "2025-12-03T10:15:00.000Z",
  "createdAt": "2025-12-03T10:00:00.000Z"
}
```

**Estados de Reserva:**
- `ACTIVE`: Reserva activa (válida por 15 minutos)
- `CONFIRMED`: Reserva confirmada (venta completada)
- `EXPIRED`: Reserva expirada
- `RELEASED`: Reserva liberada manualmente

**Error Responses:**

Stock insuficiente (409):
```json
{
  "error": "Stock insuficiente",
  "message": "Solo hay 1 unidades disponibles",
  "requested": 2,
  "available": 1
}
```

Producto no reservable (422):
```json
{
  "error": "Producto no reservable",
  "message": "Solo se pueden reservar productos con availabilityType = STOCK",
  "availabilityType": "ON_DEMAND"
}
```

---

### 5. Confirmar Reserva

**Endpoint:** `POST /api/v1/reservations/:reservationId/confirm`

**Request Body:**
```json
{
  "saleId": "sale-123",
  "confirmedBy": "user-456"
}
```

**Response:**
```json
{
  "id": "uuid-reserva",
  "productId": "prod-001",
  "quantity": 2,
  "status": "CONFIRMED",
  "saleId": "sale-123",
  "confirmedAt": "2025-12-03T10:05:00.000Z",
  "confirmedBy": "user-456"
}
```

**Nota:** Al confirmar una reserva, el stock del producto se reduce automáticamente.

---

### 6. Liberar Reserva

**Endpoint:** `DELETE /api/v1/reservations/:reservationId`

**Response:**
```json
{
  "id": "uuid-reserva",
  "status": "RELEASED",
  "releasedAt": "2025-12-03T10:10:00.000Z",
  "message": "Reservation released successfully, stock returned"
}
```

**Nota:** No se pueden liberar reservas ya confirmadas.

---

## Comportamiento de Reservas

### Ciclo de Vida de una Reserva

1. **Creación**: Se crea con estado `ACTIVE` y expira en 15 minutos
2. **Expiración Automática**: Después de 15 minutos sin confirmar → `EXPIRED`
3. **Confirmación**: Al completar la venta → `CONFIRMED` (reduce stock)
4. **Liberación**: Si se cancela antes de confirmar → `RELEASED`

### Limpieza Automática

El sistema limpia reservas expiradas cada 1 minuto automáticamente.

---

## Integración con Sales API

La API de ventas utiliza el inventario en el siguiente flujo:

1. **Búsqueda de Productos**: Usuario busca productos
2. **Agregar al Carrito**: Se muestra disponibilidad en tiempo real
3. **Crear Venta**: 
   - Opcionalmente se pueden crear reservas
   - Al finalizar, se confirman las reservas
   - El stock se reduce automáticamente

---

## Configuración para Producción

1. Actualizar la variable `INVENTORY_API_URL` en el archivo `.env`:
   ```env
   INVENTORY_API_URL="https://api-inventario.tudominio.com"
   ```

2. Asegurarse de que la API de inventarios esté accesible desde el servidor backend

3. Verificar que la API de inventarios implemente los endpoints especificados

4. Reiniciar el contenedor backend:
   ```bash
   docker compose restart backend
   ```

---

## Pruebas con API Mock

El proyecto incluye una API mock de inventarios en `inventory-api/`:

```bash
cd inventory-api
npm install
npm start
```

La API mock estará disponible en `http://localhost:3001`

**Características de la API Mock:**
- ✅ 50+ productos de ejemplo
- ✅ Búsqueda funcional
- ✅ Sistema de reservas completo
- ✅ Expiración automática de reservas
- ✅ Gestión de stock en tiempo real

---

## Endpoints de Debug (API Mock)

### Listar Todos los Productos

```
GET /api/v1/products
```

### Listar Todas las Reservas

```
GET /api/v1/reservations
```

### Health Check

```
GET /health
```

---

## Códigos de Error

- `400` - Bad Request: Datos inválidos
- `404` - Not Found: Recurso no encontrado
- `409` - Conflict: Stock insuficiente o estado inválido
- `422` - Unprocessable Entity: Operación no permitida
- `500` - Internal Server Error: Error del servidor

---

## Ejemplos de Uso con cURL

### Buscar Productos

```bash
curl "http://localhost:3001/api/v1/products/search?query=laptop&limit=5"
```

### Obtener Producto

```bash
curl "http://localhost:3001/api/v1/products/prod-001"
```

### Consultar Disponibilidad

```bash
curl "http://localhost:3001/api/v1/products/prod-001/availability"
```

### Crear Reserva

```bash
curl -X POST http://localhost:3001/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod-001",
    "quantity": 2,
    "salesChannel": "ONLINE"
  }'
```

### Confirmar Reserva

```bash
curl -X POST http://localhost:3001/api/v1/reservations/RESERVATION_ID/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "saleId": "sale-123",
    "confirmedBy": "user-456"
  }'
```

### Liberar Reserva

```bash
curl -X DELETE http://localhost:3001/api/v1/reservations/RESERVATION_ID
```

---

## Soporte

Para más detalles sobre la implementación de la API mock, consulta:
- `inventory-api/README.md` - Documentación completa
- `inventory-api/src/index.js` - Código fuente
- `inventory-api/src/data.js` - Datos de ejemplo
