import { ShoppingCart, Home, Plus, BarChart3, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

export const Navbar = () => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo y título */}
                    <div className="flex items-center">
                        <ShoppingCart className="h-8 w-8 text-blue-600" />
                        <span className="ml-2 text-xl font-bold text-gray-900">
                            Portal de Ventas
                        </span>
                    </div>

                    {/* Navegación principal */}
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/"
                            className={cn(
                                'inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                isActive('/')
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Dashboard
                        </Link>

                        <Link
                            to="/nueva-venta"
                            className={cn(
                                'inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                isActive('/nueva-venta')
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Venta
                        </Link>

                        <Link
                            to="/reportes"
                            className={cn(
                                'inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                isActive('/reportes')
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Reportes
                        </Link>

                        <Link
                            to="/personas"
                            className={cn(
                                'inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                isActive('/personas')
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Personas
                        </Link>
                    </div>

                    {/* Usuario */}
                    <div className="flex items-center">
                        <div className="flex items-center space-x-3">
                            <div className="text-sm text-right">
                                <p className="font-medium text-gray-900">Vendedor</p>
                                <p className="text-gray-500">Tienda Principal</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                <span className="text-white font-medium">V</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};
