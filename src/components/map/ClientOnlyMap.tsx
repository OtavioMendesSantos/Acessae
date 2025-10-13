'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Importar o LocationMap dinamicamente sem SSR
const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Carregando mapa...</p>
      </div>
    </div>
  ),
});

interface Location {
  id: number;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  created_by_name?: string;
}

interface ClientOnlyMapProps {
  locations: Location[];
  onLocationClick?: (location: Location) => void;
  onMapDoubleClick?: (lat: number, lng: number) => void;
  className?: string;
}

export default function ClientOnlyMap({ locations, onLocationClick, onMapDoubleClick, className }: ClientOnlyMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <LocationMap
      locations={locations}
      onLocationClick={onLocationClick}
      onMapDoubleClick={onMapDoubleClick}
      className={className}
    />
  );
}
