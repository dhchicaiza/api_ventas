import axios from 'axios';

const DISPATCH_API_URL = process.env.DISPATCH_API_URL || 'http://localhost:3002';

/**
 * Interface for delivery availability response
 * (Esto puede venir de otra API mock, no del microservicio real de despachos)
 */
export interface DeliveryAvailability {
    available: boolean;
    estimatedDeliveryDate: string;
    deliveryDays: number;
}

/**
 * Interface for dispatch creation request (estructura interna de Ventas)
 */
export interface CreateDispatchRequest {
    saleId: string;
    customerName: string;
    customerPhone?: string;
    customerAddress: string;
    customerEmail: string;
    deliveryDate: string;
    items: Array<{
        productId: string;
        quantity: number;
        description?: string;
    }>;
}

/**
 * Interface for dispatch creation response (lo que Sales manejará)
 */
export interface CreateDispatchResponse {
    dispatchId: string;           // Será el orden_id devuelto por Despachos
    status: string;               // "despacho" o el estado que retorne
    trackingNumber?: string;      // Se usa mismo orden_id (no existe tracking real)
    estimatedDeliveryDate: string;
}

/**
 * Simulación de disponibilidad de entrega.
 * Este NO depende del microservicio real de Despachos.
 */
export const checkDeliveryAvailability = async (address: string): Promise<DeliveryAvailability> => {
    try {
        const response = await axios.post(`${DISPATCH_API_URL}/api/dispatch/check-availability`, {
            address,
        });
        return response.data;
    } catch (error) {
        console.error('Error checking delivery availability:', error);

        // Fallback simple. NO afecta al despacho real.
        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + 3);

        return {
            available: true,
            estimatedDeliveryDate: estimatedDate.toISOString(),
            deliveryDays: 3,
        };
    }
};

/**
 * Crea una orden de despacho en el microservicio real.
 * IMPORTANTE:
 * - Solo existe POST /api/ordenes
 * - Debemos usar orden_id como ID real del despacho
 * - NO se deben inventar datos en fallback
 */
export const createDispatch = async (dispatchData: CreateDispatchRequest): Promise<CreateDispatchResponse> => {
    try {
        // Adaptación al formato EXACTO del microservicio de Despachos
        const dispatchPayload = {
            id_venta: dispatchData.saleId,
            cliente_nombre: dispatchData.customerName,
            cliente_telefono: dispatchData.customerPhone || dispatchData.customerEmail,
            direccion_entrega: dispatchData.customerAddress,
            productos: dispatchData.items.map(item => ({
                id_producto: item.productId,
                nombre: item.description || item.productId,
                cantidad: item.quantity
            })),
            fecha_estimada_envio: new Date(dispatchData.deliveryDate).toISOString().split('T')[0],
            estado: "pendiente" // Puede ser ignorado por Despachos si decide cambiarlo
        };

        const response = await axios.post(`${DISPATCH_API_URL}/api/ordenes`, dispatchPayload);

        // Adaptación de la respuesta real
        return {
            dispatchId: response.data.orden_id.toString(),
            status: response.data.estado,
            trackingNumber: response.data.orden_id.toString(),  // NO existe tracking real
            estimatedDeliveryDate: dispatchData.deliveryDate,
        };

    } catch (error) {
        console.error('Error creating dispatch:', error);

        // NO se debe inventar un despacho si el servicio real está caído
        throw new Error("Dispatch service unavailable. The order dispatch could not be created.");
    }
};

/**
 * NO EXISTE endpoint para consultar despacho en el microservicio real.
 * Este método queda deshabilitado para evitar mal uso.
 */
export const getDispatchStatus = async () => {
    throw new Error("Dispatch tracking is not supported. The dispatch system only allows creation.");
};
