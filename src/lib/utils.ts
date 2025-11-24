import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converte o path do banco de dados para a URL da API
 * Exemplo: /uploads/reviews/filename.jpg -> /api/uploads/reviews/filename.jpg
 */
export function getImageUrl(photoPath: string): string {
  if (!photoPath) return '';
  // Se já começa com /api, retorna como está
  if (photoPath.startsWith('/api/')) return photoPath;
  // Se começa com /uploads, converte para /api/uploads
  if (photoPath.startsWith('/uploads/')) {
    return `/api${photoPath}`;
  }
  // Se não começa com /, adiciona /api/uploads/reviews/
  if (!photoPath.startsWith('/')) {
    return `/api/uploads/reviews/${photoPath}`;
  }
  return photoPath;
}
