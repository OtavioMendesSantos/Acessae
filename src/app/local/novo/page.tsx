'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, MapPin, Save } from 'lucide-react';
import ClientOnlyLocationPicker from '@/components/map/ClientOnlyLocationPicker';

function NovoLocalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    category: ''
  });

  // Preencher coordenadas se vieram da URL (duplo clique no mapa)
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    
    if (lat && lng) {
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }));
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/locations/novo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          created_by: 1 // TODO: Pegar do usuário logado
        }),
      });

      const result = await response.json();

      if (response.ok) {
        router.push(`/local/${result.data.id}`);
      } else {
        setError(result.error || 'Erro ao criar local');
      }
    } catch (err) {
      console.error('Erro ao criar local:', err);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString()
    }));
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
        },
        (error) => {
          console.warn('Erro ao obter localização:', error);
          alert('Não foi possível obter sua localização');
        }
      );
    } else {
      alert('Geolocalização não é suportada neste navegador');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="mb-6">
        <Button
          onClick={() => router.push('/mapa')}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Mapa
        </Button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Adicionar Novo Local
        </h1>
        <p className="text-gray-600">
          Cadastre um novo local acessível no sistema
        </p>
        
        {/* Mensagem quando coordenadas vêm do duplo clique */}
        {searchParams.get('lat') && searchParams.get('lng') && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              📍 <strong>Coordenadas detectadas!</strong> As coordenadas foram preenchidas automaticamente baseadas no local onde você clicou no mapa.
            </p>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Informações do Local
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome do local */}
              <div>
                <Label htmlFor="name">Nome do Local *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Parque Ibirapuera"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Descrição */}
              <div>
                <Label htmlFor="description">Descrição</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descreva o local e suas características de acessibilidade..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              {/* Endereço */}
              <div>
                <Label htmlFor="address">Endereço *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Ex: Av. Pedro Álvares Cabral - Vila Mariana, São Paulo - SP"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Categoria */}
              <div>
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="Parque">Parque</option>
                  <option value="Museu">Museu</option>
                  <option value="Estação">Estação</option>
                  <option value="Mercado">Mercado</option>
                  <option value="Restaurante">Restaurante</option>
                  <option value="Hospital">Hospital</option>
                  <option value="Escola">Escola</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {/* Seleção de Localização */}
              <div>
                <Label>Localização no Mapa *</Label>
                <div className="mt-2">
                  <ClientOnlyLocationPicker
                    initialLat={formData.latitude ? parseFloat(formData.latitude) : undefined}
                    initialLng={formData.longitude ? parseFloat(formData.longitude) : undefined}
                    onLocationSelect={handleLocationSelect}
                    className="w-full"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  O mapa será centralizado automaticamente na sua localização. Clique no mapa para selecionar a localização exata do local.
                </p>
              </div>

              {/* Coordenadas (somente leitura) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="text"
                    value={formData.latitude}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Selecione no mapa"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="text"
                    value={formData.longitude}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Selecione no mapa"
                  />
                </div>
              </div>

              {/* Erro */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/mapa')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Salvando...' : 'Salvar Local'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function NovoLocalPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Carregando...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <NovoLocalForm />
    </Suspense>
  );
}
