'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@/styles/leaflet.css';
import { Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Fix para ícones do Leaflet
delete (Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Criar ícones personalizados modernos e elegantes
const createCustomIcon = (color: string, iconType: 'user' | 'location') => {
  const isUser = iconType === 'user';
  const iconColor = isUser ? '#3b82f6' : '#10b981';
  const shadowColor = isUser ? 'rgba(59, 130, 246, 0.4)' : 'rgba(16, 185, 129, 0.4)';
  
  // SVG moderno com gradiente e sombra
  const svgString = `
    <svg width="36" height="45" viewBox="0 0 36 45" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-${iconType}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="${shadowColor}"/>
        </filter>
        <linearGradient id="gradient-${iconType}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color}dd;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Sombra do pin -->
      <ellipse cx="18" cy="42" rx="6" ry="2" fill="rgba(0,0,0,0.2)" opacity="0.3"/>
      
      <!-- Corpo principal do pin -->
      <path d="M18 2 C26 2, 34 10, 34 18 C34 26, 18 43, 18 43 C18 43, 2 26, 2 18 C2 10, 10 2, 18 2 Z" 
            fill="url(#gradient-${iconType})" 
            stroke="white" 
            stroke-width="2" 
            filter="url(#shadow-${iconType})"/>
      
      <!-- Círculo interno -->
      <circle cx="18" cy="18" r="10" fill="white" opacity="0.9"/>
      
      <!-- Ícone interno -->
      <g transform="translate(18, 18)">
        ${isUser ? `
          <!-- Ícone de usuário -->
          <circle cx="0" cy="-2" r="3" fill="${iconColor}"/>
          <path d="M-4,2 Q0,-2 4,2 L4,4 Q0,0 -4,4 Z" fill="${iconColor}"/>
        ` : `
          <!-- Ícone de localização -->
          <circle cx="0" cy="0" r="4" fill="${iconColor}" opacity="0.8"/>
          <circle cx="0" cy="0" r="2" fill="white"/>
        `}
      </g>
    </svg>
  `;

  return new Icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`,
    iconSize: [36, 45],
    iconAnchor: [18, 45],
    popupAnchor: [0, -45],
  });
};

// Ícones personalizados
const userLocationIcon = createCustomIcon('#3b82f6', 'user'); // Azul para usuário
const locationIcon = createCustomIcon('#10b981', 'location'); // Verde para locais

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

interface LocationMapProps {
  locations: Location[];
  onLocationClick?: (location: Location) => void;
  onMapDoubleClick?: (lat: number, lng: number) => void;
  className?: string;
}

// Componente para centralizar o mapa na localização do usuário
function UserLocationCenter({ userPosition }: { userPosition: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (userPosition) {
      map.setView(userPosition, 13);
    }
  }, [map, userPosition]);

  return null;
}

// Componente para controlar a centralização programática
function MapController({ 
  centerOnUser, 
  userPosition 
}: { 
  centerOnUser: boolean; 
  userPosition: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (centerOnUser && userPosition) {
      map.setView(userPosition, 15);
    }
  }, [map, centerOnUser, userPosition]);

  return null;
}

// Componente para capturar duplo clique no mapa
function MapDoubleClickHandler({ 
  onDoubleClick 
}: { 
  onDoubleClick: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const handleDoubleClick = (e: { latlng: { lat: number; lng: number } }) => {
      const { lat, lng } = e.latlng;
      onDoubleClick(lat, lng);
    };

    map.on('dblclick', handleDoubleClick);

    return () => {
      map.off('dblclick', handleDoubleClick);
    };
  }, [map, onDoubleClick]);

  return null;
}

// Componente para centralizar o mapa nos locais
function LocationsCenter({ locations }: { locations: Location[] }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = locations.map(loc => [loc.latitude, loc.longitude] as [number, number]);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, locations]);

  return null;
}

export default function LocationMap({ locations, onLocationClick, onMapDoubleClick, className = '' }: LocationMapProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [centerOnUser, setCenterOnUser] = useState(false);

  // Obter localização do usuário
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition([position.coords.latitude, position.coords.longitude]);
          setIsLoading(false);
        },
        (error) => {
          console.warn('Erro ao obter localização:', error);
          // Se não conseguir obter a localização, usar Brasília como padrão
          setUserPosition([-15.7942, -47.8817]);
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      // Fallback para Brasília se geolocalização não estiver disponível
      setUserPosition([-15.7942, -47.8817]);
      setIsLoading(false);
    }
  }, []);

  const handleLocationClick = (location: Location) => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  };

  const handleMapDoubleClick = (lat: number, lng: number) => {
    if (onMapDoubleClick) {
      onMapDoubleClick(lat, lng);
    }
  };

  const centerOnUserLocation = () => {
    if (userPosition) {
      setCenterOnUser(true);
      // Reset após um pequeno delay para permitir nova centralização
      setTimeout(() => setCenterOnUser(false), 100);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-4 right-4 z-[1000] flex gap-2">
        <Button
          onClick={centerOnUserLocation}
          size="sm"
          variant="outline"
          className="bg-white shadow-md"
        >
          <Navigation className="h-4 w-4 mr-1" />
          Minha Localização
        </Button>
      </div>

      {/* Dica sobre duplo clique */}
      {onMapDoubleClick && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border">
          <p className="text-xs text-gray-600">
            💡 <strong>Dica:</strong> Clique duas vezes no mapa para adicionar um local
          </p>
        </div>
      )}

      <MapContainer
        center={userPosition || [-15.7942, -47.8817]}
        zoom={13}
        className="h-full w-full rounded-lg shadow-sm"
        style={{ height: '500px', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          minZoom={3}
        />

        {/* Centralizar na localização do usuário por padrão */}
        <UserLocationCenter userPosition={userPosition} />

        {/* Se não houver localização do usuário, centralizar nos locais */}
        {!userPosition && <LocationsCenter locations={locations} />}

        {/* Controlador para centralização programática */}
        <MapController centerOnUser={centerOnUser} userPosition={userPosition} />

        {/* Handler para duplo clique no mapa */}
        <MapDoubleClickHandler onDoubleClick={handleMapDoubleClick} />

        {/* Marcar localização do usuário */}
        {userPosition && (
          <Marker position={userPosition} icon={userLocationIcon}>
            <Popup className="custom-popup">
              <div className="text-center p-2">
                <p className="font-medium text-sm text-blue-600">👤 Sua localização</p>
                <p className="text-xs text-gray-500">
                  {userPosition[0].toFixed(6)}, {userPosition[1].toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcar locais cadastrados */}
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={locationIcon}
          >
            <Popup 
              className="custom-popup" 
              maxWidth={250}
            >
              <div className="p-3">
                <h3 className="font-semibold text-base mb-2 text-gray-900">📍 {location.name}</h3>
                {location.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{location.description}</p>
                )}
                <p className="text-xs text-gray-500 mb-3">
                  {location.address}
                </p>
                <div className="flex items-center justify-between">
                  {location.category && (
                    <span className="inline-block bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md">
                      {location.category}
                    </span>
                  )}
                  <button
                    className="ml-2 text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLocationClick(location);
                    }}
                  >
                    Ver Detalhes
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  💡 Clique no botão para ver detalhes
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
