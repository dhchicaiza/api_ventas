import React, { useState, useEffect } from 'react';
import { ProductSearch } from '../components/sales/ProductSearch';
import { Cart } from '../components/sales/Cart';
import { createSale } from '../services/api';
import type { Product, CartItem } from '../types';
import { X, User, CreditCard } from 'lucide-react';

interface Person {
    id: string;
    name: string;
    email: string;
    documentNumber: string;
    address: string;
}

export const NewSale: React.FC = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [persons, setPersons] = useState<Person[]>([]);
    const [selectedPersonId, setSelectedPersonId] = useState<string>('');
    const [deliveryMethod, setDeliveryMethod] = useState<'PICKUP' | 'DISPATCH'>('PICKUP');
    const [isProcessing, setIsProcessing] = useState(false);
    const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
    const [isCheckingDelivery, setIsCheckingDelivery] = useState(false);

    useEffect(() => {
        if (showCheckoutModal) {
            fetchPersons();
        }
    }, [showCheckoutModal]);

    useEffect(() => {
        if (deliveryMethod === 'DISPATCH' && selectedPersonId) {
            const selectedPerson = persons.find(p => p.id === selectedPersonId);
            if (selectedPerson) {
                checkDeliveryAvailability(selectedPerson.address);
            }
        } else {
            setDeliveryDate(null);
        }
    }, [deliveryMethod, selectedPersonId, persons]);

    const fetchPersons = async () => {
        try {
            const response = await fetch('/api/persons');
            if (response.ok) {
                const data = await response.json();
                setPersons(data);
            }
        } catch (error) {
            console.error('Error fetching persons:', error);
        }
    };

    const handleAddToCart = (product: Product, quantity: number) => {
        setCartItems((prev) => {
            const existing = prev.find((item) => item.productId === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.unitPrice }
                        : item
                );
            }
            return [
                ...prev,
                {
                    productId: product.id,
                    productName: product.name,
                    productSku: product.sku,
                    unitPrice: product.price,
                    quantity: quantity,
                    subtotal: product.price * quantity,
                    availabilityType: product.availabilityType,
                    availability: { quantity: product.stockQuantity, estimatedDays: product.estimatedDays },
                },
            ];
        });
    };

    const handleUpdateQuantity = (productId: string, quantity: number) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.productId === productId
                    ? { ...item, quantity, subtotal: quantity * item.unitPrice }
                    : item
            )
        );
    };

    const handleRemoveItem = (productId: string) => {
        setCartItems((prev) => prev.filter((item) => item.productId !== productId));
    };

    const handleOpenCheckout = () => {
        setShowCheckoutModal(true);
    };

    const handleCloseCheckout = () => {
        setShowCheckoutModal(false);
        setSelectedPersonId('');
        setDeliveryMethod('PICKUP');
    };

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

    const handleConfirmSale = async (status: 'PENDING' | 'COMPLETED' = 'COMPLETED') => {
        if (!selectedPersonId) {
            alert('Por favor selecciona una persona');
            return;
        }

        setIsProcessing(true);
        try {
            const selectedPerson = persons.find(p => p.id === selectedPersonId);
            if (!selectedPerson) {
                alert('Persona no encontrada');
                return;
            }

            const saleData = {
                items: cartItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
                deliveryMethod,
                status,
                deliveryDate: deliveryDate || undefined,
                customer: {
                    name: selectedPerson.name,
                    email: selectedPerson.email,
                    documentNumber: selectedPerson.documentNumber,
                    address: selectedPerson.address,
                },
            };

            await createSale(saleData);
            const message = status === 'COMPLETED'
                ? '¡Venta finalizada exitosamente!'
                : '¡Venta guardada como pendiente!';
            alert(message);
            setCartItems([]);
            handleCloseCheckout();
        } catch (error) {
            console.error('Error creating sale:', error);
            alert('Error al crear la venta');
        } finally {
            setIsProcessing(false);
        }
    };

    const calculateTotal = () => {
        return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Product Search & Grid */}
            <div className="lg:col-span-2 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Nueva Venta</h1>
                    <p className="text-gray-600">Busca productos y agrégalos al carrito</p>
                </div>

                <ProductSearch onAddToCart={handleAddToCart} />
            </div>

            {/* Right Column: Cart */}
            <div className="lg:col-span-1">
                <div className="sticky top-24">
                    <Cart
                        items={cartItems}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemoveItem={handleRemoveItem}
                        onProceedToCheckout={handleOpenCheckout}
                    />
                </div>
            </div>

            {/* Checkout Modal */}
            {showCheckoutModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
                            <h2 className="text-xl font-bold text-gray-900">Finalizar Venta</h2>
                            <button onClick={handleCloseCheckout} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Person Selection */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                                    <User className="h-5 w-5" />
                                    Seleccionar Cliente
                                </label>
                                <select
                                    value={selectedPersonId}
                                    onChange={(e) => setSelectedPersonId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                                    required
                                >
                                    <option value="">-- Selecciona un cliente --</option>
                                    {persons.map((person) => (
                                        <option key={person.id} value={person.id}>
                                            {person.name} - {person.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Delivery Method */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                                    <CreditCard className="h-5 w-5" />
                                    Método de Entrega
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryMethod('PICKUP')}
                                        className={`p-4 border-2 rounded-lg transition-colors ${deliveryMethod === 'PICKUP'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        <div className="font-medium">Recoger en Tienda</div>
                                        <div className="text-sm text-gray-600">Sin costo adicional</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryMethod('DISPATCH')}
                                        className={`p-4 border-2 rounded-lg transition-colors ${deliveryMethod === 'DISPATCH'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        <div className="font-medium">Envío a Domicilio</div>
                                        <div className="text-sm text-gray-600">Costo según ubicación</div>
                                    </button>
                                </div>

                                {/* Delivery Date Information */}
                                {deliveryMethod === 'DISPATCH' && selectedPersonId && (
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        {isCheckingDelivery ? (
                                            <div className="flex items-center text-blue-700">
                                                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Consultando disponibilidad de entrega...
                                            </div>
                                        ) : deliveryDate ? (
                                            <div className="text-blue-700">
                                                <div className="font-semibold">📦 Fecha estimada de entrega:</div>
                                                <div className="text-lg mt-1">
                                                    {new Date(deliveryDate).toLocaleDateString('es-ES', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-blue-700">
                                                Selecciona un cliente para ver la fecha de entrega
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Order Summary */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-3">Resumen del Pedido</h3>
                                <div className="space-y-2">
                                    {cartItems.map((item) => (
                                        <div key={item.productId} className="flex justify-between text-sm">
                                            <span className="text-gray-600">
                                                {item.productName} x {item.quantity}
                                            </span>
                                            <span className="text-gray-900 font-medium">
                                                ${item.subtotal.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="border-t border-gray-300 pt-2 mt-2">
                                        <div className="flex justify-between font-bold text-lg">
                                            <span className="text-gray-900">Total</span>
                                            <span className="text-gray-900">
                                                ${calculateTotal().toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                type="button"
                                onClick={handleCloseCheckout}
                                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => handleConfirmSale('PENDING')}
                                disabled={isProcessing || !selectedPersonId}
                                className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {isProcessing ? 'Guardando...' : 'Guardar como Pendiente'}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleConfirmSale('COMPLETED')}
                                disabled={isProcessing || !selectedPersonId}
                                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {isProcessing ? 'Finalizando...' : 'Finalizar Venta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
