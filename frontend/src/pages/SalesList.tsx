import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { fetchSales } from '../services/api';
import { Eye, X, User, Package, Truck, Store, Clock, ArrowLeft, Search } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import type { Sale } from '../types';

export const SalesList: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [isCompletingSale, setIsCompletingSale] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetchSales()
            .then(data => {
                setSales(data);
                setFilteredSales(data);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let result = sales;

        // Filter by status
        if (statusFilter !== 'all') {
            result = result.filter(s => s.status === statusFilter);
        }

        // Filter by search term (ID or customer name)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.id.toLowerCase().includes(term) ||
                s.person?.name.toLowerCase().includes(term) ||
                s.person?.email.toLowerCase().includes(term)
            );
        }

        setFilteredSales(result);
    }, [sales, searchTerm, statusFilter]);

    const handleViewDetail = async (saleId: string) => {
        try {
            const response = await fetch(`/api/sales/${saleId}`);
            if (response.ok) {
                const saleDetail = await response.json();
                setSelectedSale(saleDetail);
                setShowDetailModal(true);
            }
        } catch (error) {
            console.error('Error fetching sale detail:', error);
            alert('Error al cargar el detalle de la venta');
        }
    };

    const handleCloseModal = () => {
        setShowDetailModal(false);
        setSelectedSale(null);
    };

    const handleCompleteSale = async () => {
        if (!selectedSale) return;

        setIsCompletingSale(true);
        try {
            const response = await fetch(`/api/sales/${selectedSale.id}/complete`, {
                method: 'PATCH',
            });

            if (response.ok) {
                alert('¡Venta finalizada exitosamente!');
                handleCloseModal();
                fetchSales().then(setSales);
            } else {
                const error = await response.json();
                alert(`Error al finalizar la venta: ${error.error || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error('Error completing sale:', error);
            alert('Error al finalizar la venta');
        } finally {
            setIsCompletingSale(false);
        }
    };

    const getRemainingTime = (expiresAt: string | null) => {
        if (!expiresAt) return null;
        const now = new Date();
        const expiration = new Date(expiresAt);
        const diffMs = expiration.getTime() - now.getTime();
        if (diffMs <= 0) return 'Expirada';
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffSeconds = Math.floor((diffMs % 60000) / 1000);
        if (diffMinutes > 0) {
            return `${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
        } else {
            return `${diffSeconds} segundo${diffSeconds !== 1 ? 's' : ''}`;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link to="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm mb-2">
                        <ArrowLeft className="h-4 w-4" /> Volver al Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Historial de Ventas</h1>
                    <p className="text-gray-600 mt-1">Listado completo de todas las ventas registradas</p>
                </div>
                <Link to="/nueva-venta">
                    <Button>Nueva Venta</Button>
                </Link>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por ID, cliente o email..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Todos los estados</option>
                            <option value="COMPLETED">Completadas</option>
                            <option value="PENDING">Pendientes</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Sales Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {filteredSales.length} venta{filteredSales.length !== 1 ? 's' : ''} encontrada{filteredSales.length !== 1 ? 's' : ''}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-8 text-center text-gray-500">Cargando ventas...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-gray-200">
                                        <th className="pb-3 font-medium text-gray-600">ID</th>
                                        <th className="pb-3 font-medium text-gray-600">Fecha</th>
                                        <th className="pb-3 font-medium text-gray-600">Cliente</th>
                                        <th className="pb-3 font-medium text-gray-600">Método</th>
                                        <th className="pb-3 font-medium text-gray-600">Total</th>
                                        <th className="pb-3 font-medium text-gray-600">Estado</th>
                                        <th className="pb-3 font-medium text-gray-600">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredSales.map((sale) => (
                                        <tr key={sale.id} className="group hover:bg-gray-50 transition-colors">
                                            <td className="py-4 font-medium text-gray-900">#{sale.id.slice(0, 8)}</td>
                                            <td className="py-4 text-gray-600">
                                                {new Date(sale.createdAt).toLocaleDateString()}
                                                <span className="block text-xs text-gray-400">
                                                    {new Date(sale.createdAt).toLocaleTimeString()}
                                                </span>
                                            </td>
                                            <td className="py-4 text-gray-600">
                                                <div>{sale.person?.name || 'Cliente General'}</div>
                                                <span className="text-xs text-gray-400">{sale.person?.email}</span>
                                            </td>
                                            <td className="py-4">
                                                <Badge variant={sale.deliveryMethod === 'PICKUP' ? 'default' : 'default'}>
                                                    {sale.deliveryMethod === 'PICKUP' ? '🏬 Retiro' : '🚚 Envío'}
                                                </Badge>
                                            </td>
                                            <td className="py-4 font-medium text-gray-900">{formatCurrency(sale.total)}</td>
                                            <td className="py-4">
                                                <Badge variant={sale.status === 'COMPLETED' ? 'success' : 'warning'}>
                                                    {sale.status === 'COMPLETED' ? 'Completado' : 'Pendiente'}
                                                </Badge>
                                            </td>
                                            <td className="py-4">
                                                <button
                                                    onClick={() => handleViewDetail(sale.id)}
                                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Ver
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredSales.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-gray-500">
                                                No se encontraron ventas
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Sale Detail Modal (reused from Dashboard) */}
            {showDetailModal && selectedSale && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Detalle de Venta</h2>
                                <p className="text-sm text-gray-600 mt-1">ID: #{selectedSale.id.slice(0, 8)}</p>
                            </div>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Sale Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Fecha</label>
                                    <p className="text-gray-900 mt-1">
                                        {new Date(selectedSale.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Estado</label>
                                    <div className="mt-1">
                                        <Badge variant={selectedSale.status === 'COMPLETED' ? 'success' : 'warning'}>
                                            {selectedSale.status === 'COMPLETED' ? 'Completado' : 'Pendiente'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Expiration Warning */}
                            {selectedSale.status === 'PENDING' && selectedSale.expiresAt && (
                                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                                    <div className="flex items-start">
                                        <Clock className="h-5 w-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-semibold text-orange-800">
                                                ⚠️ Venta Pendiente de Finalización
                                            </h4>
                                            <p className="text-sm text-orange-700 mt-1">
                                                Esta venta expira en <strong>{getRemainingTime(selectedSale.expiresAt)}</strong>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Customer Info */}
                            {selectedSale.person && (
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <User className="h-5 w-5 text-gray-600" />
                                        <h3 className="font-semibold text-gray-900">Información del Cliente</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600">Nombre:</span>
                                            <span className="ml-2 text-gray-900 font-medium">{selectedSale.person.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Email:</span>
                                            <span className="ml-2 text-gray-900 font-medium">{selectedSale.person.email}</span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <span className="text-gray-600">Dirección:</span>
                                            <span className="ml-2 text-gray-900 font-medium">{selectedSale.person.address}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Delivery Method */}
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-blue-600" />
                                    <h3 className="font-semibold text-gray-900">Método de Entrega</h3>
                                </div>
                                <p className="text-gray-900 mt-2">
                                    {selectedSale.deliveryMethod === 'PICKUP' ? 'Recoger en Tienda' : 'Envío a Domicilio'}
                                </p>
                                {selectedSale.deliveryDate && (
                                    <p className="text-sm text-blue-800 mt-2">
                                        <strong>Entrega estimada:</strong> {new Date(selectedSale.deliveryDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>

                            {/* Items */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Package className="h-5 w-5 text-gray-600" />
                                    <h3 className="font-semibold text-gray-900">Productos</h3>
                                </div>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Producto</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Cantidad</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Precio Unit.</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {selectedSale.items?.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-3 text-gray-900">{item.productId}</td>
                                                    <td className="px-4 py-3 text-right text-gray-900">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(item.unitPrice)}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                        {formatCurrency(item.quantity * item.unitPrice)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-900">Total</td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-900 text-lg">
                                                    {formatCurrency(selectedSale.total)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
                            {selectedSale.status === 'PENDING' && (
                                <button
                                    onClick={handleCompleteSale}
                                    disabled={isCompletingSale}
                                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCompletingSale ? 'Finalizando...' : 'Finalizar Venta'}
                                </button>
                            )}
                            <button
                                onClick={handleCloseModal}
                                className={`${selectedSale.status === 'PENDING' ? 'flex-1' : 'w-full'} px-4 py-3 ${selectedSale.status === 'PENDING' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors font-medium`}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
