'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ClientOnlyMap from '@/components/map/ClientOnlyMap';
import { 
  MapPin, 
  ArrowLeft, 
  Calendar, 
  User, 
  Navigation,
  Edit,
  Trash2
} from 'lucide-react';

interface Location {
  id: number;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
}

export default function LocalDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch(`/api/locations/${params.id}`);
        const data = await response.json();

        if (data.success) {
          setLocation(data.data);
        } else {
          setError(data.error || 'Local não encontrado');
        }
      } catch (err) {
        console.error('Erro ao buscar local:', err);
        setError('Erro ao carregar local');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchLocation();
    }
  }, [params.id]);

  const handleEdit = () => {
    router.push(`/local/${params.id}/editar`);
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja remover este local?')) {
      return;
    }

    try {
      const response = await fetch(`/api/locations/${params.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        router.push('/mapa');
      } else {
        alert('Erro ao remover local: ' + data.error);
      }
    } catch (err) {
      console.error('Erro ao remover local:', err);
      alert('Erro ao remover local');
    }
  };

  const handleNavigateToLocation = () => {
    if (location) {
      // Abrir no Google Maps
      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      window.open(url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Carregando local...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'Local não encontrado'}</p>
              <Button onClick={() => router.push('/mapa')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Mapa
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {location.name}
            </h1>
            {location.category && (
              <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                {location.category}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleEdit} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button onClick={handleDelete} variant="outline" className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Remover
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações do local */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {location.description && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Descrição</h3>
                  <p className="text-gray-600">{location.description}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Endereço</h3>
                <p className="text-gray-600">{location.address}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Coordenadas</h3>
                <p className="text-gray-600 font-mono text-sm">
                  {Number(location.latitude).toFixed(6)}, {Number(location.longitude).toFixed(6)}
                </p>
              </div>

              <Button
                onClick={handleNavigateToLocation}
                className="w-full"
                variant="outline"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Abrir no Google Maps
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detalhes do Cadastro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {location.created_by_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Cadastrado por: <strong>{location.created_by_name}</strong>
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Criado em: <strong>{new Date(location.created_at).toLocaleDateString('pt-BR')}</strong>
                </span>
              </div>

              {location.updated_at !== location.created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Atualizado em: <strong>{new Date(location.updated_at).toLocaleDateString('pt-BR')}</strong>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mapa */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Localização no Mapa</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ClientOnlyMap
                locations={[location]}
                onLocationClick={() => {}} // Não faz nada pois já estamos na página de detalhes
                className="rounded-lg"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
