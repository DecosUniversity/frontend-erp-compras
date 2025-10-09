import React from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useOrdenesCompra } from '@/hooks';
import { formatCurrency, formatDateShort } from '@/utils/formatters';

const OrdenesCompra: React.FC = () => {
  const { ordenes, isLoading: loading } = useOrdenesCompra();

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'APROBADA':
        return 'bg-green-100 text-green-800';
      case 'RECHAZADA':
        return 'bg-red-100 text-red-800';
      case 'ENTREGADA':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Órdenes de Compra</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona las órdenes de compra del sistema
          </p>
        </div>
        <Link
          to="/ordenes-compra/nueva"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Nueva Orden
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Cargando órdenes...</p>
          </div>
        ) : ordenes.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay órdenes</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando una nueva orden de compra.
            </p>
            <div className="mt-6">
              <Link
                to="/ordenes-compra/nueva"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nueva Orden
              </Link>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordenes.map((orden) => (
                <tr key={orden.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{orden.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {orden.proveedor?.nombre || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateShort(orden.fecha_orden)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(orden.estado)}`}>
                      {orden.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formatCurrency(orden.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/ordenes-compra/${orden.id}`}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {ordenes.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Resumen
            </h3>
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total de Órdenes
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {ordenes.length}
                </dd>
              </div>
              
              <div className="px-4 py-5 bg-yellow-50 shadow rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-yellow-600 truncate">
                  Órdenes Pendientes
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-yellow-900">
                  {ordenes.filter(o => o.estado === 'PENDIENTE').length}
                </dd>
              </div>
              
              <div className="px-4 py-5 bg-green-50 shadow rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-green-600 truncate">
                  Órdenes Aprobadas
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-green-900">
                  {ordenes.filter(o => o.estado === 'APROBADA').length}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenesCompra;