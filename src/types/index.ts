// Tipos para la API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Tipos para Proveedores
export interface Proveedor {
  id: number;
  nombre: string;
  nit?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  contacto?: string;
  ciudad?: string;
  pais?: string;
  estado?: string;
  fecha_registro?: string;
  creado_en?: string;
  actualizado_en?: string;
}

export interface CreateProveedorData {
  nombre: string;
  nit?: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  estado?: string;
}

// Tipos para Órdenes de Compra
export interface OrdenCompra {
  id: number;
  proveedor_id: number;
  fecha_orden: string;
  fecha_entrega_esperada?: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'ENTREGADA';
  subtotal?: number;
  impuestos?: number;
  total?: number;
  proveedor?: Proveedor;
  detalles?: DetalleOrden[];
  fecha_actualizacion?: string;
}

export interface DetalleOrden {
  id: number;
  id_detalle?: number; // Para compatibilidad con el backend
  orden_compra_id: number;
  id_orden_compra?: number; // Para compatibilidad con el backend
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
  subtotal: number;
  impuestos?: number;
  total?: number;
  descripcion_producto?: string;
  numero_linea?: number;
}

export interface DetalleOrdenInput {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
  descripcion_producto?: string;
}

export interface CreateDetalleOrdenData {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
  descripcion_producto?: string;
  numero_linea?: number;
}

export interface CreateOrdenCompraData {
  proveedor_id: number;
  fecha_entrega_esperada?: string;
  detalles: DetalleOrdenInput[];
}

// Agregar interfaz para productos
export interface Producto {
  id: number;
  id_producto?: number; // Para compatibilidad con el backend
  nombre: string;
  precio?: number;
  descripcion?: string;
  codigo?: string;
}

// Tipos para formularios
export interface ProveedorFormData {
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

// Tipos para estados de la aplicación
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// Tipos para notificaciones
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}