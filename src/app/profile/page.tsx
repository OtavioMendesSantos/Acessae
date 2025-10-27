'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Save, Eye, EyeOff, Star, MapPin, Calendar, Edit, Trash2, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { type ReviewFormData } from '@/lib/validations';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface Review {
  id: number;
  description: string;
  created_at: string;
  updated_at: string;
  location_id: number;
  location_name: string;
  location_address: string;
  criteria: Array<{ name: string; rating: number }>;
  photos: Array<{ id: number; photo_path: string }>;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'reviews'>('profile');
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setFormData({
            name: userData.name,
            email: userData.email,
            currentPassword: '',
            newPassword: '',
          });
        } else {
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch {
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const loadUserReviews = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoadingReviews(true);
    try {
      const response = await fetch('/api/profile/reviews', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reviews' && reviews.length === 0) {
      loadUserReviews();
    }
  }, [activeTab]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const token = localStorage.getItem('token');
      
      // Preparar dados para envio
      const updateData: any = {};
      
      if (formData.name !== user?.name) {
        updateData.name = formData.name;
      }
      
      if (formData.email !== user?.email) {
        updateData.email = formData.email;
      }
      
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      // Se não há nada para atualizar
      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
        }));
        
        // Mostrar modal de sucesso
        setSuccessMessage('Perfil atualizado com sucesso!');
        setShowSuccessModal(true);
      } else {
        const error = await response.json();
        if (error.errors) {
          setErrors(error.errors);
        } else {
          alert(error.message || 'Erro ao atualizar perfil');
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        currentPassword: '',
        newPassword: '',
      });
    }
    setIsEditing(false);
    setErrors({});
  };

  const handleEditReview = (reviewId: number, locationId: number) => {
    const review = reviews.find(r => r.id === reviewId);
    if (review) {
      setEditingReview(review);
      setShowEditForm(true);
    }
  };

  const handleDeleteReview = async (reviewId: number, locationId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/locations/${locationId}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setReviews(reviews.filter(review => review.id !== reviewId));
        
        // Mostrar modal de sucesso
        setSuccessMessage('Avaliação excluída com sucesso!');
        setShowSuccessModal(true);
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

  const handleSubmitEditReview = async (data: ReviewFormData) => {
    if (!editingReview) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append('description', data.description);
      formData.append('criteria', JSON.stringify(data.criteria));
      formData.append('keepPhotos', JSON.stringify(data.photos.map((_, index) => index)));

      // Adicionar novas fotos se houver
      data.photos.forEach((photo, index) => {
        if (photo instanceof File) {
          formData.append(`photo${index}`, photo);
        }
      });

      const response = await fetch(`/api/locations/${editingReview.location_id}/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        // Recarregar avaliações
        await loadUserReviews();
        
        setShowEditForm(false);
        setEditingReview(null);
        
        // Mostrar modal de sucesso
        setSuccessMessage('Avaliação atualizada com sucesso!');
        setShowSuccessModal(true);
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao atualizar avaliação');
      }
    } catch (error) {
      console.error('Erro ao atualizar avaliação:', error);
      alert('Erro ao atualizar avaliação');
    }
  };

  const handleCancelEditReview = () => {
    setShowEditForm(false);
    setEditingReview(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => router.push('/home')} 
                variant="outline" 
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Meu Perfil
              </h1>
            </div>
            {!isEditing && activeTab === 'profile' && (
              <Button 
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <User className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            )}
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                Informações do Perfil
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reviews'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Star className="h-4 w-4 inline mr-2" />
                Minhas Avaliações
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'profile' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Informações do Perfil
                </CardTitle>
                <CardDescription>
                  Gerencie suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Conteúdo do perfil existente */}
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>

                {/* Email - apenas para admins */}
                {user?.isAdmin && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                  </div>
                )}

                {/* Tipo de usuário (apenas leitura) */}
                <div className="space-y-2">
                  <Label>Tipo de Usuário</Label>
                  <div className="px-3 py-2 bg-gray-100 rounded-md">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user?.isAdmin 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user?.isAdmin ? 'Administrador' : 'Usuário'}
                    </span>
                  </div>
                  {!user?.isAdmin && (
                    <p className="text-sm text-gray-500">
                      Como usuário comum, você pode editar apenas seu nome. Para alterar email ou senha, entre em contato com um administrador.
                    </p>
                  )}
                </div>

                {/* Senha atual (apenas quando editando e for admin) */}
                {isEditing && user?.isAdmin && (
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={formData.currentPassword}
                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                        placeholder="Digite sua senha atual para confirmar alterações"
                        className={errors.currentPassword ? 'border-red-500' : ''}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.currentPassword && <p className="text-red-500 text-sm">{errors.currentPassword}</p>}
                  </div>
                )}

                {/* Nova senha (apenas quando editando e for admin) */}
                {isEditing && user?.isAdmin && (
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        placeholder="Deixe em branco para manter a senha atual"
                        className={errors.newPassword ? 'border-red-500' : ''}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.newPassword && <p className="text-red-500 text-sm">{errors.newPassword}</p>}
                    <p className="text-sm text-gray-500">
                      Deixe em branco se não quiser alterar a senha
                    </p>
                  </div>
                )}

                {/* Botões de ação */}
                {isEditing && (
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleSave}
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Minhas Avaliações
                </CardTitle>
                <CardDescription>
                  Gerencie suas avaliações de locais
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingReviews ? (
                  <div className="text-center py-8">
                    <div className="text-lg">Carregando suas avaliações...</div>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Nenhuma avaliação encontrada
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Você ainda não avaliou nenhum local.
                    </p>
                    <Button 
                      onClick={() => router.push('/mapa')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Explorar Locais
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                              {review.location_name}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {review.location_address}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditReview(review.id, review.location_id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteReview(review.id, review.location_id)}
                              className="text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                                <img
                                  key={photo.id}
                                  src={photo.photo_path}
                                  alt="Foto da avaliação"
                                  className="h-20 w-20 object-cover rounded border"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Formulário de Edição de Avaliação */}
      {showEditForm && editingReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Editar Avaliação
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEditReview}
                >
                  ✕
                </Button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {editingReview.location_name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {editingReview.location_address}
                </p>
              </div>

              <ReviewForm
                onSubmit={handleSubmitEditReview}
                onCancel={handleCancelEditReview}
                initialData={{
                  description: editingReview.description,
                  criteria: editingReview.criteria,
                  photos: editingReview.photos.map(photo => photo.photo_path)
                }}
                isEditing={true}
              />
            </div>
          </div>
        </div>
      )}

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
