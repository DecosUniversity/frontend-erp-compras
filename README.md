# Frontend - Sistema ERP de Órdenes de Compra

Frontend desarrollado en React + TypeScript para consumir la API de órdenes de compra.

## 🚀 Tecnologías Utilizadas

- **React 18** - Biblioteca de JavaScript para interfaces de usuario
- **TypeScript** - Superset tipado de JavaScript
- **Vite** - Herramienta de construcción y desarrollo
- **Tailwind CSS** - Framework CSS utilitario
- **React Router DOM** - Enrutamiento para aplicaciones React
- **Axios** - Cliente HTTP para llamadas a la API
- **React Hook Form** - Gestión de formularios
- **Heroicons** - Iconos SVG para React

## 📁 Estructura del Proyecto

```
Frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   └── Layout.tsx      # Layout principal con navegación
│   ├── pages/              # Páginas principales
│   │   ├── Dashboard.tsx   # Panel principal
│   │   ├── Proveedores.tsx # Gestión de proveedores
│   │   ├── OrdenesCompra.tsx # Lista de órdenes
│   │   ├── OrdenDetalle.tsx  # Detalle de orden
│   │   └── CrearOrden.tsx   # Crear nueva orden
│   ├── services/           # Servicios de API
│   │   └── api.ts         # Configuración de Axios y endpoints
│   ├── hooks/             # Hooks personalizados
│   │   ├── useProveedores.ts # Hook para proveedores
│   │   └── useOrdenesCompra.ts # Hook para órdenes
│   ├── types/             # Definiciones de TypeScript
│   │   └── index.ts       # Interfaces y tipos
│   ├── App.tsx            # Componente principal
│   ├── main.tsx           # Punto de entrada
│   └── index.css          # Estilos globales con Tailwind
├── public/                # Archivos estáticos
├── package.json           # Dependencias y scripts
├── vite.config.ts         # Configuración de Vite
├── tailwind.config.js     # Configuración de Tailwind
└── tsconfig.json          # Configuración de TypeScript
```

## 🛠️ Instalación y Configuración

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

3. **Construir para producción:**
   ```bash
   npm run build
   ```

## 🔗 Configuración de API

El frontend está configurado para conectarse a la API del backend y al CRM externo:

- Backend
   - URL de la API (prod): `https://erpcompras-production.up.railway.app/api`
   - Proxy configurado en `vite.config.ts` para desarrollo local
   - Puedes sobrescribir con `VITE_API_URL`

- CRM Externo (consumido directamente desde el frontend)
   - Configurar variables en `.env` (ver `.env.example`):
      - `VITE_CRM_API_URL` (requerido) – Base URL del CRM, por ejemplo `https://crm.tu-dominio.com/api`
      - `VITE_CRM_API_KEY` (opcional) – Token Bearer si el CRM lo requiere
      - `VITE_CRM_CONTACTS_PATH` (opcional) – Ruta del recurso de contactos, por defecto `/contactos`
   - El frontend solicitará contactos de tipo Prospecto pasando `tipo=PROSPECTO` y soporte para `q` (búsqueda), `page` y `limit` si están disponibles

## 📋 Funcionalidades

### Dashboard
- Resumen general del sistema
- Estadísticas de proveedores y órdenes
- Órdenes recientes
- Acceso rápido a funcionalidades principales

### Gestión de Proveedores
- ✅ Listar todos los proveedores
- ✅ Crear nuevo proveedor
- ✅ Editar proveedor existente
- ✅ Eliminar proveedor
- ✅ Crear proveedor desde contacto Prospecto del CRM (selección directa desde el frontend)

### Gestión de Órdenes de Compra
- ✅ Listar todas las órdenes
- ✅ Ver detalle completo de una orden
- ✅ Crear nueva orden con productos
- ✅ Filtros por estado
- ✅ Cálculo automático de totales

### Características Técnicas
- 🎨 **Interfaz moderna** con Tailwind CSS
- 📱 **Responsive design** adaptable a dispositivos móviles
- 🔍 **Navegación intuitiva** con React Router
- ⚡ **Carga rápida** con Vite
- 🛡️ **TypeScript** para seguridad de tipos
- 🔄 **Hooks personalizados** para gestión de estado
- 📡 **Llamadas HTTP optimizadas** con Axios

## 🎯 Próximas Mejoras

- [ ] Autenticación de usuarios
- [ ] Filtros avanzados en tablas
- [ ] Paginación de resultados
- [ ] Reportes en PDF/Excel
- [ ] Notificaciones en tiempo real
- [ ] Modo oscuro
- [ ] Tests unitarios y de integración

## 🌐 API Endpoints Utilizados

### Proveedores
- `GET /api/proveedores` - Obtener todos los proveedores
- `POST /api/proveedores` - Crear nuevo proveedor
- `PUT /api/proveedores/:id` - Actualizar proveedor
- `DELETE /api/proveedores/:id` - Eliminar proveedor

### Órdenes de Compra
- `GET /api/ordenes-compra` - Obtener todas las órdenes
- `GET /api/ordenes-compra/:id` - Obtener orden específica
- `POST /api/ordenes-compra` - Crear nueva orden

## 📖 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construcción para producción
- `npm run preview` - Vista previa de la construcción
- `npm run lint` - Análisis de código con ESLint

## 🤝 Contribución

Este proyecto forma parte del sistema ERP de órdenes de compra. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**Desarrollado como parte del proyecto de Análisis de Sistemas 2**