// Función para formatear números como moneda
export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) {
    return '0.00';
  }
  
  const numValue = typeof value === 'number' ? value : Number(value) || 0;
  return numValue.toFixed(2);
};

// Función para formatear fechas
export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

// Función para formatear fecha corta
export const formatDateShort = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('es-ES');
  } catch {
    return dateString;
  }
};