'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImageModalProps {
  images: Array<{ id: number; photo_path: string }>;
  triggerImage: { id: number; photo_path: string };
  className?: string;
}

export function ImageModal({ images, triggerImage, className }: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(
    images.findIndex(img => img.id === triggerImage.id)
  );

  const currentImage = images[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && hasPrevious) {
      goToPrevious();
    } else if (e.key === 'ArrowRight' && hasNext) {
      goToNext();
    } else if (e.key === 'Escape') {
      // O Dialog vai fechar automaticamente
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <img
          src={triggerImage.photo_path}
          alt={`Foto da avaliação`}
          className={`w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity ${className}`}
        />
      </DialogTrigger>
      
      <DialogContent 
        className="max-w-4xl w-full h-[90vh] p-0 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">
          Visualizador de Imagens - Foto {currentIndex + 1} de {images.length}
        </DialogTitle>
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {/* Botão Fechar */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            onClick={() => {
              // O Dialog vai fechar automaticamente
            }}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Botão Anterior */}
          {hasPrevious && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {/* Botão Próximo */}
          {hasNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
              onClick={goToNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Imagem Principal */}
          <div className="flex items-center justify-center w-full h-full p-8">
            <img
              src={currentImage.photo_path}
              alt={`Foto ${currentIndex + 1} de ${images.length}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Contador de Imagens */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} de {images.length}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
