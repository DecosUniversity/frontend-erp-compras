import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UserGroupIcon, 
  ShoppingCartIcon,
  DocumentTextIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useProveedores, useOrdenesCompra } from '@/hooks';
import { formatCurrency, formatDateShort } from '@/utils/formatters';

const Dashboard: React.FC = () => {
  const { proveedores, isLoading: loadingProveedores } = useProveedores();
  const { ordenes, isLoading: loadingOrdenes } = useOrdenesCompra();
  const [selectedProveedor, setSelectedProveedor] = React.useState<{ id: number; nombre: string } | null>(null);

  // Calcular Top 3 proveedores por cantidad de órdenes (y total como desempate)
  const topProveedores = React.useMemo(() => {
    if (!ordenes || ordenes.length === 0) return [] as Array<{ id: number; nombre: string; count: number; total: number }>;
    const map = new Map<number, { id: number; nombre: string; count: number; total: number }>();
    for (const o of ordenes) {
      const id = (o.proveedor?.id ?? o.proveedor_id) as number;
      if (!id) continue;
      const nombre = o.proveedor?.nombre || proveedores.find(p => p.id === id)?.nombre || `Proveedor #${id}`;
      const entry = map.get(id) || { id, nombre, count: 0, total: 0 };
      entry.count += 1;
      entry.total += Number(o.total || 0);
      map.set(id, entry);
    }
    return Array.from(map.values())
      .sort((a, b) => (b.count - a.count) || (b.total - a.total))
      .slice(0, 3);
  }, [ordenes, proveedores]);

  const stats = [
    {
      name: 'Total Proveedores',
      value: loadingProveedores ? '...' : proveedores.length.toString(),
      icon: UserGroupIcon,
      href: '/proveedores',
      color: 'bg-blue-500'
    },
    {
      name: 'Órdenes de Compra',
      value: loadingOrdenes ? '...' : ordenes.length.toString(),
      icon: ShoppingCartIcon,
      href: '/ordenes-compra',
      color: 'bg-green-500'
    },
    {
      name: 'Órdenes Pendientes',
      value: loadingOrdenes ? '...' : ordenes.filter(o => o.estado === 'PENDIENTE').length.toString(),
      icon: DocumentTextIcon,
      href: '/ordenes-compra',
      color: 'bg-yellow-500'
    },
    {
      name: 'Órdenes Aprobadas',
      value: loadingOrdenes ? '...' : ordenes.filter(o => o.estado === 'APROBADA').length.toString(),
      icon: ShoppingCartIcon,
      href: '/ordenes-compra',
      color: 'bg-teal-500'
    },
    {
      name: 'Órdenes Entregadas',
      value: loadingOrdenes ? '...' : ordenes.filter(o => o.estado === 'ENTREGADA').length.toString(),
      icon: ShoppingCartIcon,
      href: '/ordenes-compra',
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Resumen general del sistema de gestión de compras
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

      {/* Stats */}
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              to={stat.href}
              className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <dt>
                <div className={`absolute rounded-md p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                  {stat.name}
                </p>
              </dt>
              <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </dd>
            </Link>
          );
        })}
      </div>

      {/* Top Proveedores por Órdenes */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Top Proveedores por Órdenes
          </h3>
          {loadingOrdenes ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Cargando ranking...</p>
            </div>
          ) : topProveedores.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no hay órdenes para calcular el ranking.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {topProveedores.map((p, idx) => (
                <li
                  key={p.id}
                  className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 rounded"
                  onClick={() => setSelectedProveedor({ id: p.id, nombre: p.nombre })}
                  title="Ver resumen de este proveedor"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{p.nombre}</div>
                      <div className="text-xs text-gray-500">{p.count} orden{p.count !== 1 ? 'es' : ''}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">${formatCurrency(p.total)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Drilldown del proveedor seleccionado */}
      {selectedProveedor && (
        <ProveedorResumen
          proveedor={selectedProveedor}
          ordenes={ordenes}
          onClose={() => setSelectedProveedor(null)}
        />
      )}

      {/* Recent Orders */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Órdenes Recientes
          </h3>
          {loadingOrdenes ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Cargando órdenes...</p>
            </div>
          ) : ordenes.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
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
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orden
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ordenes.slice(0, 5).map((orden) => (
                    <tr key={orden.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/ordenes-compra/${orden.id}`}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          #{orden.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {orden.proveedor?.nombre || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          orden.estado === 'PENDIENTE' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : orden.estado === 'APROBADA'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {orden.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${formatCurrency(orden.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// Componente de resumen por proveedor
const ProveedorResumen: React.FC<{
  proveedor: { id: number; nombre: string };
  ordenes: ReturnType<typeof useOrdenesCompra> extends infer T
    ? T extends { ordenes: infer O }
      ? O extends Array<any>
        ? O
        : any[]
      : any[]
    : any[];
  onClose: () => void;
}> = ({ proveedor, ordenes, onClose }) => {
  const data = React.useMemo(() => {
    const ofProv = (ordenes || []).filter((o: any) => (o.proveedor?.id ?? o.proveedor_id) === proveedor.id);
    const totalCount = ofProv.length;
    const totalAmount = ofProv.reduce((acc: number, o: any) => acc + Number(o.total || 0), 0);
    const estados = ['PENDIENTE', 'APROBADA', 'RECHAZADA', 'ENTREGADA'] as const;
    const porEstado: Record<string, { count: number; total: number }> = {};
    for (const e of estados) porEstado[e] = { count: 0, total: 0 };
    for (const o of ofProv) {
      const e = (o.estado || 'PENDIENTE').toUpperCase();
      if (!porEstado[e]) porEstado[e] = { count: 0, total: 0 };
      porEstado[e].count += 1;
      porEstado[e].total += Number(o.total || 0);
    }
    const totalPendiente = porEstado['PENDIENTE']?.total || 0;
    return { totalCount, totalAmount, porEstado, totalPendiente };
  }, [ordenes, proveedor.id]);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Resumen de {proveedor.nombre}</h3>
            <p className="text-sm text-gray-500">Detalle de órdenes y montos por estado</p>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 border rounded px-2 py-1"
            aria-label="Cerrar"
          >
            Cerrar
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
          <div className="bg-gray-50 rounded p-4">
            <div className="text-sm text-gray-500">Órdenes totales</div>
            <div className="text-2xl font-semibold text-gray-900">{data.totalCount}</div>
          </div>
          <div className="bg-gray-50 rounded p-4">
            <div className="text-sm text-gray-500">Monto total</div>
            <div className="text-2xl font-semibold text-gray-900">${formatCurrency(data.totalAmount)}</div>
          </div>
          <div className="bg-gray-50 rounded p-4">
            <div className="text-sm text-gray-500">Total pendiente</div>
            <div className="text-2xl font-semibold text-gray-900">${formatCurrency(data.totalPendiente)}</div>
          </div>
        </div>

        {/* Tabla por estado */}
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(data.porEstado).map(([estado, v]) => (
                <tr key={estado}>
                  <td className="px-6 py-3 text-sm text-gray-900">{estado}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">{v.count}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">${formatCurrency(v.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};