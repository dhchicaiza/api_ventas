import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, X, MapPin, Phone, User, FileText, Mail } from 'lucide-react';
import { searchProducts, createSale } from '../services/api';
import { Product } from '../types';

interface CartItem extends Product {
    quantity: number;
}

export const Store: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Checkout Form State
    const [formData, setFormData] = useState({
        name: '',
        documentNumber: '',
        phone: '',
        email: '',
        address: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
    const [isCheckingDelivery, setIsCheckingDelivery] = useState(false);
    const [isDeliveryConfirmed, setIsDeliveryConfirmed] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        if (formData.address.length > 5) {
            const timer = setTimeout(() => {
                checkDeliveryAvailability(formData.address);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setDeliveryDate(null);
        }
    }, [formData.address]);

    const loadProducts = async (query: string = '') => {
        setIsLoading(true);
        try {
            const data = await searchProducts(query);
            setProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadProducts(searchTerm);
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQuantity = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const checkDeliveryAvailability = async (address: string) => {
        setIsCheckingDelivery(true);
        try {
            const response = await fetch('/api/sales/check-delivery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address }),
            });

            if (response.ok) {
                const data = await response.json();
                setDeliveryDate(data.estimatedDeliveryDate);
            }
        } catch (error) {
            console.error('Error checking delivery:', error);
        } finally {
            setIsCheckingDelivery(false);
        }
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const saleData = {
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    unitPrice: item.price
                })),
                deliveryMethod: 'DISPATCH', // Default to dispatch for online store
                status: 'COMPLETED', // Online orders are now completed immediately
                deliveryDate: deliveryDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Use checked date or estimated 3 days
                customer: {
                    name: formData.name,
                    email: formData.email,
                    documentNumber: formData.documentNumber,
                    address: formData.address,
                    phone: formData.phone
                }
            };

            await createSale(saleData);
            setOrderSuccess(true);
            setCart([]);
            setFormData({ name: '', documentNumber: '', phone: '', email: '', address: '' });
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Hubo un error al procesar tu pedido. Por favor intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingCart className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Pedido Recibido!</h2>
                    <p className="text-gray-600 mb-8">
                        Gracias por tu compra. Hemos recibido tu pedido y te contactaremos pronto para coordinar la entrega.
                    </p>
                    <button
                        onClick={() => {
                            setOrderSuccess(false);
                            setIsCartOpen(false);
                            setIsCheckingOut(false);
                        }}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Volver a la Tienda
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <ShoppingCart className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">Tienda Virtual</span>
                        </div>

                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <ShoppingCart className="h-6 w-6" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero & Search */}
            <div className="bg-blue-600 py-12 px-4 sm:px-6 lg:px-8 mb-8">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Encuentra lo que necesitas
                    </h1>
                    <p className="text-blue-100 mb-8 text-lg">
                        Los mejores productos al mejor precio, directo a tu hogar.
                    </p>
                    <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900"
                        />
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    </form>
                </div>
            </div>

            {/* Product Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 flex flex-col">
                                <div className="h-48 bg-gray-100 flex items-center justify-center">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <ShoppingCart className="h-12 w-12 text-gray-300" />
                                    )}
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description}</p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-xl font-bold text-blue-600">
                                            ${product.price.toLocaleString()}
                                        </span>
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Cart Sidebar / Modal */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setIsCartOpen(false)} />

                    <div className="absolute inset-y-0 right-0 max-w-full flex">
                        <div className="w-screen max-w-md bg-white shadow-xl flex flex-col h-full">
                            {/* Cart Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {isCheckingOut ? 'Finalizar Compra' : 'Tu Carrito'}
                                </h2>
                                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Cart Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                        <ShoppingCart className="h-16 w-16 mb-4 text-gray-300" />
                                        <p className="text-lg">Tu carrito está vacío</p>
                                        <button
                                            onClick={() => setIsCartOpen(false)}
                                            className="mt-4 text-blue-600 font-medium hover:underline"
                                        >
                                            Seguir comprando
                                        </button>
                                    </div>
                                ) : isCheckingOut ? (
                                    <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
                                        <div className="bg-blue-50 p-4 rounded-lg mb-6">
                                            <h3 className="font-semibold text-blue-900 mb-2">Resumen</h3>
                                            <div className="flex justify-between text-blue-800">
                                                <span>Total a pagar:</span>
                                                <span className="font-bold">${cartTotal.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        required
                                                        value={formData.name}
                                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
                                                        placeholder="Juan Pérez"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Documento de Identidad</label>
                                                <div className="relative">
                                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        required
                                                        value={formData.documentNumber}
                                                        onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
                                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
                                                        placeholder="12345678"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <input
                                                        type="tel"
                                                        required
                                                        value={formData.phone}
                                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
                                                        placeholder="987654321"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <input
                                                        type="email"
                                                        required
                                                        value={formData.email}
                                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
                                                        placeholder="juan@ejemplo.com"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de Entrega</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                    <textarea
                                                        required
                                                        value={formData.address}
                                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
                                                        placeholder="Av. Principal 123, Ciudad"
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>

                                            {/* Delivery Info */}
                                            {(deliveryDate || isCheckingDelivery) && (
                                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                    {isCheckingDelivery ? (
                                                        <div className="flex items-center text-blue-700 text-sm">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                                                            Calculando fecha de entrega...
                                                        </div>
                                                    ) : (
                                                        <div className="text-blue-800">
                                                            <div className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1">
                                                                Fecha Estimada de Entrega
                                                            </div>
                                                            <div className="font-bold text-lg mb-3">
                                                                {new Date(deliveryDate!).toLocaleDateString('es-ES', {
                                                                    weekday: 'long',
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </div>
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isDeliveryConfirmed}
                                                                    onChange={(e) => setIsDeliveryConfirmed(e.target.checked)}
                                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                                />
                                                                <span className="text-sm font-medium">
                                                                    Estoy de acuerdo con la fecha de entrega
                                                                </span>
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-4">
                                        {cart.map(item => (
                                            <div key={item.id} className="flex gap-4 bg-gray-50 p-3 rounded-lg">
                                                <div className="w-16 h-16 bg-white rounded-md flex items-center justify-center border border-gray-200">
                                                    <ShoppingCart className="h-6 w-6 text-gray-300" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 line-clamp-1">{item.name}</h4>
                                                    <p className="text-blue-600 font-semibold">${item.price.toLocaleString()}</p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                            className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                                        >
                                                            +
                                                        </button>
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="ml-auto text-red-500 text-xs hover:underline"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Cart Footer */}
                            {cart.length > 0 && (
                                <div className="p-6 border-t border-gray-200 bg-gray-50">
                                    {!isCheckingOut ? (
                                        <>
                                            <div className="flex justify-between mb-4 text-lg font-bold text-gray-900">
                                                <span>Total</span>
                                                <span>${cartTotal.toLocaleString()}</span>
                                            </div>
                                            <button
                                                onClick={() => setIsCheckingOut(true)}
                                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                            >
                                                Continuar Compra
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setIsCheckingOut(false)}
                                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                                            >
                                                Volver
                                            </button>
                                            <button
                                                form="checkout-form"
                                                type="submit"
                                                disabled={isSubmitting || !isDeliveryConfirmed}
                                                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSubmitting ? 'Procesando...' : 'Confirmar Pedido'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
