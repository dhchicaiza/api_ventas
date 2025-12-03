# 🛒 Plataforma de Ventas - Cutit Saws Ltd

Sistema de gestión de ventas completo con gestión de inventario, reservas de productos y seguimiento de clientes.

## 📋 Descripción

Plataforma de ventas de tres niveles que consta de:
- **Backend (API de Ventas)**: API REST con Express.js, TypeScript, Prisma y PostgreSQL
- **Frontend (Dashboard)**: Aplicación React con TypeScript, Vite y TailwindCSS
- **API de Inventario**: Servicio mock para gestión de productos y reservas

## 🚀 Inicio Rápido

### Prerrequisitos

- Docker y Docker Compose instalados
- Node.js 18+ (para desarrollo local)
- Git

### Instalación con Docker Compose (Recomendado)

1. **Clonar el repositorio**
```bash
git clone <URL_DEL_REPOSITORIO>
cd api_ventas
```

2. **Iniciar todos los servicios**
```bash
docker compose up -d --build
```

3. **Acceder a la aplicación**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API de Inventario: http://localhost:3001
- Base de datos PostgreSQL: localhost:5433

4. **Verificar el estado**
```bash
docker compose ps
docker compose logs -f
```

### Instalación Local (Desarrollo)

#### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### API de Inventario
```bash
cd inventory-api
npm install
npm run dev
```

## 🏗️ Arquitectura

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│  Frontend   │────────▶│   Backend   │────────▶│  PostgreSQL  │
│  (React)    │         │  (Express)  │         │              │
│  :5173      │         │  :3000      │         │  :5433       │
└─────────────┘         └─────────────┘         └──────────────┘
                               │
                               │
                               ▼
                        ┌─────────────┐
                        │ Inventory   │
                        │   API       │
                        │  :3001      │
                        └─────────────┘
```

### Flujo de Comunicación

1. **Frontend → Backend**: Solicitudes HTTP para gestión de ventas
2. **Backend → Inventario**: Consultas de productos y gestión de reservas
3. **Backend → PostgreSQL**: Persistencia de ventas, clientes y artículos

## 📦 Estructura del Proyecto

```
api_ventas/
├── backend/              # API de ventas (Express + TypeScript + Prisma)
│   ├── src/
│   │   ├── controllers/  # Lógica de negocio
│   │   ├── routes/       # Definición de rutas
│   │   └── index.ts      # Punto de entrada
│   ├── prisma/
│   │   └── schema.prisma # Esquema de base de datos
│   ├── Dockerfile
│   └── package.json
│
├── frontend/             # Dashboard de ventas (React + TypeScript)
│   ├── src/
│   │   ├── components/   # Componentes reutilizables
│   │   ├── pages/        # Páginas principales
│   │   ├── services/     # Clientes API
│   │   └── App.tsx
│   ├── Dockerfile
│   └── package.json
│
├── inventory-api/        # API mock de inventario
│   ├── src/
│   │   ├── data.js       # Productos y reservas mock
│   │   └── index.js      # Servidor Express
│   ├── Dockerfile
│   └── package.json
│
├── k8s/                  # Manifiestos de Kubernetes
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   └── postgres-deployment.yaml
│
├── docker-compose.yml    # Orquestación de servicios
└── deployment_guide.md   # Guía completa de despliegue
```

## 🗄️ Modelo de Datos

### Customer (Cliente)
```typescript
{
  id: string          // UUID
  name: string
  email: string
  address: string
  sales: Sale[]
  createdAt: DateTime
}
```

### Sale (Venta)
```typescript
{
  id: string              // UUID
  customerId: string
  total: Decimal
  status: "PENDING" | "COMPLETED" | "SHIPPED" | "CANCELLED"
  deliveryMethod: "PICKUP" | "DISPATCH"
  dispatchId?: string
  items: SaleItem[]
  createdAt: DateTime
}
```

### SaleItem (Artículo de Venta)
```typescript
{
  id: string          // UUID
  saleId: string
  productId: string   // Referencia a producto en Inventory API
  quantity: number
  unitPrice: Decimal
}
```

## 🔌 API Endpoints

### Backend - Sales API

**Base URL**: `http://localhost:3000/api/sales`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear nueva venta |
| GET | `/` | Listar todas las ventas |
| GET | `/:id` | Obtener venta por ID |
| GET | `/products` | Buscar productos (proxy a Inventory API) |

### Inventory API

**Base URL**: `http://localhost:3001/api/v1`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/products/search?query={term}` | Buscar productos |
| GET | `/products/:id` | Obtener producto por ID |
| GET | `/products/:id/availability` | Consultar disponibilidad |
| POST | `/reservations` | Crear reserva temporal (15 min) |
| POST | `/reservations/:id/confirm` | Confirmar reserva (descuenta stock) |
| DELETE | `/reservations/:id` | Liberar reserva |
| GET | `/health` | Estado del servicio |

### Ejemplos de Uso

**Crear una venta:**
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "uuid-del-cliente",
    "items": [
      {
        "productId": "prod-001",
        "quantity": 2,
        "unitPrice": 899.99
      }
    ],
    "deliveryMethod": "PICKUP"
  }'
```

**Buscar productos:**
```bash
curl "http://localhost:3001/api/v1/products/search?query=laptop&limit=10"
```

**Crear reserva:**
```bash
curl -X POST http://localhost:3001/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod-001",
    "quantity": 2,
    "salesChannel": "IN_STORE"
  }'
```

## 🛠️ Comandos de Desarrollo

### Docker Compose

```bash
# Iniciar servicios
docker compose up -d

# Reconstruir e iniciar
docker compose up -d --build

# Ver logs
docker compose logs -f [servicio]

# Detener servicios
docker compose down

# Detener y eliminar volúmenes
docker compose down -v
```

### Backend

```bash
cd backend

# Desarrollo con hot-reload
npm run dev

# Compilar TypeScript
npm run build

# Producción
npm start

# Gestión de base de datos
npx prisma migrate dev          # Crear y aplicar migración
npx prisma generate             # Generar Prisma Client
npx prisma studio               # Abrir GUI de base de datos
npx prisma db push              # Aplicar cambios sin migración
```

### Frontend

```bash
cd frontend

# Servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Linter
npm run lint

# Vista previa de compilación
npm preview
```

### Inventory API

```bash
cd inventory-api

# Desarrollo
npm run dev

# Producción
npm start
```

## 🔄 Flujo de Trabajo de Reservas

El sistema implementa un flujo de reservas temporales para garantizar la disponibilidad de productos:

1. **Búsqueda**: El usuario busca productos en el frontend
2. **Reserva Temporal**: Al agregar al carrito, se crea una reserva de 15 minutos
3. **Confirmación**: Al completar la venta, se confirma la reserva y se descuenta el stock
4. **Liberación**: Si se cancela o expira, se libera automáticamente

**Código de ejemplo:**
```typescript
// 1. Crear reserva
const reservation = await fetch('http://localhost:3001/api/v1/reservations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 'prod-001',
    quantity: 2,
    salesChannel: 'IN_STORE'
  })
});

// 2. Confirmar reserva al completar venta
await fetch(`http://localhost:3001/api/v1/reservations/${reservationId}/confirm`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    saleId: 'sale-uuid',
    confirmedBy: 'user-uuid'
  })
});
```

## 🌐 Despliegue

### Kubernetes (Producción)

Ver la guía completa en [deployment_guide.md](deployment_guide.md)

```bash
# Construir imágenes
eval $(minikube docker-env)
docker build -t sales-backend:latest ./backend
docker build -t sales-frontend:latest ./frontend

# Desplegar
kubectl create namespace sales-platform
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

## 🔧 Configuración

### Variables de Entorno - Backend

Crear archivo `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sales_db?schema=public"
PORT=3000
INVENTORY_API_URL="http://localhost:3001"
DISPATCH_API_URL="http://localhost:3002"
```

### Variables de Entorno - Inventory API

```env
PORT=3001
```

## 🧪 Datos de Prueba

La API de Inventario incluye 8 productos mock:

| Producto | SKU | Precio | Stock |
|----------|-----|--------|-------|
| Laptop HP ProBook 450 | HP-PB450-001 | $899.990 | 15 |
| Dell XPS 13 | DELL-XPS13-002 | $1.299.990 | Bajo pedido |
| Mouse Logitech MX Master 3 | LG-MX3-001 | $89.990 | 45 |
| MacBook Air M2 | APPLE-MBA-M2 | $1.499.990 | Bajo pedido |
| Teclado Logitech MX Keys | KB-MX-KEYS | $129.990 | 28 |
| Monitor Dell 27" 4K | MON-DELL-27 | $449.990 | 8 |
| Impresora HP LaserJet Pro | HP-LASER-PRO | $249.990 | Fabricación |
| Webcam Logitech C920 | WEB-LOGI-C920 | $79.990 | 32 |

## ⚠️ Notas Importantes

- **Datos en memoria**: La API de Inventario almacena datos en memoria (se pierden al reiniciar)
- **Sin autenticación**: No implementa autenticación (agregar antes de producción)
- **CORS abierto**: Backend acepta solicitudes de cualquier origen (restringir en producción)
- **Reservas automáticas**: Las reservas expiran a los 15 minutos automáticamente
- **Puerto de base de datos**: En Docker usa `postgres:5432`, localmente `localhost:5433`

## 🐛 Solución de Problemas

### Puerto en uso
```bash
# Cambiar puertos en docker-compose.yml
# Ejemplo: "3005:3000" en lugar de "3000:3000"
```

### Error de conexión a base de datos
```bash
# Verificar que PostgreSQL esté corriendo
docker compose ps

# Recrear base de datos
docker compose down -v
docker compose up -d
```

### Errores de Prisma
```bash
cd backend
npx prisma generate
npx prisma migrate reset
```

### Frontend no conecta con backend
```bash
# Verificar URL en frontend/src/services/api.ts
# Debe apuntar a http://localhost:3000
```

## 📚 Documentación Adicional

- [CLAUDE.md](CLAUDE.md) - Guía para desarrollo con Claude Code
- [deployment_guide.md](deployment_guide.md) - Guía completa de despliegue
- [inventory-api/README.md](inventory-api/README.md) - Documentación de la API de Inventario

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

ISC

## 👥 Autor

Cutit Saws Ltd - Sistema de Ventas

---

**🚀 ¡Listo para comenzar!** Ejecuta `docker compose up -d --build` y accede a http://localhost:5173
