'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@/styles/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Fix para ícones do Leaflet
delete (Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Criar ícones personalizados modernos e elegantes
const createCustomIcon = (color: string, iconType: 'selected' | 'user') => {
  const isSelected = iconType === 'selected';
  const iconColor = isSelected ? '#ef4444' : '#3b82f6';
  const shadowColor = isSelected ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)';
  
  // SVG moderno com gradiente e sombra
  const svgString = `
    <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-${iconType}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="${shadowColor}"/>
        </filter>
        <linearGradient id="gradient-${iconType}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color}dd;stop-opacity:1" />
        </linearGradient>
        <filter id="glow-${iconType}">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Sombra do pin -->
      <ellipse cx="20" cy="45" rx="8" ry="3" fill="rgba(0,0,0,0.2)" opacity="0.3"/>
      
      <!-- Corpo principal do pin -->
      <path d="M20 2 C30 2, 38 10, 38 20 C38 30, 20 48, 20 48 C20 48, 2 30, 2 20 C2 10, 10 2, 20 2 Z" 
            fill="url(#gradient-${iconType})" 
            stroke="white" 
            stroke-width="2" 
            filter="url(#shadow-${iconType})"/>
      
      <!-- Círculo interno -->
      <circle cx="20" cy="20" r="12" fill="white" opacity="0.9"/>
      
      <!-- Ícone interno -->
      <g transform="translate(20, 20)">
        ${isSelected ? `
          <circle cx="0" cy="0" r="6" fill="${iconColor}" opacity="0.8"/>
          <circle cx="0" cy="0" r="3" fill="white"/>
        ` : `
          <circle cx="0" cy="-2" r="3" fill="${iconColor}"/>
          <path d="M-4,2 Q0,-2 4,2 L4,4 Q0,0 -4,4 Z" fill="${iconColor}"/>
        `}
      </g>
    </svg>
  `;

  return new Icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
  });
};

// Ícones personalizados
const selectedLocationIcon = createCustomIcon('#ef4444', 'selected'); // Vermelho
const userLocationIcon = createCustomIcon('#3b82f6', 'user'); // Azul

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  className?: string;
}

// Componente para centralizar o mapa na posição inicial
function InitialCenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], 13);
  }, [map, lat, lng]);

  return null;
}

// Componente para capturar cliques no mapa
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const handleClick = (e: { latlng: { lat: number; lng: number } }) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map, onLocationSelect]);

  return null;
}

export default function LocationPicker({ 
  initialLat, 
  initialLng, 
  onLocationSelect, 
  className = '' 
}: LocationPickerProps) {
  // Valores padrão para São Paulo
  const defaultLat = -23.5505;
  const defaultLng = -46.6333;
  
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([
    initialLat ?? defaultLat, 
    initialLng ?? defaultLng
  ]);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    initialLat ?? defaultLat, 
    initialLng ?? defaultLng
  ]);

  // Obter localização do usuário e centralizar o mapa
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setUserPosition([userLat, userLng]);
          
          // Se não há coordenadas iniciais, centralizar na localização do usuário
          if (initialLat === undefined || initialLng === undefined) {
            setMapCenter([userLat, userLng]);
            setSelectedPosition([userLat, userLng]);
            onLocationSelect(userLat, userLng);
          }
          
          setIsLoading(false);
        },
        (error) => {
          console.warn('Erro ao obter localização:', error);
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      setIsLoading(false);
    }
  }, [initialLat, initialLng, onLocationSelect]);

  const handleMapClick = (lat: number, lng: number) => {
    const newPosition: [number, number] = [lat, lng];
    setSelectedPosition(newPosition);
    onLocationSelect(lat, lng);
  };

  const handleUseCurrentLocation = () => {
    if (userPosition) {
      setSelectedPosition(userPosition);
      onLocationSelect(userPosition[0], userPosition[1]);
    }
  };

  if (isLoading) {
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
    <div className={`relative ${className}`}>
      {/* Controles */}
      <div className="absolute top-2 right-2 z-[1000] flex gap-2">
        {userPosition && (
          <Button
            onClick={handleUseCurrentLocation}
            size="sm"
            variant="outline"
            className="bg-white shadow-md text-xs"
          >
            <Navigation className="h-3 w-3 mr-1" />
            Minha Localização
          </Button>
        )}
      </div>

      {/* Instrução */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border">
        <p className="text-xs text-gray-600">
          📍 <strong>Clique no mapa</strong> para selecionar a localização
        </p>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={13}
        className="h-full w-full rounded-lg"
        style={{ height: '300px', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          minZoom={3}
        />

        {/* Centralizar na posição inicial */}
        <InitialCenter lat={mapCenter[0]} lng={mapCenter[1]} />

        {/* Handler para cliques no mapa */}
        <MapClickHandler onLocationSelect={handleMapClick} />

        {/* Marcar localização selecionada */}
        <Marker position={selectedPosition} icon={selectedLocationIcon}>
          <div className="text-center p-2">
            <p className="font-semibold text-sm text-red-600">📍 Local Selecionado</p>
            <p className="text-xs text-gray-500">
              {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
            </p>
          </div>
        </Marker>

        {/* Marcar localização do usuário se disponível */}
        {userPosition && (
          <Marker position={userPosition} icon={userLocationIcon}>
            <div className="text-center p-2">
              <p className="font-semibold text-sm text-blue-600">👤 Sua Localização</p>
              <p className="text-xs text-gray-500">
                {userPosition[0].toFixed(6)}, {userPosition[1].toFixed(6)}
              </p>
            </div>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
