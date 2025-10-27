'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ClientOnlyMap from '@/components/map/ClientOnlyMap';
import { ReviewsSummary } from '@/components/reviews/ReviewsSummary';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { 
  MapPin, 
  ArrowLeft, 
  Calendar, 
  User, 
  Navigation,
  Edit,
  Trash2,
  Star,
  MessageSquare,
  CheckCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { type ReviewFormData } from '@/lib/validations';

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

interface Review {
  id: number;
  description: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_id: number;
  criteria: Array<{ name: string; rating: number }>;
  photos: Array<{ id: number; photo_path: string }>;
}

interface ReviewsData {
  reviews: Review[];
  summary: {
    totalReviews: number;
    overallAverage: number;
    criteriaAverages: Array<{ name: string; average: number; count: number }>;
  };
}

export default function LocalDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [location, setLocation] = useState<Location | null>(null);
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [error, setError] = useState<string>('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/locations/${params.id}/reviews`);
        const data = await response.json();

        if (data.success) {
          setReviewsData(data.data);
        }
      } catch (err) {
        console.error('Erro ao buscar avaliações:', err);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    if (params.id) {
      fetchReviews();
    }
  }, [params.id]);

  useEffect(() => {
    // Verificar se usuário está logado
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decodificar token para obter user ID (implementação simples)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId);
      } catch (err) {
        console.error('Erro ao decodificar token:', err);
      }
    }
  }, []);

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

  const handleSubmitReview = async (data: ReviewFormData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Você precisa estar logado para avaliar');
        return;
      }

      const formData = new FormData();
      formData.append('description', data.description);
      formData.append('criteria', JSON.stringify(data.criteria));
      
      // Adicionar fotos se houver
      data.photos.forEach((photo, index) => {
        if (photo.startsWith('data:')) {
          // Converter base64 para File
          const byteString = atob(photo.split(',')[1]);
          const mimeString = photo.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const file = new File([ab], `photo_${index}.jpg`, { type: mimeString });
          formData.append(`photo${index}`, file);
        }
      });

      // Se estiver editando, usar API de edição
      const isEditing = !!editingReviewId;
      const url = isEditing 
        ? `/api/locations/${params.id}/reviews/${editingReviewId}`
        : `/api/locations/${params.id}/reviews`;
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Recarregar avaliações
        const reviewsResponse = await fetch(`/api/locations/${params.id}/reviews`);
        const reviewsData = await reviewsResponse.json();
        if (reviewsData.success) {
          setReviewsData(reviewsData.data);
        }
        
        setShowReviewForm(false);
        setEditingReviewId(null);
        
        // Mostrar modal de sucesso
        const message = isEditing ? 'Avaliação atualizada com sucesso!' : 'Avaliação enviada com sucesso!';
        setSuccessMessage(message);
        setShowSuccessModal(true);
      } else {
        // Se o erro for sobre já ter uma avaliação, abrir em modo de edição
        if (result.error && result.error.includes('já avaliou este local')) {
          if (reviewsData) {
            const userReview = reviewsData.reviews.find(review => review.user_id === currentUserId);
            if (userReview) {
              setEditingReviewId(userReview.id);
              alert('Você já avaliou este local. O formulário foi aberto em modo de edição.');
              return;
            }
          }
        }
        alert(`Erro ao ${isEditing ? 'atualizar' : 'enviar'} avaliação: ` + result.error);
      }
    } catch (err) {
      console.error('Erro ao enviar avaliação:', err);
      alert('Erro ao enviar avaliação');
    }
  };

  const handleEditReview = (reviewId: number) => {
    setEditingReviewId(reviewId);
    setShowReviewForm(true);
  };

  const getEditingReviewData = (): Partial<ReviewFormData> | undefined => {
    if (!editingReviewId || !reviewsData) {
      return undefined;
    }

    const review = reviewsData.reviews.find(r => r.id === editingReviewId);
    if (!review) {
      return undefined;
    }

    return {
      description: review.description,
      criteria: review.criteria,
      photos: review.photos.map(photo => photo.photo_path)
    };
  };

  const handleCancelReview = () => {
    setShowReviewForm(false);
    setEditingReviewId(null);
  };

  const handleStartReview = () => {
    if (!currentUserId) {
      alert('Você precisa estar logado para avaliar');
      return;
    }

    // Verificar se o usuário já tem uma avaliação para este local
    if (reviewsData) {
      const userReview = reviewsData.reviews.find(review => review.user_id === currentUserId);
      if (userReview) {
        // Se já tem avaliação, abrir em modo de edição
        setEditingReviewId(userReview.id);
        setShowReviewForm(true);
        return;
      }
    }

    // Se não tem avaliação, abrir formulário novo
    setEditingReviewId(null);
    setShowReviewForm(true);
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

      {/* Seção de Avaliações */}
      <div className="mt-8 space-y-6">
        {/* Resumo das Avaliações */}
        {!isLoadingReviews && reviewsData && (
          <ReviewsSummary
            totalReviews={reviewsData.summary.totalReviews}
            overallAverage={reviewsData.summary.overallAverage}
            criteriaAverages={reviewsData.summary.criteriaAverages}
          />
        )}

        {/* Botão para Avaliar */}
        {currentUserId && !showReviewForm && (
          <div className="flex justify-center">
            <Button onClick={handleStartReview} size="lg">
              <Star className="h-5 w-5 mr-2" />
              Avaliar Local
            </Button>
          </div>
        )}

        {/* Formulário de Avaliação */}
        {showReviewForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {editingReviewId ? 'Editar Avaliação' : 'Avaliar Local'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewForm
                onSubmit={handleSubmitReview}
                onCancel={handleCancelReview}
                initialData={getEditingReviewData()}
                isEditing={!!editingReviewId}
              />
            </CardContent>
          </Card>
        )}

        {/* Lista de Avaliações */}
        {!isLoadingReviews && reviewsData && (
          <ReviewsList
            reviews={reviewsData.reviews}
            currentUserId={currentUserId}
            onEditReview={handleEditReview}
          />
        )}

        {/* Loading das avaliações */}
        {isLoadingReviews && (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Carregando avaliações...</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Sucesso */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <DialogTitle className="text-center text-xl font-semibold text-gray-900 dark:text-white">
              Sucesso!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 dark:text-gray-300">
              {successMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center">
            <Button 
              onClick={() => setShowSuccessModal(false)}
              className="bg-blue-600 hover:bg-blue-700 px-8"
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
