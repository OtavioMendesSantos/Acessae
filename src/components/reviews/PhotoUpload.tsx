'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  className?: string;
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  className
}: PhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use JPG, PNG ou WebP.';
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'Arquivo muito grande. Máximo 5MB por foto.';
    }

    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newPhotos: string[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      if (photos.length + newPhotos.length >= maxPhotos) {
        errors.push(`Máximo de ${maxPhotos} fotos permitidas.`);
        return;
      }

      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        return;
      }

      // Converter para base64 para preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          newPhotos.push(result);
          if (newPhotos.length === Array.from(files).length) {
            onPhotosChange([...photos, ...newPhotos]);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Photo Preview Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  onClick={() => removePhoto(index)}
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Area - Sempre visível se não atingiu o máximo */}
        {photos.length < maxPhotos && (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              dragActive
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-2">
              <ImageIcon className="h-8 w-8 mx-auto text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">
                  {photos.length > 0
                    ? `Adicione mais fotos (${photos.length}/${maxPhotos})`
                    : `Arraste fotos aqui ou clique para selecionar`
                  }
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG, WebP • Máx. 5MB cada • {photos.length}/{maxPhotos} fotos
                </p>
              </div>

              <Button
                type="button"
                onClick={openFileDialog}
                variant="outline"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                {photos.length > 0 ? 'Adicionar Mais Fotos' : 'Selecionar Fotos'}
              </Button>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  );
}

