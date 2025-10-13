'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MapPin, X, Filter } from 'lucide-react';

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

interface LocationSearchProps {
  onLocationSelect?: (location: Location) => void;
  onSearchResults?: (results: Location[]) => void;
  className?: string;
}

export default function LocationSearch({ 
  onLocationSelect, 
  onSearchResults, 
  className = '' 
}: LocationSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [allLocations, setAllLocations] = useState<Location[]>([]);

  // Buscar todos os locais na inicialização
  useEffect(() => {
    const fetchAllLocations = async () => {
      try {
        const response = await fetch('/api/locations');
        const data = await response.json();
        
        if (data.success) {
          setAllLocations(data.data);
        }
      } catch (error) {
        console.error('Erro ao buscar locais:', error);
      }
    };

    fetchAllLocations();
  }, []);

  // Busca em tempo real
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
      if (onSearchResults) {
        onSearchResults(allLocations);
      }
      return;
    }

    const searchLocations = async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/locations?search=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        
        if (data.success) {
          setSearchResults(data.data);
          setShowResults(true);
          if (onSearchResults) {
            onSearchResults(data.data);
          }
        }
      } catch (error) {
        console.error('Erro na busca:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchLocations, 300); // Debounce de 300ms
    return () => clearTimeout(timeoutId);
  }, [searchTerm, onSearchResults, allLocations]);

  const handleLocationClick = (location: Location) => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
    setShowResults(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    if (onSearchResults) {
      onSearchResults(allLocations);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Campo de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar locais por nome, descrição ou endereço..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Resultados da busca */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 search-dropdown mt-2 max-h-96 overflow-y-auto shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Resultados da busca
              {isSearching && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {searchResults.length === 0 ? (
              <div className="text-center py-4">
                <MapPin className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  {isSearching ? 'Buscando...' : 'Nenhum local encontrado'}
                </p>
                {!isSearching && (
                  <p className="text-xs text-gray-400 mt-1">
                    Tente usar outros termos de busca
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((location) => (
                  <div
                    key={location.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleLocationClick(location)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-foreground mb-1">
                          {location.name}
                        </h4>
                        {location.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {location.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mb-2">
                          {location.address}
                        </p>
                        <div className="flex items-center gap-2">
                          {location.category && (
                            <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                              {location.category}
                            </span>
                          )}
                          {location.created_by_name && (
                            <span className="text-xs text-muted-foreground">
                              por {location.created_by_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <MapPin className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
