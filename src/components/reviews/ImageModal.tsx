'use client';

import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/lib/utils';

interface ImageModalProps {
  images: Array<{ id: number; photo_path: string }>;
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageModal({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
}: ImageModalProps) {
  if (images.length === 0) return null;

  const currentImage = images[initialIndex >= 0 && initialIndex < images.length ? initialIndex : 0];

  if (!currentImage) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0 overflow-hidden bg-black">
        <DialogTitle className="sr-only">Visualizador de Imagens</DialogTitle>

        <div className="relative w-full h-full flex items-center justify-center">
          {/* FECHAR */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-30 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* IMAGEM */}
          <div className="w-full h-full flex items-center justify-center p-4">
            <img
              src={getImageUrl(currentImage.photo_path)}
              alt={`Foto ${initialIndex + 1} de ${images.length}`}
              className="max-w-full max-h-full w-auto h-auto object-contain select-none"
              style={{ maxHeight: 'calc(90vh - 80px)' }}
              draggable={false}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
