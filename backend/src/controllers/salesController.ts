import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import axios from 'axios';

const prisma = new PrismaClient();

// Schemas
const createSaleSchema = z.object({
    customer: z.object({
        name: z.string(),
        email: z.string().email(),
        address: z.string(),
    }),
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
    })),
    deliveryMethod: z.enum(['PICKUP', 'DISPATCH']),
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

        // 1. Validate Stock (Mocked)
        // In a real scenario, we would call Inventory API here
        // await axios.post(`${process.env.INVENTORY_API_URL}/stock/reserve`, { items: data.items });

        // 2. Create Person (or find existing - simplified here to always create/update)
        const person = await prisma.person.create({
            data: data.customer, // Frontend still sends 'customer' key
        });

        // 3. Calculate Total
        const total = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

        // 4. Create Sale
        const sale = await prisma.sale.create({
            data: {
                personId: person.id,
                total: total,
                deliveryMethod: data.deliveryMethod,
                status: 'PENDING',
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

        // 5. Handle Dispatch
        if (data.deliveryMethod === 'DISPATCH') {
            // Call Dispatch API (Mocked)
            // const dispatchRes = await axios.post(`${process.env.DISPATCH_API_URL}/dispatches`, { saleId: sale.id, address: customer.address });
            // await prisma.sale.update({ where: { id: sale.id }, data: { dispatchId: dispatchRes.data.id } });
            console.log('Dispatch created for sale:', sale.id);
        }

        res.status(201).json(sale);
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
        res.json(sale);
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

        // Proxy to Inventory API
        const response = await axios.get(url, { params });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching products from Inventory API:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};
