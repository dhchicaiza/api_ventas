import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import axios from 'axios';

const prisma = new PrismaClient();

// Esquemas de validación
const createSaleSchema = z.object({
    customer: z.object({
        name: z.string(),
        email: z.string().email(),
        documentNumber: z.string(),
        address: z.string(),
    }),
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
    })),
    deliveryMethod: z.enum(['PICKUP', 'DISPATCH']),
    status: z.enum(['PENDING', 'COMPLETED']).optional().default('COMPLETED'),
    deliveryDate: z.string().optional(),
});

/**
 * Crea una nueva venta en el sistema.
 * 
 * Esta función realiza las siguientes operaciones:
 * 1. Valida los datos de entrada usando Zod.
 * 2. Crea o actualiza el cliente en la base de datos.
 * 3. Calcula el total de la venta.
 * 4. Crea el registro de la venta y sus items.
 * 5. Si el método de entrega es 'DISPATCH', gestiona el despacho (mock).
 * 
 * @param req - Objeto Request de Express que contiene los datos de la venta en el body.
 * @param res - Objeto Response de Express para enviar la respuesta.
 * @returns Retorna la venta creada con código 201 o un error 400/500.
 */
export const createSale = async (req: Request, res: Response) => {
    try {
        const data = createSaleSchema.parse(req.body);

        // 1. Validar productos y calcular tiempos de fabricación
        let totalManufacturingDays = 0;
        let hasManufacturingProducts = false;

        for (const item of data.items) {
            try {
                // Obtener información del producto desde inventario
                const inventoryProductId = item.productId.replace('prod-', '').toUpperCase();
                const productResponse = await axios.get(
                    `${process.env.INVENTORY_API_URL}/api/v1/products/${item.productId}`
                );
                const product = productResponse.data;

                // Verificar si es producto en fabricación
                if (product.availabilityType === 'MANUFACTURING') {
                    hasManufacturingProducts = true;

                    // Si la venta es PICKUP, se permite pero este item específico se manejará como DESPACHO
                    // Se requiere que el cliente tenga dirección válida (validada por esquema)

                    // Acumular el mayor tiempo de fabricación
                    if (product.estimatedDays && product.estimatedDays > totalManufacturingDays) {
                        totalManufacturingDays = product.estimatedDays;
                    }
                }
            } catch (error) {
                console.error(`[INVENTARIO] Error al consultar producto ${item.productId}:`, error);
                // Continuar si no se puede verificar - no bloquear la venta
            }
        }

        // Calcular fecha de entrega considerando tiempo de fabricación
        // Calcular fecha de entrega considerando tiempo de fabricación
        // Si hay productos de fabricación, siempre se calcula fecha de entrega para envío
        let calculatedDeliveryDate = data.deliveryDate;
        if (hasManufacturingProducts) {
            const DELIVERY_DAYS = 3; // Días estimados de despacho
            const totalDays = totalManufacturingDays + DELIVERY_DAYS;
            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + totalDays);
            calculatedDeliveryDate = deliveryDate.toISOString();
            console.log(`[FABRICACIÓN] Producto en fabricación detectado. Tiempo total: ${totalManufacturingDays} días fabricación + ${DELIVERY_DAYS} días despacho = ${totalDays} días`);
        }

        // 2. Buscar o Crear Persona
        let person = await prisma.person.findUnique({
            where: { email: data.customer.email },
        });

        if (!person) {
            // Crear nueva persona si no existe
            person = await prisma.person.create({
                data: data.customer,
            });
        }

        // 3. Calcular Total
        const total = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

        // 4. Determinar expiración según el estado
        const expiresAt = data.status === 'PENDING' ? (() => {
            const expiration = new Date();
            expiration.setMinutes(expiration.getMinutes() + 15);
            return expiration;
        })() : null;

        // 5. Crear Venta
        const sale = await prisma.sale.create({
            data: {
                personId: person.id,
                total: total,
                deliveryMethod: data.deliveryMethod,
                status: data.status || 'COMPLETED',
                expiresAt: expiresAt,
                deliveryDate: calculatedDeliveryDate ? new Date(calculatedDeliveryDate) : null,
                items: {
                    create: data.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                    })),
                },
            },
            include: {
                items: true,
                person: true,
            },
        });

        // 6. Manejar Reserva para pedidos PENDING
        if (data.status === 'PENDING') {
            try {
                // Llamar a la API de Inventario para reservar productos por cada item
                for (const item of data.items) {
                    // Transformar ID de producto: 'prod-s1' -> 'S1' (formato API de inventario)
                    const inventoryProductId = item.productId.replace('prod-', '').toUpperCase();

                    await axios.post(`${process.env.INVENTORY_API_URL}/api/productos/reservas`, {
                        id_producto: inventoryProductId,
                        cantidad: item.quantity
                    });
                    console.log(`[INVENTARIO] Producto reservado: ${inventoryProductId} x ${item.quantity}`);
                }
            } catch (error) {
                console.error('[INVENTARIO] Error al reservar productos:', error);
                // Continuar aunque falle la reserva - la venta ya fue creada
            }
        }

        // 7. Manejar descuento de stock para pedidos PICKUP
        // NOTA: Para ventas mixtas, solo procesar items que NO sean de fabricación aquí
        // Aunque no tenemos el tipo de producto guardado en SaleItem, consultamos availabilityType de nuevo o asumimos lógica
        // Para simplificar y evitar múltiples llamadas, procesaremos TODOS los items como Retiro SI es PICKUP
        // EXCEPTO si implementamos lógica de separación.

        // Nueva Lógica Mixta:
        // Si es PICKUP:
        // - Items STOCK -> Retiro
        // - Items MANUFACTURING -> Despacho

        if (data.deliveryMethod === 'PICKUP' && data.status === 'COMPLETED') {
            try {
                for (const item of data.items) {
                    const inventoryProductId = item.productId.replace('prod-', '').toUpperCase();

                    // Necesitamos saber el tipo. Para optimizar, podríamos haberlo guardado, 
                    // pero haremos consulta rápida o asumiremos por prefijo si fuera posible (no lo es).
                    // Hacemos consulta al inventario
                    const productResponse = await axios.get(`${process.env.INVENTORY_API_URL}/api/v1/products/${item.productId}`);
                    const availabilityType = productResponse.data.availabilityType;

                    if (availabilityType === 'MANUFACTURING') {
                        // Es fabricación -> Crear DESPACHO (aunque la venta sea PICKUP)
                        await axios.post(`${process.env.INVENTORY_API_URL}/api/productos/despachos`, {
                            id_producto: inventoryProductId,
                            cantidad: item.quantity
                        });
                        console.log(`[INVENTARIO] Item de Fabricación en venta PICKUP -> Marcado para despacho: ${inventoryProductId}`);
                    } else {
                        // Es stock -> Crear RETIRO
                        await axios.post(`${process.env.INVENTORY_API_URL}/api/productos/retiros`, {
                            id_producto: inventoryProductId,
                            cantidad: item.quantity,
                            metodo_entrega: 'tienda'
                        });
                        console.log(`[INVENTARIO] Item de Stock en venta PICKUP -> Stock descontado: ${inventoryProductId}`);
                    }
                }
            } catch (error) {
                console.error('[INVENTARIO] Error al procesar items mixtos en PICKUP:', error);
            }
        }

        // 8. Manejar pedidos DISPATCH (Envío a domicilio) - notificar inventario y crear despacho
        if (data.deliveryMethod === 'DISPATCH' && data.status === 'COMPLETED') {
            // 8a. Notificar a la API de Inventario para marcar productos para despacho
            try {
                for (const item of data.items) {
                    // Transformar ID de producto: 'prod-s1' -> 'S1' (formato API de inventario)
                    const inventoryProductId = item.productId.replace('prod-', '').toUpperCase();

                    await axios.post(`${process.env.INVENTORY_API_URL}/api/productos/despachos`, {
                        id_producto: inventoryProductId,
                        cantidad: item.quantity
                    });
                    console.log(`[INVENTARIO] Marcado para despacho: ${inventoryProductId} x ${item.quantity}`);
                }
            } catch (error) {
                console.error('[INVENTARIO] Error al marcar productos para despacho:', error);
                // Continuar aunque falle la actualización de inventario
            }

            // 8b. Crear solicitud de Despacho en el microservicio REAL
            try {
                const { createDispatch } = await import('../services/dispatchService');

                const dispatchData = {
                    saleId: sale.id,
                    customerName: person.name,
                    customerPhone: person.phone || undefined,
                    customerAddress: person.address,
                    customerEmail: person.email,
                    deliveryDate: calculatedDeliveryDate || new Date().toISOString(),
                    items: data.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                    })),
                };

                const dispatchResponse = await createDispatch(dispatchData);

                // Guardar el orden_id generado por Despachos como dispatchId en la venta
                await prisma.sale.update({
                    where: { id: sale.id },
                    data: { dispatchId: dispatchResponse.dispatchId },
                });

                console.log('[DESPACHO] Despacho creado con ID:', dispatchResponse.dispatchId);
            } catch (error) {
                console.error('[DESPACHO] Error al crear despacho. La venta fue creada pero sin despacho asociado.');
            }

        }

        // Incluir información de fabricación en la respuesta si aplica
        const saleResponse = {
            ...sale,
            manufacturingInfo: hasManufacturingProducts ? {
                hasManufacturingProducts: true,
                manufacturingDays: totalManufacturingDays,
                calculatedDeliveryDate: calculatedDeliveryDate
            } : undefined
        };

        res.status(201).json(saleResponse);
    } catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

/**
 * Obtiene el listado de todas las ventas.
 * 
 * Recupera todas las ventas almacenadas en la base de datos, incluyendo
 * la información del cliente y los items asociados, ordenadas por fecha de creación descendente.
 * 
 * @param req - Objeto Request de Express.
 * @param res - Objeto Response de Express.
 * @returns Retorna un array de ventas en formato JSON.
 */
export const getSales = async (req: Request, res: Response) => {
    try {
        const sales = await prisma.sale.findMany({
            include: {
                person: true,
                items: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json(sales);
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Obtiene los detalles de una venta específica por su ID.
 * 
 * @param req - Objeto Request de Express que contiene el ID de la venta en los parámetros.
 * @param res - Objeto Response de Express.
 * @returns Retorna el objeto de la venta si se encuentra, o un error 404 si no existe.
 */
export const getSale = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const sale = await prisma.sale.findUnique({
            where: { id },
            include: {
                person: true,
                items: true,
            },
        });
        if (!sale) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        // Enriquecer items con datos del inventario (para saber si es fabricación/stock)
        const itemsWithDetails = await Promise.all(sale.items.map(async (item) => {
            try {
                const productResponse = await axios.get(
                    `${process.env.INVENTORY_API_URL}/api/v1/products/${item.productId}`
                );
                return {
                    ...item,
                    product: productResponse.data // Incluimos detalles completos (availabilityType, estimatedDays)
                };
            } catch (error) {
                console.error(`Error fetching details for item ${item.productId}`, error);
                return item;
            }
        }));

        res.json({ ...sale, items: itemsWithDetails });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Busca productos en el inventario externo.
 * 
 * Actúa como un proxy hacia la API de Inventario. Permite buscar productos
 * por nombre o SKU, o listar todos los productos si no se proporciona un término de búsqueda.
 * 
 * @param req - Objeto Request de Express que puede contener el parámetro 'search' en el query string.
 * @param res - Objeto Response de Express.
 * @returns Retorna la lista de productos obtenida de la API de Inventario.
 */
export const getProducts = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;

        let url = `${process.env.INVENTORY_API_URL}/api/v1/products`;
        let params = {};

        if (search) {
            url = `${process.env.INVENTORY_API_URL}/api/v1/products/search`;
            params = { query: search };
        }

        // Proxy hacia la API de Inventario
        const response = await axios.get(url, { params });

        // Aplicar margen de utilidad del 16% a los precios
        const PROFIT_MARGIN = 0.16;
        const productsWithMargin = response.data.data?.map((product: any) => ({
            ...product,
            costPrice: product.price, // Mantener precio original como costo
            price: Math.round(product.price * (1 + PROFIT_MARGIN)), // Aplicar margen del 16%
        })) || [];

        res.json({ ...response.data, data: productsWithMargin });
    } catch (error) {
        console.error('Error fetching products from Inventory API:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

/**
 * Completar una venta pendiente
 */
export const completeSale = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const sale = await prisma.sale.findUnique({
            where: { id },
        });

        if (!sale) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        if (sale.status !== 'PENDING') {
            return res.status(400).json({ error: 'Sale is not pending' });
        }

        // Verificar si la venta ha expirado
        if (sale.expiresAt && new Date() > sale.expiresAt) {
            return res.status(400).json({ error: 'Sale has expired' });
        }

        const updatedSale = await prisma.sale.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                expiresAt: null, // Eliminar expiración una vez completada
            },
            include: {
                items: true,
                person: true,
            },
        });

        res.json(updatedSale);
    } catch (error) {
        console.error('Error completing sale:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Limpiar ventas pendientes expiradas
 * Esto debe llamarse periódicamente (ej: mediante cron job)
 */
export const cleanupExpiredSales = async (req: Request, res: Response) => {
    try {
        const now = new Date();

        // Buscar todas las ventas pendientes expiradas
        const expiredSales = await prisma.sale.findMany({
            where: {
                status: 'PENDING',
                expiresAt: {
                    lte: now,
                },
            },
        });

        // Eliminar ventas expiradas y sus items
        const deletedCount = await prisma.sale.deleteMany({
            where: {
                status: 'PENDING',
                expiresAt: {
                    lte: now,
                },
            },
        });

        console.log(`Cleaned up ${deletedCount.count} expired sales`);
        res.json({
            message: `Cleaned up ${deletedCount.count} expired sales`,
            deletedSales: expiredSales.map(s => s.id),
        });
    } catch (error) {
        console.error('Error cleaning up expired sales:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Verificar disponibilidad de entrega para una dirección dada
 */
export const checkDeliveryAvailabilityController = async (req: Request, res: Response) => {
    try {
        const { address } = req.body;

        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }

        const { checkDeliveryAvailability } = await import('../services/dispatchService');
        const availability = await checkDeliveryAvailability(address);

        res.json(availability);
    } catch (error) {
        console.error('Error checking delivery availability:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
