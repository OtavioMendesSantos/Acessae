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
  
  // Extrair apenas o nome do arquivo do caminho
  let filename = photoPath;
  
  // Se começa com /uploads/reviews/, extrair apenas o nome do arquivo
  if (photoPath.startsWith('/uploads/reviews/')) {
    filename = photoPath.replace('/uploads/reviews/', '');
  }
  // Se começa com /uploads/, extrair o nome do arquivo
  else if (photoPath.startsWith('/uploads/')) {
    filename = photoPath.split('/').pop() || photoPath;
  }
  // Se não começa com /, já é o nome do arquivo
  else if (!photoPath.startsWith('/')) {
    filename = photoPath;
  }
  // Se começa com / mas não é /uploads, extrair o nome do arquivo
  else {
    filename = photoPath.split('/').pop() || photoPath;
  }
  
  // Retornar a URL completa da API
  return `/api/uploads/reviews/${filename}`;
}
