import { Product, Sale } from '../types';

const API_URL = '/api';

export const fetchProducts = async (): Promise<Product[]> => {
    const response = await fetch(`${API_URL}/sales/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const json = await response.json();
    return json.data || [];
};

export const searchProducts = async (query: string): Promise<Product[]> => {
    const response = await fetch(`${API_URL}/sales/products?search=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search products');
    const json = await response.json();
    return json.data || [];
};

export const createSale = async (saleData: any) => {
    const response = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to create sale');
    }

    return response.json();
};

export const fetchSales = async (): Promise<Sale[]> => {
    const response = await fetch(`${API_URL}/sales`);
    if (!response.ok) throw new Error('Failed to fetch sales');
    return response.json();
};
