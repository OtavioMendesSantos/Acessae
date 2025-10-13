'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Importar o LocationPicker dinamicamente sem SSR
const LocationPicker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Carregando mapa...</p>
      </div>
    </div>
  ),
});

interface ClientOnlyLocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  className?: string;
}

export default function ClientOnlyLocationPicker({ 
  initialLat, 
  initialLng, 
  onLocationSelect, 
  className 
}: ClientOnlyLocationPickerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <LocationPicker
      initialLat={initialLat}
      initialLng={initialLng}
      onLocationSelect={onLocationSelect}
      className={className}
    />
  );
}

