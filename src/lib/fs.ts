import { existsSync, mkdirSync } from "fs";
import { join } from "path";

// Em produção (Railway), usar o volume montado em /app/uploads
// Em desenvolvimento, usar uploads/ relativo ao projeto
// Verificar se /app/uploads existe (volume Railway montado)
const RAILWAY_UPLOAD_DIR = "/app/uploads";
const isRailwayVolumeMounted = existsSync(RAILWAY_UPLOAD_DIR);

export const UPLOAD_DIR = isRailwayVolumeMounted
  ? RAILWAY_UPLOAD_DIR
  : join(process.cwd(), "uploads");

export const REVIEWS_UPLOAD_DIR = join(UPLOAD_DIR, "reviews");

export function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  if (!existsSync(REVIEWS_UPLOAD_DIR)) {
    mkdirSync(REVIEWS_UPLOAD_DIR, { recursive: true });
  }
}
