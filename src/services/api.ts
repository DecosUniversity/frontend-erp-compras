import axios, { AxiosResponse } from 'axios';
import type {
  ApiResponse,
  Proveedor,
  CreateProveedorData,
  OrdenCompra,
  CreateOrdenCompraData,
  DetalleOrden,
  CreateDetalleOrdenData,
  Producto
} from '@/types';

// Configuración base de Axios
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  process.env.NODE_ENV === 'development' 
    ? '/api'  // Usa el proxy en desarrollo
    : 'https://erpcompras-production.up.railway.app/api'
);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Recurso no encontrado');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Error del servidor. Intente nuevamente.');
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Tiempo de espera agotado');
    }
    
    throw error;
  }
);

// Servicios para Proveedores
export const proveedoresApi = {
  // Obtener todos los proveedores
  getAll: async (): Promise<Proveedor[]> => {
    const response: AxiosResponse<any[]> = await api.get('/proveedores');
    
    // Mapear los datos del backend al formato esperado por el frontend
    const mappedProveedores = response.data
      .filter((proveedor: any) => proveedor.estado === 'Activo') // Solo mostrar proveedores activos
      .map((proveedor: any) => ({
        id: proveedor.id_proveedor,
        nombre: proveedor.nombre,
        email: proveedor.email,
        telefono: proveedor.telefono,
        direccion: proveedor.direccion,
        contacto: proveedor.contacto,
        ciudad: proveedor.ciudad,
        pais: proveedor.pais,
        estado: proveedor.estado,
        fecha_registro: proveedor.fecha_registro
      }));
    
    return mappedProveedores;
  },

  // Obtener proveedor por ID
  getById: async (id: number): Promise<Proveedor> => {
    const response: AxiosResponse<ApiResponse<Proveedor>> = await api.get(`/proveedores/${id}`);
    if (!response.data.data) {
      throw new Error('Proveedor no encontrado');
    }
    return response.data.data;
  },

  // Crear nuevo proveedor
  create: async (data: CreateProveedorData): Promise<Proveedor> => {
    const response = await api.post('/proveedores', data);
    
    // Mapear la respuesta del backend al formato esperado por el frontend
    const mappedProveedor = {
      id: response.data.id_proveedor,
      nombre: response.data.nombre,
      email: response.data.email,
      telefono: response.data.telefono,
      direccion: response.data.direccion,
      contacto: response.data.contacto,
      ciudad: response.data.ciudad,
      pais: response.data.pais,
      estado: response.data.estado,
      fecha_registro: response.data.fecha_registro
    };
    
    return mappedProveedor;
  },

  // Actualizar proveedor
  update: async (id: number, data: Partial<CreateProveedorData>): Promise<Proveedor> => {
    const response = await api.put(`/proveedores/${id}`, data);
    
    // Mapear la respuesta del backend al formato esperado por el frontend
    const mappedProveedor = {
      id: response.data.id_proveedor,
      nombre: response.data.nombre,
      email: response.data.email,
      telefono: response.data.telefono,
      direccion: response.data.direccion,
      contacto: response.data.contacto,
      ciudad: response.data.ciudad,
      pais: response.data.pais,
      estado: response.data.estado,
      fecha_registro: response.data.fecha_registro
    };
    
    return mappedProveedor;
  },

  // Eliminar proveedor
  delete: async (id: number): Promise<void> => {
    await api.delete(`/proveedores/${id}`);
  },
};

// Servicios para Órdenes de Compra
export const ordenesCompraApi = {
  // Obtener todas las órdenes
  getAll: async (): Promise<OrdenCompra[]> => {
    const response: AxiosResponse<any> = await api.get('/ordenes-compra');
    
    if (!response.data.success || !response.data.data) {
      return [];
    }
    
    // Mapear los datos del backend al formato esperado por el frontend
    const mappedOrdenes = response.data.data.map((orden: any) => ({
      id: orden.id_orden_compra,
      proveedor_id: orden.id_proveedor,
      numero_orden: orden.numero_orden,
      fecha_orden: orden.fecha_orden,
      fecha_entrega_esperada: orden.fecha_entrega_esperada,
      estado: orden.estado,
      subtotal: parseFloat(orden.subtotal) || 0,
      impuestos: parseFloat(orden.impuestos) || 0,
      total: parseFloat(orden.total) || 0,
      moneda: orden.moneda,
      terminos_pago: orden.terminos_pago,
      observaciones: orden.observaciones,
      creado_por: orden.creado_por,
      fecha_creacion: orden.fecha_creacion,
      fecha_actualizacion: orden.fecha_actualizacion,
      // Mapear información del proveedor
      proveedor: {
        id: orden.id_proveedor,
        nombre: orden.nombre_proveedor,
        contacto: orden.contacto_proveedor
      }
    }));
    
    return mappedOrdenes;
  },

  // Obtener orden por ID
  getById: async (id: number): Promise<OrdenCompra> => {
    try {
      const response: AxiosResponse<any> = await api.get(`/ordenes-compra/${id}`);
      
      if (!response.data.success || !response.data.data) {
        console.error('❌ API: Respuesta sin datos válidos');
        throw new Error('Orden de compra no encontrada');
      }
      
      const orden = response.data.data;
      
      // Mapear los datos del backend al formato esperado por el frontend
      const mappedOrden = {
        id: orden.id_orden_compra,
        proveedor_id: orden.id_proveedor,
        numero_orden: orden.numero_orden,
        fecha_orden: orden.fecha_orden,
        fecha_entrega_esperada: orden.fecha_entrega_esperada,
        estado: orden.estado,
        subtotal: parseFloat(orden.subtotal) || 0,
        impuestos: parseFloat(orden.impuestos) || 0,
        total: parseFloat(orden.total) || 0,
        moneda: orden.moneda,
        terminos_pago: orden.terminos_pago,
        observaciones: orden.observaciones,
        creado_por: orden.creado_por,
        fecha_creacion: orden.fecha_creacion,
        fecha_actualizacion: orden.fecha_actualizacion,
        // Mapear información completa del proveedor
        proveedor: {
          id: orden.id_proveedor,
          nombre: orden.nombre_proveedor,
          contacto: orden.contacto,
          telefono: orden.telefono,
          email: orden.email,
          direccion: orden.direccion_proveedor,
          ciudad: orden.ciudad,
          pais: orden.pais
        },
        // Mapear detalles si existen
        detalles: orden.detalles ? orden.detalles.map((detalle: any) => ({
          id: detalle.id_detalle,
          id_detalle: detalle.id_detalle,
          orden_compra_id: detalle.id_orden_compra,
          id_orden_compra: detalle.id_orden_compra,
          producto_id: detalle.id_producto,
          cantidad: detalle.cantidad,
          precio_unitario: parseFloat(detalle.precio_unitario) || 0,
          descuento: parseFloat(detalle.descuento) || 0,
          subtotal: parseFloat(detalle.subtotal_linea) || 0,
          impuestos: parseFloat(detalle.impuestos_linea) || 0,
          total: parseFloat(detalle.total_linea) || 0,
          descripcion_producto: detalle.descripcion_producto,
          numero_linea: detalle.numero_linea
        })) : []
      };
      
      return mappedOrden;
    } catch (error) {
      console.error('❌ API: Error en getById:', error);
      throw error;
    }
  },

  // Crear nueva orden
  create: async (data: CreateOrdenCompraData): Promise<OrdenCompra> => {
    // Generar número de orden automático
    const currentYear = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const numero_orden = `OC-${currentYear}-${randomNum}`;
    
    // Transformar detalles al formato que espera el backend
    const detallesTransformados = data.detalles.map((detalle, index) => ({
      id_producto: detalle.producto_id,
      cantidad: detalle.cantidad,
      precio_unitario: detalle.precio_unitario,
      descuento: detalle.descuento || 0,
      descripcion_producto: detalle.descripcion_producto || `Producto ${detalle.producto_id}`,
      numero_linea: index + 1
    }));
    
    // Calcular totales
    const totalConImpuestos = detallesTransformados.reduce((total, detalle) => {
      const totalLinea = detalle.cantidad * detalle.precio_unitario * (1 - detalle.descuento / 100);
      return total + totalLinea;
    }, 0);
    
    // Extraer impuestos del precio total (12% incluido en el precio)
    const subtotalOrden = totalConImpuestos / 1.12; // Precio sin impuestos
    const impuestosOrden = totalConImpuestos - subtotalOrden; // Impuestos extraídos del precio
    const totalOrden = totalConImpuestos; // Total = precio original (ya incluye impuestos)
    
    // Transformar los datos al formato que espera el backend
    const payload = {
      orden: {
        id_proveedor: data.proveedor_id,
        numero_orden: numero_orden,
        fecha_orden: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
        fecha_entrega_esperada: data.fecha_entrega_esperada || null,
        estado: 'pendiente',
        subtotal: subtotalOrden,
        impuestos: impuestosOrden,
        total: totalOrden,
        moneda: 'GTQ',
        terminos_pago: '30 días',
        observaciones: 'Orden creada desde el sistema',
        creado_por: 1 // Por ahora, usar un usuario fijo
      },
      detalles: detallesTransformados
    };
    
    console.log('🚀 Sending order payload:', JSON.stringify(payload, null, 2));
    
    const response = await api.post('/ordenes-compra', payload);
    
    console.log('📥 Order response:', response.data);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Error al crear orden de compra');
    }
    
    // Mapear la respuesta del backend al formato esperado por el frontend
    const orden = response.data.data;
    const mappedOrden = {
      id: orden.id_orden_compra,
      proveedor_id: orden.id_proveedor,
      numero_orden: orden.numero_orden,
      fecha_orden: orden.fecha_orden,
      fecha_entrega_esperada: orden.fecha_entrega_esperada,
      estado: orden.estado,
      subtotal: parseFloat(orden.subtotal) || 0,
      impuestos: parseFloat(orden.impuestos) || 0,
      total: parseFloat(orden.total) || 0,
      moneda: orden.moneda,
      terminos_pago: orden.terminos_pago,
      observaciones: orden.observaciones,
      creado_por: orden.creado_por,
      fecha_creacion: orden.fecha_creacion,
      fecha_actualizacion: orden.fecha_actualizacion,
      // Mapear información del proveedor si está disponible
      proveedor: orden.nombre_proveedor ? {
        id: orden.id_proveedor,
        nombre: orden.nombre_proveedor,
        contacto: orden.contacto_proveedor
      } : undefined,
      // Mapear detalles si existen
      detalles: orden.detalles || []
    };
    
    console.log('✅ Mapped new order:', mappedOrden);
    return mappedOrden;
  },

  // Actualizar orden
  update: async (id: number, data: Partial<OrdenCompra>): Promise<void> => {
    const response: AxiosResponse<ApiResponse> = await api.put(`/ordenes-compra/${id}`, data);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al actualizar orden de compra');
    }
  },

  // Eliminar orden
  delete: async (id: number): Promise<void> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/ordenes-compra/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al eliminar orden de compra');
    }
  },

  // Agregar detalle a orden
  addDetalle: async (idOrden: number, detalle: CreateDetalleOrdenData): Promise<DetalleOrden> => {
    const response: AxiosResponse<ApiResponse<{ id_detalle: number }>> = await api.post(
      `/ordenes-compra/${idOrden}/detalles`,
      detalle
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Error al agregar detalle');
    }
    // Simular retorno del detalle completo
    return { ...detalle, id_detalle: response.data.data.id_detalle, id_orden_compra: idOrden };
  },

  // Actualizar detalle
  updateDetalle: async (idDetalle: number, data: Partial<CreateDetalleOrdenData>): Promise<void> => {
    const response: AxiosResponse<ApiResponse> = await api.put(`/ordenes-compra/detalles/${idDetalle}`, data);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al actualizar detalle');
    }
  },

  // Eliminar detalle
  deleteDetalle: async (idDetalle: number): Promise<void> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/ordenes-compra/detalles/${idDetalle}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al eliminar detalle');
    }
  },
};

// Servicio para Health Check
export const healthApi = {
  check: async (): Promise<{ status: string; database: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Mock API para productos (ya que vienen de API externa)
export const productosApi = {
  // Simular búsqueda de productos
  search: async (query: string): Promise<Producto[]> => {
    // En un entorno real, esto sería una llamada a tu API de productos
    const mockProductos: Producto[] = [
      {
        id_producto: 101,
        nombre: 'Laptop Dell Inspiron',
        codigo: 'DELL-INSP-001',
        descripcion: 'Laptop para uso empresarial',
        categoria: 'Tecnología',
        precio_referencia: 15000,
        disponible: true,
      },
      {
        id_producto: 102,
        nombre: 'Mouse Inalámbrico',
        codigo: 'MOUSE-WIREL-001',
        descripcion: 'Mouse inalámbrico para oficina',
        categoria: 'Tecnología',
        precio_referencia: 250,
        disponible: true,
      },
      {
        id_producto: 103,
        nombre: 'Silla Ejecutiva',
        codigo: 'SILLA-EJEC-001',
        descripcion: 'Silla ergonómica para oficina',
        categoria: 'Mobiliario',
        precio_referencia: 3500,
        disponible: true,
      },
      {
        id_producto: 104,
        nombre: 'Impresora HP LaserJet',
        codigo: 'HP-LASER-001',
        descripcion: 'Impresora láser monocromática',
        categoria: 'Tecnología',
        precio_referencia: 5500,
        disponible: false,
      },
    ];

    return mockProductos.filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(query.toLowerCase()) ||
        producto.codigo.toLowerCase().includes(query.toLowerCase())
    );
  },

  // Obtener producto por ID
  getById: async (id: number): Promise<Producto | null> => {
    const productos = await productosApi.search('');
    return productos.find((p) => p.id_producto === id) || null;
  },
};

export default api;