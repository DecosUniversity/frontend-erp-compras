import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useProveedores, useOrdenesCompra } from '@/hooks';
import { tareasApi } from '@/services/api';
import { useNotifications } from '@/hooks/notifications';
import { CreateOrdenCompraData, DetalleOrdenInput } from '@/types';

const CrearOrden: React.FC = () => {
  const navigate = useNavigate();
  const { proveedores } = useProveedores();
  const { createOrden } = useOrdenesCompra();
  const { addNotification } = useNotifications();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateOrdenCompraData>({
    proveedor_id: 0,
    fecha_entrega_esperada: '',
    detalles: []
  });

  const [currentDetail, setCurrentDetail] = useState<DetalleOrdenInput>({
    producto_id: 0,
    cantidad: 1,
    precio_unitario: 0
  });

  const addDetail = () => {
    if (currentDetail.producto_id > 0 && currentDetail.cantidad > 0 && currentDetail.precio_unitario > 0) {
      setFormData(prev => ({
        ...prev,
        detalles: [...prev.detalles, currentDetail]
      }));
      setCurrentDetail({ producto_id: 0, cantidad: 1, precio_unitario: 0 });
    }
  };

  const removeDetail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.detalles.reduce((total, detalle) => 
      total + (detalle.cantidad * detalle.precio_unitario), 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.proveedor_id === 0) {
      alert('Selecciona un proveedor');
      return;
    }
    
    if (formData.detalles.length === 0) {
      alert('Agrega al menos un producto');
      return;
    }

    setLoading(true);
    try {
      const nuevaOrden = await createOrden(formData);
      // Tras crear la orden, crear una tarea en el servicio externo (no bloquear navegación)
      try {
        const titulo = `OC-${nuevaOrden.id} creada`;
        const descripcion = `Orden de compra #${nuevaOrden.id} para proveedor ${nuevaOrden.proveedor?.nombre || nuevaOrden.proveedor_id}. Total: ${calculateTotal().toFixed(2)}`;
        // fecha_limite: si el usuario eligió fecha_entrega_esperada, usar las 12:00; si no, 3 días después
        const fecha = formData.fecha_entrega_esperada
          ? `${formData.fecha_entrega_esperada} 12:00:00`
          : (() => {
              const d = new Date();
              d.setDate(d.getDate() + Number(import.meta.env.VITE_TAREAS_DEFAULT_DUE_DAYS || 3));
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              return `${yyyy}-${mm}-${dd} 12:00:00`;
            })();
        const estado = 'Pendiente';
        const prioridad = (import.meta.env.VITE_TAREAS_DEFAULT_PRIORITY as string) || 'Alta';
        const asignado_a = (import.meta.env.VITE_TAREAS_DEFAULT_ASSIGNEE as string) || '1';

        await tareasApi.create({ titulo, descripcion, fecha_limite: fecha, estado, prioridad, asignado_a });
        addNotification('success', 'Tarea creada', `Se generó una tarea para la orden OC-${nuevaOrden.id}`);
      } catch (taskErr: any) {
        console.error('No se pudo crear la tarea externa:', taskErr);
        addNotification('warning', 'Tarea no creada', 'La orden fue creada, pero la tarea externa falló');
      }
      navigate(`/ordenes-compra/${nuevaOrden.id}`);
    } catch (error) {
      console.error('Error al crear orden:', error);
      addNotification('error', 'Error al crear la orden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/ordenes-compra"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Volver
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Orden de Compra</h1>
          <p className="mt-2 text-sm text-gray-600">
            Crea una nueva orden de compra
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Info */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Información de la Orden
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Proveedor *
                </label>
                <select
                  required
                  value={formData.proveedor_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, proveedor_id: Number(e.target.value) }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={0}>Selecciona un proveedor</option>
                  {proveedores.map(proveedor => (
                    <option key={proveedor.id} value={proveedor.id}>
                      {proveedor.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Entrega Esperada
                </label>
                <input
                  type="date"
                  value={formData.fecha_entrega_esperada}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_entrega_esperada: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Add Product */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Agregar Producto
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ID Producto
                </label>
                <input
                  type="number"
                  min="1"
                  value={currentDetail.producto_id || ''}
                  onChange={(e) => setCurrentDetail(prev => ({ ...prev, producto_id: Number(e.target.value) }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ID del producto"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={currentDetail.cantidad}
                  onChange={(e) => setCurrentDetail(prev => ({ ...prev, cantidad: Number(e.target.value) }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Precio Unitario
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentDetail.precio_unitario || ''}
                  onChange={(e) => setCurrentDetail(prev => ({ ...prev, precio_unitario: Number(e.target.value) }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  &nbsp;
                </label>
                <button
                  type="button"
                  onClick={addDetail}
                  className="mt-1 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Productos en la Orden
            </h3>
            {formData.detalles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No hay productos agregados</p>
              </div>
            ) : (
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
                        Subtotal
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.detalles.map((detalle, index) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => removeDetail(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <th colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                        Total:
                      </th>
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        ${calculateTotal().toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Link
            to="/ordenes-compra"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading || formData.detalles.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando...' : 'Crear Orden'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CrearOrden;