import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Proveedores from '@/pages/Proveedores';
import OrdenesCompra from '@/pages/OrdenesCompra';
import OrdenDetalle from '@/pages/OrdenDetalle';
import CrearOrden from '@/pages/CrearOrden';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/ordenes-compra" element={<OrdenesCompra />} />
          <Route path="/ordenes-compra/nueva" element={<CrearOrden />} />
          <Route path="/ordenes-compra/:id" element={<OrdenDetalle />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;