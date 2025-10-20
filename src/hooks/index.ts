import { useState, useEffect } from 'react';
import { proveedoresApi, ordenesCompraApi, productosApi, crmApi, CrmProveedorPayload } from '@/services/api';
import type {
  Proveedor,
  CreateProveedorData,
  OrdenCompra,
  CreateOrdenCompraData,
  Producto,
} from '@/types';

// Hook para manejar proveedores
export const useProveedores = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProveedores = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await proveedoresApi.getAll();
      setProveedores(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar proveedores');
    } finally {
      setIsLoading(false);
    }
  };

  const createProveedor = async (data: CreateProveedorData, opts?: { contactoPrincipal?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Crear proveedor local
      const newProveedor = await proveedoresApi.create(data);
      setProveedores((prev) => [...prev, newProveedor]);

      // 2. Crear proveedor en CRM
      const crmPayload: CrmProveedorPayload = {
        name: data.nombre,
        email: data.email || '',
        phone: data.telefono || '',
        nit: data.nit ? Number(data.nit) : 0,
      };
      if (opts?.contactoPrincipal) {
        crmPayload.contactoPrincipal = opts.contactoPrincipal;
      } else {
        crmPayload.contacto = {
          primerNombre: data.contacto || '',
          direccion: data.direccion || '',
          telefono: data.telefono || '',
          correo: data.email || '',
          // Puedes agregar más campos si el formulario los tiene
        };
      }
      let crmError: string | null = null;
      try {
        await crmApi.createProveedor(crmPayload);
      } catch (err: any) {
        // Extraer mensaje de error del CRM
        console.error('Error creando proveedor en CRM:', err);
        if (err?.response?.data?.errors) {
          const errors = err.response.data.errors;
          const errorMessages = Object.values(errors).flat();
          crmError = errorMessages.join(', ');
        } else if (err?.response?.data?.title) {
          crmError = err.response.data.title;
        } else if (err?.message) {
          crmError = err.message;
        } else {
          crmError = 'Error desconocido al crear en CRM';
        }
      }
      return { proveedor: newProveedor, crmError };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear proveedor';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProveedor = async (id: number, data: Partial<CreateProveedorData>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedProveedor = await proveedoresApi.update(id, data);
      setProveedores((prev) =>
        prev.map((proveedor) =>
          proveedor.id === id ? updatedProveedor : proveedor
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar proveedor';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProveedor = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await proveedoresApi.delete(id);
      // En lugar de filtrar localmente, refrescar la lista completa desde el servidor
      // para asegurar que obtenemos el estado actualizado
      await fetchProveedores();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar proveedor';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  return {
    proveedores,
    isLoading,
    error,
    fetchProveedores,
    createProveedor,
    updateProveedor,
    deleteProveedor,
  };
};

// Hook para manejar órdenes de compra
export const useOrdenesCompra = () => {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrdenes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ordenesCompraApi.getAll();
      setOrdenes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar órdenes de compra');
    } finally {
      setIsLoading(false);
    }
  };

  const getOrdenById = async (id: number): Promise<OrdenCompra | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const orden = await ordenesCompraApi.getById(id);
      return orden;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar orden de compra');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createOrden = async (data: CreateOrdenCompraData) => {
    setIsLoading(true);
    setError(null);
    try {
      const newOrden = await ordenesCompraApi.create(data);
      setOrdenes((prev) => [...prev, newOrden]);
      return newOrden;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear orden de compra';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrden = async (id: number, data: Partial<OrdenCompra>) => {
    setIsLoading(true);
    setError(null);
    try {
      await ordenesCompraApi.update(id, data);
      setOrdenes((prev) =>
        prev.map((orden) =>
          (orden as any).id_orden_compra === id ? { ...orden, ...data } : orden
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar orden de compra';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteOrden = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await ordenesCompraApi.delete(id);
      setOrdenes((prev) => prev.filter((orden) => (orden as any).id_orden_compra !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar orden de compra';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdenes();
  }, []);

  return {
    ordenes,
    isLoading,
    error,
    fetchOrdenes,
    getOrdenById,
    createOrden,
    updateOrden,
    deleteOrden,
  };
};

// Hook para búsqueda de productos
export const useProductos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProductos = async (query: string) => {
    if (!query.trim()) {
      setProductos([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await productosApi.search(query);
      setProductos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar productos');
      setProductos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getProductoById = async (id: number): Promise<Producto | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const producto = await productosApi.getById(id);
      return producto;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener producto');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    productos,
    isLoading,
    error,
    searchProductos,
    getProductoById,
  };
};

// Hook para notificaciones
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
  }>>([]);

  const addNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message?: string
  ) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, title, message }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);

    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  return {
    notifications,
    addNotification,
    removeNotification,
  };
};