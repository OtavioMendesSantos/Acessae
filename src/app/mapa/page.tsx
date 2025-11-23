'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientOnlyMap from '@/components/map/ClientOnlyMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Filter, Plus } from 'lucide-react';
import LocationSearch from '@/components/search/LocationSearch';

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

export default function MapaPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const router = useRouter();

  // Buscar locais da API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations');
        const data = await response.json();

        if (data.success) {
          setLocations(data.data);
          setFilteredLocations(data.data);
        } else {
          setError('Erro ao carregar locais');
        }
      } catch (err) {
        console.error('Erro ao buscar locais:', err);
        setError('Erro ao carregar locais');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Filtrar locais por categoria e busca
  useEffect(() => {
    const baseLocations = isSearchActive ? searchResults : locations;
    
    if (selectedCategory === '') {
      setFilteredLocations(baseLocations);
    } else {
      setFilteredLocations(baseLocations.filter(loc => loc.category === selectedCategory));
    }
  }, [selectedCategory, locations, searchResults, isSearchActive]);

  // Obter categorias únicas
  const categories = Array.from(new Set(locations.map(loc => loc.category).filter(Boolean)));

  const handleLocationClick = (location: Location) => {
    // Navegar para a página de detalhes do local (RF07)
    router.push(`/local/${location.id}`);
  };

  const handleMapDoubleClick = (lat: number, lng: number) => {
    // Navegar para página de cadastro com coordenadas pré-preenchidas
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString()
    });
    router.push(`/local/novo?${params.toString()}`);
  };

  const handleAddLocation = () => {
    // Navegar para página de cadastro de local
    router.push('/local/novo');
  };

  const handleSearchResults = (results: Location[]) => {
    setSearchResults(results);
    setIsSearchActive(results.length > 0);
  };

  const handleSearchLocationSelect = (location: Location) => {
    // Navegar para a página de detalhes do local
    router.push(`/local/${location.id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Carregando mapa...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                Mapa de Locais
              </h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Explore os locais cadastrados no sistema
              </p>
            </div>
            
            {/* Campo de busca no header */}
            <div className="w-full lg:w-96">
              <LocationSearch
                onLocationSelect={handleSearchLocationSelect}
                onSearchResults={handleSearchResults}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-[calc(100vh-200px)]">
          {/* Sidebar - Painel de controles */}
          <div className="xl:col-span-1 space-y-4 overflow-y-auto">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filtro por categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Todas as categorias</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estatísticas */}
                <div className="pt-3 border-t">
                  <h3 className="font-semibold text-foreground mb-3 text-sm">Estatísticas</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Total:</span>
                      <span className="font-semibold text-secondary bg-secondary/10 px-2 py-1 rounded-full text-xs">
                        {locations.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Exibindo:</span>
                      <span className="font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full text-xs">
                        {filteredLocations.length}
                      </span>
                    </div>
                    {isSearchActive && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Busca:</span>
                        <span className="font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full text-xs">
                          {searchResults.length}
                        </span>
                      </div>
                    )}
                    {selectedCategory && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Categoria:</span>
                        <span className="font-medium text-primary bg-primary/10 px-2 py-1 rounded-full text-xs">
                          {selectedCategory}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botão para adicionar local */}
                <Button
                  onClick={handleAddLocation}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Local
                </Button>
              </CardContent>
            </Card>

            {/* Lista de locais */}
            {filteredLocations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5" />
                    Locais ({filteredLocations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {filteredLocations.map((location) => (
                      <div
                        key={location.id}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleLocationClick(location)}
                      >
                        <h4 className="font-semibold text-sm mb-1">{location.name}</h4>
                        {location.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {location.description}
                          </p>
                        )}
                        {location.category && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {location.category}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Mapa - Área principal */}
          <div className="xl:col-span-4 relative z-0">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <ClientOnlyMap
                  locations={filteredLocations}
                  onLocationClick={handleLocationClick}
                  onMapDoubleClick={handleMapDoubleClick}
                  className="rounded-lg h-full"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
