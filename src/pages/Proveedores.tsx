import React, { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useProveedores } from '@/hooks';
import { useNotifications } from '@/hooks/notifications';
import { crmApi } from '@/services/api';
import { Proveedor } from '@/types';

const Proveedores: React.FC = () => {
  const { proveedores, isLoading, createProveedor, updateProveedor, deleteProveedor } = useProveedores();
  const { addNotification } = useNotifications();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    nit: '',
    contacto: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    pais: '',
    estado: 'Activo'
  });
  const [prospectos, setProspectos] = useState<Array<{ id: string; nombre: string; email?: string; telefono?: string; direccion?: string; ciudad?: string; pais?: string }>>([]);
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState<string | ''>('');
  const [busquedaProspecto, setBusquedaProspecto] = useState('');
  const [loadingProspectos, setLoadingProspectos] = useState(false);

  const cargarProspectos = async (q?: string) => {
    try {
      setLoadingProspectos(true);
      const data = await crmApi.getProspectos({ limit: 50, search: q });
      setProspectos(data);
    } catch (e) {
      console.error('Error cargando prospectos CRM:', e);
      setProspectos([]);
    } finally {
      setLoadingProspectos(false);
    }
  };

  useEffect(() => { if (isModalOpen && !editingProveedor) cargarProspectos(); }, [isModalOpen, editingProveedor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProveedor) {
        await updateProveedor(editingProveedor.id, formData);
        addNotification('success', 'Proveedor actualizado', 'El proveedor fue actualizado correctamente.');
      } else {
        // Si hay un prospecto seleccionado, pásalo como contactoPrincipal
        let opts = {};
        if (prospectoSeleccionado) {
          opts = { contactoPrincipal: prospectoSeleccionado };
        }
        
        const result = await createProveedor(formData, opts);
        
          if (result.crmError) {
            alert(`✅ Proveedor creado en la base de datos local.\n\n⚠️ Error en CRM: ${result.crmError}\n\nEl proveedor se guardó localmente pero no se pudo sincronizar con el CRM.`);
          } else {
            alert('✅ Proveedor creado exitosamente tanto en la base de datos local como en el CRM.');
          }
      }
      setIsModalOpen(false);
      setEditingProveedor(null);
      setFormData({ 
        nombre: '', 
        nit: '',
        contacto: '',
        email: '', 
        telefono: '', 
        direccion: '',
        ciudad: '',
        pais: '',
        estado: 'Activo'
      });
      setProspectoSeleccionado('');
    } catch (error) {
      addNotification('error', 'Error al guardar proveedor', 'Ocurrió un error al guardar el proveedor.');
      console.error('Error al guardar proveedor:', error);
    }
  };

  const handleEdit = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor);
    setFormData({
      nombre: proveedor.nombre,
      nit: proveedor.nit || '',
      contacto: proveedor.contacto || '',
      email: proveedor.email || '',
      telefono: proveedor.telefono || '',
      direccion: proveedor.direccion || '',
      ciudad: proveedor.ciudad || '',
      pais: proveedor.pais || '',
      estado: proveedor.estado || 'Activo'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
      try {
        await deleteProveedor(id);
      } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        alert('Error al eliminar el proveedor. Por favor, intente nuevamente.');
      }
    }
  };

  const openNewModal = () => {
    setEditingProveedor(null);
      setFormData({ 
        nombre: '', 
        nit: '',
        contacto: '',
        email: '', 
        telefono: '', 
        direccion: '',
        ciudad: '',
        pais: '',
        estado: 'Activo'
      });
    setProspectoSeleccionado('');
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona la información de tus proveedores
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Nuevo Proveedor
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Cargando proveedores...</p>
          </div>
        ) : proveedores.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay proveedores</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza agregando un nuevo proveedor.
            </p>
            <div className="mt-6">
              <button
                onClick={openNewModal}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo Proveedor
              </button>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dirección
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proveedores.map((proveedor, index) => (
                <tr key={proveedor.id || `proveedor-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {proveedor.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {proveedor.contacto || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {proveedor.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {proveedor.telefono || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {proveedor.direccion || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(proveedor)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(proveedor.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor (desde Prospecto)'}
                  </h3>
                  
                  <div className="space-y-4">
                    {!editingProveedor && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Seleccionar Prospecto *</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <input
                            type="text"
                            placeholder="Buscar por nombre o email"
                            value={busquedaProspecto}
                            onChange={(e) => setBusquedaProspecto(e.target.value)}
                            className="flex-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button type="button" onClick={() => cargarProspectos(busquedaProspecto)} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm">Buscar</button>
                        </div>
                        <select
                          required
                          value={prospectoSeleccionado}
                          onChange={(e) => {
                            const idSel = e.target.value;
                            setProspectoSeleccionado(idSel || '');
                            const p = prospectos.find(p => p.id === idSel);
                            if (p) {
                              setFormData(prev => ({
                                // nombre no se autollenará; debe asignarse manualmente por el usuario
                                nombre: prev.nombre || '',
                                nit: prev.nit || '',
                                contacto: p.nombre || prev.contacto || '',
                                email: p.email || '',
                                telefono: p.telefono || '',
                                direccion: p.direccion || '',
                                ciudad: p.ciudad || '',
                                pais: p.pais || '',
                                estado: 'Activo'
                              }));
                            }
                          }}
                          className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">{loadingProspectos ? 'Cargando...' : 'Seleccione un prospecto'}</option>
                          {prospectos.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre} {p.email ? `- ${p.email}` : ''}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Solo se pueden crear proveedores a partir de contactos Prospecto del CRM.</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        NIT *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nit}
                        onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Contacto
                      </label>
                      <input
                        type="text"
                        value={formData.contacto}
                        onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Dirección
                      </label>
                      <textarea
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={formData.ciudad}
                        onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        País
                      </label>
                      <input
                        type="text"
                        value={formData.pais}
                        onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingProveedor ? 'Actualizar' : 'Crear desde Prospecto'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proveedores;