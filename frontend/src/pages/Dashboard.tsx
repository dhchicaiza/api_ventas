import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { fetchSales } from '../services/api';
import { DollarSign, ShoppingBag, Clock, TrendingUp, ArrowRight, Eye, X, User, Package, Truck } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import type { Sale } from '../types';

export const Dashboard: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchSales().then(setSales);
    }, []);

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

    // Mock metrics (replace with real data if available)
    const metrics = [
        { title: 'Ventas Hoy', value: formatCurrency(150000), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Pedidos', value: '12', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Pendientes', value: '3', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
        { title: 'Ticket Promedio', value: formatCurrency(12500), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">Resumen de actividad y ventas recientes</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, index) => (
                    <Card key={index}>
                        <CardContent className="flex items-center p-6">
                            <div className={`${metric.bg} p-4 rounded-full mr-4`}>
                                <metric.icon className={`h-6 w-6 ${metric.color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                                <h3 className="text-2xl font-bold text-gray-900">{metric.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Sales & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Sales Table */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Ventas Recientes</CardTitle>
                        <Link to="/reportes">
                            <Button variant="outline" size="sm">
                                Ver todas
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-gray-200">
                                        <th className="pb-3 font-medium text-gray-600">ID</th>
                                        <th className="pb-3 font-medium text-gray-600">Fecha</th>
                                        <th className="pb-3 font-medium text-gray-600">Cliente</th>
                                        <th className="pb-3 font-medium text-gray-600">Total</th>
                                        <th className="pb-3 font-medium text-gray-600">Estado</th>
                                        <th className="pb-3 font-medium text-gray-600">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sales.slice(0, 5).map((sale) => (
                                        <tr key={sale.id} className="group hover:bg-gray-50 transition-colors">
                                            <td className="py-4 font-medium text-gray-900">#{sale.id.slice(0, 8)}</td>
                                            <td className="py-4 text-gray-600">{new Date(sale.createdAt).toLocaleDateString()}</td>
                                            <td className="py-4 text-gray-600">{sale.person?.name || 'Cliente General'}</td>
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
                                    {sales.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-gray-500">
                                                No hay ventas recientes
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Acciones Rápidas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Link to="/nueva-venta" className="w-full">
                                <Button className="w-full justify-between">
                                    Nueva Venta
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Button variant="outline" className="w-full justify-between">
                                Consultar Stock
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" className="w-full justify-between">
                                Generar Cierre
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Sale Detail Modal */}
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
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
