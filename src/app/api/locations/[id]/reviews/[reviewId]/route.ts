import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { reviewSchema } from "@/lib/validations";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { id, reviewId } = await params;

    // Validar IDs
    if (!id || isNaN(Number(id)) || !reviewId || isNaN(Number(reviewId))) {
      return NextResponse.json(
        { success: false, error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Verificar autenticação
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Token de autenticação necessário" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Token inválido" },
        { status: 401 }
      );
    }

    const userId = parseInt(decoded.userId);

    // Verificar se a avaliação existe e pertence ao usuário
    const reviewResult = await pool.query(
      "SELECT user_id FROM reviews WHERE id = $1 AND location_id = $2",
      [reviewId, id]
    );

    if (reviewResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Avaliação não encontrada" },
        { status: 404 }
      );
    }

    if (reviewResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Você só pode editar suas próprias avaliações" },
        { status: 403 }
      );
    }

    // Parse do body
    const formData = await request.formData();
    const description = formData.get("description") as string;
    const criteriaJson = formData.get("criteria") as string;
    const criteria = JSON.parse(criteriaJson);

    // Validar dados
    const validationResult = reviewSchema.safeParse({
      description,
      criteria,
      photos: [] // Fotos serão processadas separadamente
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Iniciar transação
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Atualizar avaliação
      await client.query(
        `UPDATE reviews 
         SET description = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [description, reviewId]
      );

      // Remover critérios antigos
      await client.query(
        "DELETE FROM review_criteria WHERE review_id = $1",
        [reviewId]
      );

      // Inserir novos critérios
      for (const criterion of criteria) {
        await client.query(
          `INSERT INTO review_criteria (review_id, criteria_name, rating)
           VALUES ($1, $2, $3)`,
          [reviewId, criterion.name, criterion.rating]
        );
      }

      // Processar fotos (remover antigas e adicionar novas)
      const keepPhotosJson = formData.get("keepPhotos") as string;
      const keepPhotos = keepPhotosJson ? JSON.parse(keepPhotosJson) : [];

      // Buscar fotos atuais
      const currentPhotosResult = await client.query(
        "SELECT id, photo_path FROM review_photos WHERE review_id = $1",
        [reviewId]
      );

      // Remover fotos que não estão na lista de manter
      for (const photo of currentPhotosResult.rows) {
        if (!keepPhotos.includes(photo.id)) {
          // Remover arquivo físico
          try {
            const filepath = join(process.cwd(), 'public', photo.photo_path);
            await unlink(filepath);
          } catch (error) {
            console.warn('Erro ao remover arquivo:', error);
          }

          // Remover do banco
          await client.query(
            "DELETE FROM review_photos WHERE id = $1",
            [photo.id]
          );
        }
      }

      // Adicionar novas fotos
      const photoFiles = Array.from(formData.entries())
        .filter(([key]) => key.startsWith('photo'))
        .map(([, file]) => file as File);

      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        if (file && file.size > 0) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          const timestamp = Date.now();
          const filename = `${id}_${userId}_${timestamp}_${i}.${file.name.split('.').pop()}`;
          const filepath = join(process.cwd(), 'public', 'uploads', 'reviews', filename);
          
          await writeFile(filepath, buffer);
          
          await client.query(
            `INSERT INTO review_photos (review_id, photo_path)
             VALUES ($1, $2)`,
            [reviewId, `/uploads/reviews/${filename}`]
          );
        }
      }

      await client.query('COMMIT');

      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao editar avaliação:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { id, reviewId } = await params;

    // Validar IDs
    if (!id || isNaN(Number(id)) || !reviewId || isNaN(Number(reviewId))) {
      return NextResponse.json(
        { success: false, error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Verificar autenticação
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Token de autenticação necessário" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Token inválido" },
        { status: 401 }
      );
    }

    const userId = parseInt(decoded.userId);

    // Verificar se a avaliação existe e pertence ao usuário
    const reviewResult = await pool.query(
      "SELECT user_id FROM reviews WHERE id = $1 AND location_id = $2",
      [reviewId, id]
    );

    if (reviewResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Avaliação não encontrada" },
        { status: 404 }
      );
    }

    if (reviewResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Você só pode deletar suas próprias avaliações" },
        { status: 403 }
      );
    }

    // Buscar fotos para remover arquivos físicos
    const photosResult = await pool.query(
      "SELECT photo_path FROM review_photos WHERE review_id = $1",
      [reviewId]
    );

    // Remover arquivos físicos
    for (const photo of photosResult.rows) {
      try {
        const filepath = join(process.cwd(), 'public', photo.photo_path);
        await unlink(filepath);
      } catch (error) {
        console.warn('Erro ao remover arquivo:', error);
      }
    }

    // Deletar avaliação (cascade vai remover critérios e fotos)
    await pool.query(
      "DELETE FROM reviews WHERE id = $1",
      [reviewId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar avaliação:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

