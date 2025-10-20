import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ordenesCompraApi, inventoryApi } from '@/services/api';
import { formatCurrency } from '@/utils/formatters';
import type { OrdenCompra } from '@/types';
import { useNotifications } from '@/hooks/notifications';

const OrdenDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [orden, setOrden] = useState<OrdenCompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingEstado, setSavingEstado] = useState(false);
  const [estadoLocal, setEstadoLocal] = useState<OrdenCompra['estado'] | ''>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [estadoPendiente, setEstadoPendiente] = useState<OrdenCompra['estado'] | null>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    const fetchOrden = async () => {
      if (!id) {
        console.log('❌ No ID provided');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const ordenData = await ordenesCompraApi.getById(Number(id));
        
        if (ordenData) {
          setOrden(ordenData);
          setEstadoLocal(ordenData.estado);
        } else {
          console.log('❌ No se obtuvo data de la orden');
          setError('Orden no encontrada');
        }
      } catch (err) {
        console.error('❌ Error al cargar orden:', err);
        setError('Error al cargar la orden de compra');
      } finally {
        setLoading(false);
      }
    };

    fetchOrden();
  }, [id]); // Solo depende del ID, no de funciones que cambian

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Cargando orden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-red-900">Error al cargar</h3>
        <p className="mt-1 text-sm text-red-500">{error}</p>
        <div className="mt-6">
          <Link
            to="/ordenes-compra"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver a Órdenes
          </Link>
        </div>
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Orden no encontrada</h3>
        <p className="mt-1 text-sm text-gray-500">
          La orden de compra que buscas no existe.
        </p>
        <div className="mt-6">
          <Link
            to="/ordenes-compra"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver a Órdenes
          </Link>
        </div>
      </div>
    );
  }

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

  const estadosDisponibles: OrdenCompra['estado'][] = [
    'PENDIENTE', 'APROBADA', 'RECHAZADA', 'ENTREGADA'
  ];

  const handleEstadoChange = async (nuevo: OrdenCompra['estado']) => {
    if (!orden || savingEstado) return;
    try {
      setSavingEstado(true);
      setEstadoLocal(nuevo);
      const res = await ordenesCompraApi.updateEstado(orden.id, nuevo);
      console.log('[DEBUG] Respuesta updateEstado:', res);
      setOrden({ ...orden, estado: res.estado });
      // Si la orden se marcó como ENTREGADA, ajustar inventario en servicio externo
      if (res.estado === 'ENTREGADA') {
        try {
          const detalles = orden.detalles || [];
          if (detalles.length === 0) {
            addNotification('warning', `OC-${orden.id}: no hay detalles para ajustar inventario`);
          } else {
            const adjustResults = await Promise.allSettled(
              detalles.map((d) =>
                inventoryApi.adjust({
                  id_producto: (d as any).producto_id ?? 0,
                  cantidad: Number((d as any).cantidad ?? 0),
                  motivo: `Compra recibida OC-${orden.id}`,
                })
              )
            );
            const failed = adjustResults.filter(r => r.status === 'rejected');
            if (failed.length === 0) {
              addNotification('success', `Inventario actualizado para OC-${orden.id}`);
            } else if (failed.length < adjustResults.length) {
              addNotification('warning', `Inventario parcialmente actualizado (${adjustResults.length - failed.length}/${adjustResults.length}) para OC-${orden.id}`);
            } else {
              addNotification('error', `No se pudo actualizar el inventario para OC-${orden.id}`);
            }
          }
        } catch (invErr: any) {
          console.error('Error al ajustar inventario:', invErr);
          addNotification('error', `Error al ajustar inventario: ${invErr?.message || 'desconocido'}`);
        }
      }
    } catch (e) {
      setEstadoLocal(orden.estado);
      console.error('Error actualizando estado:', e);
      addNotification('error', 'No se pudo actualizar el estado. Intente más tarde.');
    } finally {
      setSavingEstado(false);
      setShowConfirmModal(false);
      setEstadoPendiente(null);
    }
  };

  const onSelectEstado = (nuevo: OrdenCompra['estado']) => {
  console.log('[DEBUG] onSelectEstado:', { nuevo, estadoLocal });
  if (nuevo === estadoLocal) return;
  setEstadoPendiente(nuevo);
  setShowConfirmModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Modal de confirmación de cambio de estado */}
      {showConfirmModal && estadoPendiente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">Confirmar cambio de estado</h2>
            <p className="mb-4">¿Está seguro que desea cambiar el estado de la orden a <span className="font-bold">{estadoPendiente}</span>?</p>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => { setShowConfirmModal(false); setEstadoPendiente(null); }}
                disabled={savingEstado}
              >Cancelar</button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => estadoPendiente && handleEstadoChange(estadoPendiente)}
                disabled={savingEstado}
              >Confirmar</button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/ordenes-compra"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Volver
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Orden de Compra #{orden.id}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Detalles de la orden de compra
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getEstadoColor(orden.estado)}`}>
            {orden.estado}
          </span>
          <label className="text-sm text-gray-600">Cambiar estado:</label>
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={estadoLocal}
            onChange={(e) => onSelectEstado(e.target.value as OrdenCompra['estado'])}
            disabled={savingEstado || orden.estado === 'ENTREGADA' || orden.estado === 'RECHAZADA'}
          >
            {estadosDisponibles.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>
      {(orden.estado === 'ENTREGADA') && (
        <div className="mt-2 text-sm text-blue-700 bg-blue-50 rounded px-3 py-2">
          No es posible cambiar el estado de una orden <b>ENTREGADA</b>.
        </div>
      )}
      {(orden.estado === 'RECHAZADA') && (
        <div className="mt-2 text-sm text-red-700 bg-red-50 rounded px-3 py-2">
          No es posible cambiar el estado de una orden <b>RECHAZADA</b>.
        </div>
      )}

      {/* Order Info */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Información de la Orden
          </h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">ID de Orden</dt>
              <dd className="mt-1 text-sm text-gray-900">#{orden.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Proveedor</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {orden.proveedor?.nombre || 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha de Orden</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(orden.fecha_orden).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Estado</dt>
              <dd className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(orden.estado)}`}>
                  {orden.estado}
                </span>
                {orden.fecha_actualizacion && (
                  <div className="text-xs text-gray-500 mt-1">
                    <span>Fecha de declaración: {new Date(orden.fecha_actualizacion).toLocaleDateString('es-ES', {
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}</span>
                  </div>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total</dt>
              <dd className="mt-1 text-sm text-gray-900 font-semibold">
                ${formatCurrency(orden.total)}
              </dd>
            </div>
            {orden.fecha_entrega_esperada && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Entrega Esperada</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(orden.fecha_entrega_esperada).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Detalle de Productos
          </h3>
          {orden.detalles && orden.detalles.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio Unitario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal (sin imp.)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Impuestos (12%)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orden.detalles.map((detalle, index) => (
                    <tr key={`${detalle.producto_id}-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{detalle.producto_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {detalle.cantidad}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${detalle.precio_unitario.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${detalle.subtotal.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ${(detalle.impuestos || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        ${(detalle.total || detalle.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <th colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      Subtotal (sin impuestos):
                    </th>
                    <td className="px-6 py-3 text-sm font-bold text-gray-900">
                      ${formatCurrency(orden.subtotal || 0)}
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-gray-900">
                      ${formatCurrency(orden.impuestos || 0)}
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-gray-900">
                      ${formatCurrency(orden.total)}
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      Total General:
                    </th>
                    <td colSpan={3} className="px-6 py-3 text-sm font-bold text-blue-600 text-lg">
                      ${formatCurrency(orden.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No hay productos en esta orden.</p>
            </div>
          )}
        </div>
      </div>

      {/* Proveedor Info */}
      {orden.proveedor && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Información del Proveedor
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                <dd className="mt-1 text-sm text-gray-900">{orden.proveedor.nombre}</dd>
              </div>
              {orden.proveedor.email && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{orden.proveedor.email}</dd>
                </div>
              )}
              {orden.proveedor.telefono && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                  <dd className="mt-1 text-sm text-gray-900">{orden.proveedor.telefono}</dd>
                </div>
              )}
              {orden.proveedor.direccion && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                  <dd className="mt-1 text-sm text-gray-900">{orden.proveedor.direccion}</dd>
                </div>
              )}
              {(orden.estado === 'ENTREGADA') && (
                <div className="mt-2 text-sm text-blue-700 bg-blue-50 rounded px-3 py-2">
                  No es posible cambiar el estado de una orden <b>ENTREGADA</b>.
                </div>
              )}
              {(orden.estado === 'RECHAZADA') && (
                <div className="mt-2 text-sm text-red-700 bg-red-50 rounded px-3 py-2">
                  No es posible cambiar el estado de una orden <b>RECHAZADA</b>.
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenDetalle;