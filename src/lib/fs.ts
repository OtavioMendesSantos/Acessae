import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Em produção (Railway), usar o volume montado em /app/uploads
// Em desenvolvimento, usar uploads/ relativo ao projeto
export const UPLOAD_DIR = process.env.NODE_ENV === 'production' 
  ? '/app/uploads' 
  : join(process.cwd(), 'uploads');

export const REVIEWS_UPLOAD_DIR = join(UPLOAD_DIR, 'reviews');

export function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  if (!existsSync(REVIEWS_UPLOAD_DIR)) {
    mkdirSync(REVIEWS_UPLOAD_DIR, { recursive: true });
  }
}

