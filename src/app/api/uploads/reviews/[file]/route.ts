import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { REVIEWS_UPLOAD_DIR } from '@/lib/fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  try {
    const { file } = await params;
    
    // Construir caminho do arquivo usando o volume persistente
    const filePath = join(REVIEWS_UPLOAD_DIR, file);
    
    // Verificar se o arquivo existe
    if (!existsSync(filePath)) {
      console.error(`Arquivo não encontrado: ${filePath}`);
      console.error(`REVIEWS_UPLOAD_DIR: ${REVIEWS_UPLOAD_DIR}`);
      console.error(`File: ${file}`);
      return new NextResponse('Arquivo não encontrado', { status: 404 });
    }
    
    // Ler o arquivo
    const fileBuffer = await readFile(filePath);
    
    // Determinar o tipo MIME baseado na extensão
    const ext = file.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif'
    };
    const contentType = mimeTypes[ext || ''] || 'application/octet-stream';
    
    // Converter Buffer para Uint8Array para compatibilidade com NextResponse
    const uint8Array = new Uint8Array(fileBuffer);
    
    // Retornar a imagem
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Erro ao servir imagem:', error);
    return new NextResponse('Erro ao carregar imagem', { status: 500 });
  }
}

