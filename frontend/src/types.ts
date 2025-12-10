export interface Product {
    id: string;
    name: string;
    description?: string;
    sku: string;
    price: number;
    stockQuantity: number;
    availabilityType: 'STOCK' | 'MANUFACTURING' | 'MADE_TO_ORDER';
    estimatedDays?: number;
    imageUrl?: string;
}

export interface AvailabilityType {
    quantity?: number;
    estimatedDays?: number;
}

export interface CartItem {
    productId: string;
    productName: string;
    productSku: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    availabilityType: 'STOCK' | 'MANUFACTURING' | 'MADE_TO_ORDER';
    availability?: AvailabilityType;
    reservation?: {
        expiresAt: string;
    };
}

export interface SaleItem {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    product?: Product; // Propiedad enriquecida opcional
}

export interface Sale {
    id: string;
    total: number;
    status: string;
    deliveryMethod: string;
    createdAt: string;
    expiresAt?: string | null;
    deliveryDate?: string | null;
    person?: {
        name: string;
        email: string;
        address: string;
        phone?: string;
    };
    items?: SaleItem[];
}
