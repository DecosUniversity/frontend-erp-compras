// Tipos para crear proveedor en CRM
export interface CrmProveedorPayload {
  name: string;
  email: string;
  phone: string;
  nit: number;
  contactoPrincipal?: string;
  contacto?: {
    primerNombre?: string;
    segundoNombre?: string;
    primerApellido?: string;
    segundoApellido?: string;
    dpi?: number;
    direccion?: string;
    telefono?: string;
    correo?: string;
    fecha_Nacimiento?: string;
  };
}
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

// Cliente CRM externo (directo) con autenticación por login
const CRM_BASE_URL = import.meta.env.VITE_CRM_API_URL || '';
const CRM_EMAIL = import.meta.env.VITE_CRM_EMAIL || '';
const CRM_PASSWORD = import.meta.env.VITE_CRM_PASSWORD || '';

const crmClient = axios.create({
  baseURL: CRM_BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Manejo simple de token en memoria (opcionalmente podríamos usar localStorage)
let crmToken: string | null = null;
let crmTokenExpiry: number | null = null; // epoch ms

const parseCrmTokenFromResponse = (data: any): string | null => {
  if (!data) return null;
  return (
    data.token ||
    data.access_token ||
    data.accessToken ||
    data?.data?.token ||
    data?.jwt ||
    null
  );
};

const parseCrmExpiresInSeconds = (data: any): number | null => {
  const v = data?.expires_in || data?.expiresIn || data?.data?.expires_in;
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const crmLogin = async (): Promise<string> => {
  if (!CRM_BASE_URL) throw new Error('VITE_CRM_API_URL no configurada');
  if (!CRM_EMAIL || !CRM_PASSWORD) throw new Error('VITE_CRM_EMAIL/VITE_CRM_PASSWORD no configuradas');
  const url = '/api/Auth/Login';
  const payload: any = { email: CRM_EMAIL, password: CRM_PASSWORD };
  try {
    const resp = await axios.post(CRM_BASE_URL + url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 12000,
    });
    const token = parseCrmTokenFromResponse(resp.data);
    if (!token) throw new Error('Login CRM sin token en la respuesta');
    const expiresIn = parseCrmExpiresInSeconds(resp.data);
    const ttlMs = expiresIn ? expiresIn * 1000 : (6 * 60 - 10) * 60 * 1000; // ~6h menos 10m por seguridad
    crmToken = token;
    crmTokenExpiry = Date.now() + ttlMs;
    return token;
  } catch (e: any) {
    console.error('CRM Login error:', e?.response?.data || e?.message);
    throw new Error('No fue posible autenticar contra el CRM');
  }
};

const isCrmTokenValid = () => !!crmToken && !!crmTokenExpiry && Date.now() < (crmTokenExpiry as number);

const getCrmToken = async (): Promise<string> => {
  if (isCrmTokenValid()) return crmToken as string;
  return crmLogin();
};

// Interceptor para adjuntar Authorization dinámicamente
crmClient.interceptors.request.use(async (config) => {
  const token = await getCrmToken();
  config.headers = config.headers || {};
  (config.headers as any).Authorization = `Bearer ${token}`;
  return config;
});

// Helper para normalizar estados desde el backend (por ejemplo 'pendiente' -> 'PENDIENTE')
const normalizeEstado = (
  estado: any
): 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'ENTREGADA' => {
  if (estado === null || estado === undefined) return 'PENDIENTE';
  const s = String(estado).trim().toUpperCase().replace(/\s+/g, '_');
  switch (s) {
    case 'PENDIENTE':
      return 'PENDIENTE';
    case 'APROBADA':
      return 'APROBADA';
    case 'RECHAZADA':
    case 'CANCELADA':
      return 'RECHAZADA';
    case 'ENTREGADA':
    case 'RECIBIDA':
    case 'COMPLETA':
    case 'COMPLETADA':
      return 'ENTREGADA';
    case 'EN_PROCESO':
    case 'EN PROCESO':
      // Opcional: tratar 'En proceso' como aprobada a efectos de UI
      return 'APROBADA';
    default:
      return 'PENDIENTE';
  }
};

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
  nit: proveedor.nit,
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
  nit: response.data.nit,
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
  nit: response.data.nit,
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

// Servicio CRM (prospectos)
export const crmApi = {
  // Obtiene contactos de tipo Prospecto desde /api/ContactoTipo/Prospecto
  getProspectos: async (params?: { page?: number; limit?: number; search?: string }) => {
    if (!CRM_BASE_URL) throw new Error('VITE_CRM_API_URL no configurada');
    // Asegura token (el interceptor lo adjunta)
    await getCrmToken();
    const endpoint = '/api/ContactoTipo/Prospecto';
    const response = await crmClient.get(endpoint);
    const raw = (response.data?.data || response.data || []) as any[];

    // Normalización flexible de campos
    const list = raw.map((c: any) => {
      const nombre = c.nombre || c.name || c.nombreCompleto || [c.nombres, c.apellidos].filter(Boolean).join(' ').trim();
      return {
        id: c.id || c.contacto_id || c.contactoId,
        nombre,
        email: c.email || c.correo,
        telefono: c.telefono || c.celular || c.telefono1,
        direccion: c.direccion || c.domicilio || c.direccionPrincipal,
        ciudad: c.ciudad || c.municipio,
        pais: c.pais || c.paisResidencia,
      };
    }).filter((c) => !!c.nombre);

    // Filtro por búsqueda en cliente (si el CRM no soporta q)
    const q = (params?.search || '').toLowerCase();
    const filtered = q ? list.filter((c) => (c.nombre?.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q))) : list;

    // Paginación simple en cliente si se pide limit
    const limit = params?.limit && params.limit > 0 ? params.limit : undefined;
    return limit ? filtered.slice(0, limit) : filtered;
  },

  // Crear proveedor en CRM
  createProveedor: async (payload: CrmProveedorPayload) => {
    if (!CRM_BASE_URL) throw new Error('VITE_CRM_API_URL no configurada');
    await getCrmToken();
    const endpoint = '/api/Proveedor';
    const response = await crmClient.post(endpoint, payload);
    return response.data;
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
      // Normalizar 'estado' para que la UI compare con valores en mayúsculas
      estado: normalizeEstado(orden.estado),
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
        estado: normalizeEstado(orden.estado),
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
      estado: normalizeEstado(orden.estado),
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

  // Actualizar solo el estado de una orden
  updateEstado: async (id: number, estado: OrdenCompra['estado']): Promise<{ id: number; estado: OrdenCompra['estado'] }> => {
    const response: AxiosResponse<ApiResponse<{ id: number; estado: OrdenCompra['estado'] }>> = await api.put(`/ordenes-compra/${id}/estado`, { estado });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Error al actualizar estado de la orden');
    }
    return response.data.data;
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
    const createdId = response.data.data.id_detalle;
    const cantidad = detalle.cantidad || 0;
    const precio = detalle.precio_unitario || 0;
    const descuento = detalle.descuento || 0;
    const subtotal = cantidad * precio * (1 - (descuento / 100));

    return {
      id: createdId,
      id_detalle: createdId,
      orden_compra_id: idOrden,
      id_orden_compra: idOrden,
      producto_id: detalle.id_producto,
      cantidad,
      precio_unitario: precio,
      descuento,
      subtotal,
      impuestos: 0,
      total: subtotal,
      descripcion_producto: detalle.descripcion_producto,
      numero_linea: detalle.numero_linea || 1,
    };
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
      { id: 101, id_producto: 101, nombre: 'Laptop Dell Inspiron', codigo: 'DELL-INSP-001', descripcion: 'Laptop para uso empresarial', precio: 15000 },
      { id: 102, id_producto: 102, nombre: 'Mouse Inalámbrico', codigo: 'MOUSE-WIREL-001', descripcion: 'Mouse inalámbrico para oficina', precio: 250 },
      { id: 201, id_producto: 201, nombre: 'Escritorio Oficina', codigo: 'DESK-001', descripcion: 'Escritorio de madera', precio: 1200 },
      { id: 301, id_producto: 301, nombre: 'Monitor Samsung 24"', codigo: 'MON-SAM-24', descripcion: 'Monitor Full HD', precio: 2000 },
    ];

    const q = query.toLowerCase();
    return mockProductos.filter((producto) => {
      const codigo = (producto.codigo || '').toLowerCase();
      return producto.nombre.toLowerCase().includes(q) || codigo.includes(q);
    });
  },

  // Obtener producto por ID
  getById: async (id: number): Promise<Producto | null> => {
    const productos = await productosApi.search('');
    return productos.find((p) => p.id === id || p.id_producto === id) || null;
  },
};

// Servicio de Inventario externo (ajustes de stock)
const INVENTORY_BASE_URL = import.meta.env.VITE_INVENTORY_API_URL || 'https://api-inventario.up.railway.app';
const inventoryClient = axios.create({
  baseURL: INVENTORY_BASE_URL,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

export const inventoryApi = {
  // Ajusta el inventario (cantidad positiva para aumentar, negativa para disminuir)
  adjust: async (payload: {
    id_producto: number;
    id_ubicacion?: number;
    cantidad: number;
    motivo: string;
    usuario?: string;
  }) => {
    const body = {
      id_producto: payload.id_producto,
      id_ubicacion: payload.id_ubicacion ?? Number(import.meta.env.VITE_INVENTORY_LOCATION_ID || 1),
      cantidad: payload.cantidad,
      motivo: payload.motivo || 'Ajuste de inventario',
      usuario: payload.usuario || (import.meta.env.VITE_INVENTORY_USER || 'ERP-Compras'),
    };
    const resp = await inventoryClient.post('/api/inventory/adjust', body);
    return resp.data;
  },
};

// Servicio de Tareas externo (creación de tareas)
const TAREAS_BASE_URL = import.meta.env.VITE_TAREAS_API_URL || 'https://exclousit.up.railway.app';
const tareasClient = axios.create({
  baseURL: TAREAS_BASE_URL,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

export const tareasApi = {
  create: async (payload: {
    titulo: string;
    descripcion?: string;
    fecha_limite?: string; // 'YYYY-MM-DD HH:mm:ss'
    estado?: string;
    prioridad?: string;
    asignado_a?: string | number;
  }) => {
    const resp = await tareasClient.post('/api/tareas', payload);
    return resp.data;
  },
};

export default api;