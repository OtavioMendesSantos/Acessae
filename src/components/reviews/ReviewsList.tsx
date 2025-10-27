'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Calendar, Edit, Trash2, User } from 'lucide-react';
import Image from 'next/image';

interface Review {
  id: number;
  description: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_id: number;
  location_id: number;
  criteria: Array<{ name: string; rating: number }>;
  photos: Array<{ id: number; photo_path: string }>;
}

interface ReviewsListProps {
  reviews: Review[];
  currentUserId?: number;
  onEditReview?: (reviewId: number) => void;
  onDeleteReview?: (reviewId: number) => void;
}

export function ReviewsList({ reviews, onEditReview, onDeleteReview, currentUserId }: ReviewsListProps) {
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews);

  // Atualizar reviews quando a prop mudar
  useEffect(() => {
    setLocalReviews(reviews);
  }, [reviews]);

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Encontrar o locationId da review que está sendo deletada
      const reviewToDelete = localReviews.find(r => r.id === reviewId);
      if (!reviewToDelete) return;

      const response = await fetch(`/api/locations/${reviewToDelete.location_id}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setLocalReviews(localReviews.filter(review => review.id !== reviewId));
        onDeleteReview?.(reviewId);
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao excluir avaliação');
      }
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error);
      alert('Erro ao excluir avaliação');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (localReviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Avaliações</CardTitle>
          <CardDescription>
            Avaliações dos usuários sobre este local
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma avaliação ainda
            </h3>
            <p className="text-gray-500">
              Seja o primeiro a avaliar este local!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avaliações</CardTitle>
        <CardDescription>
          {localReviews.length} avaliação{localReviews.length !== 1 ? 'ões' : ''} encontrada{localReviews.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {localReviews.map((review) => (
            <div key={review.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {review.user_name}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {currentUserId === review.user_id && onEditReview && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditReview(review.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {currentUserId === review.user_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                {review.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {review.criteria.map((criterion, index) => (
                    <div key={index} className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      <span className="text-sm font-medium mr-1">{criterion.name}:</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= criterion.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-sm text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(review.created_at)}
                  {review.updated_at !== review.created_at && (
                    <span className="ml-2 text-xs">(editado)</span>
                  )}
                </div>
              </div>
              
              {review.photos.length > 0 && (
                <div className="mt-3">
                  <div className="flex space-x-2 overflow-x-auto">
                    {review.photos.map((photo) => (
                      <Image
                        key={photo.id}
                        src={photo.photo_path}
                        alt="Foto da avaliação"
                        width={80}
                        height={80}
                        className="object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}