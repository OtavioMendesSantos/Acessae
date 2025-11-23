'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CriteriaSelector } from './CriteriaSelector';
import { PhotoUpload } from './PhotoUpload';
import { reviewSchema, type ReviewFormData } from '@/lib/validations';

interface ReviewFormProps {
  onSubmit: (data: ReviewFormData) => void;
  onCancel: () => void;
  initialData?: Partial<ReviewFormData>;
  isEditing?: boolean;
  className?: string;
}

export function ReviewForm({ 
  onSubmit, 
  onCancel, 
  initialData,
  isEditing = false,
  className 
}: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReviewFormData>({
    // Type assertion needed: zodResolver infers photos as optional in input, but default ensures it's always an array in output
    resolver: zodResolver(reviewSchema) as any,
    defaultValues: {
      description: initialData?.description || '',
      criteria: initialData?.criteria || [],
      photos: initialData?.photos ?? []
    }
  });

  const handleSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const description = form.watch('description');
  const criteria = form.watch('criteria');
  const photos = form.watch('photos');

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Critérios de Acessibilidade */}
          <FormField
            control={form.control}
            name="criteria"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">
                  Critérios de Acessibilidade
                </FormLabel>
                <FormControl>
                  <CriteriaSelector
                    selectedCriteria={field.value}
                    onCriteriaChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descrição da Experiência */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">
                  Descreva sua experiência
                </FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Conte como foi sua experiência neste local. Quais aspectos de acessibilidade você observou? O que funcionou bem e o que poderia melhorar?"
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>
                        {description.length}/1000 caracteres
                      </span>
                      <span className={description.length > 900 ? 'text-orange-500' : ''}>
                        {1000 - description.length} restantes
                      </span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Upload de Fotos */}
          <FormField
            control={form.control}
            name="photos"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">
                  Fotos (Opcional)
                </FormLabel>
                <FormControl>
                  <PhotoUpload
                    photos={field.value}
                    onPhotosChange={field.onChange}
                    maxPhotos={5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting || criteria.length === 0}
              className="flex-1"
            >
              {isSubmitting 
                ? 'Salvando...' 
                : isEditing 
                  ? 'Atualizar Avaliação' 
                  : 'Enviar Avaliação'
              }
            </Button>
          </div>

          {/* Resumo da Avaliação */}
          {criteria.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-gray-700">Resumo da sua avaliação:</h4>
              <div className="flex flex-wrap gap-2">
                {criteria.map((criterion, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    <span className="font-medium">{criterion.name}:</span> {criterion.rating} estrelas
                  </div>
                ))}
              </div>
              {photos.length > 0 && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Fotos:</span> {photos.length} adicionada(s)
                </div>
              )}
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}

