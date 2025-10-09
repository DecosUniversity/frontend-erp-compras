import { useState, useEffect } from 'react';
import api from '@/services/api';
import { OrdenCompra, CreateOrdenCompraData } from '@/types';

export const useOrdenesCompra = () => {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrdenes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/ordenes-compra');
      setOrdenes(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar órdenes');
      console.error('Error fetching ordenes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrden = async (id: number) => {
    try {
      const response = await api.get(`/ordenes-compra/${id}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar orden');
      throw err;
    }
  };

  const createOrden = async (data: CreateOrdenCompraData) => {
    try {
      const response = await api.post('/ordenes-compra', data);
      setOrdenes(prev => [...prev, response.data]);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear orden');
      throw err;
    }
  };

  const updateOrden = async (id: number, data: Partial<CreateOrdenCompraData>) => {
    try {
      const response = await api.put(`/ordenes-compra/${id}`, data);
      setOrdenes(prev => 
        prev.map(o => o.id === id ? { ...o, ...response.data } : o)
      );
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar orden');
      throw err;
    }
  };

  useEffect(() => {
    fetchOrdenes();
  }, []);

  return {
    ordenes,
    loading,
    error,
    fetchOrden,
    createOrden,
    updateOrden,
    refetch: fetchOrdenes
  };
};