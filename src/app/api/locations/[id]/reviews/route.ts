import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { reviewSchema } from "@/lib/validations";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validar se o ID é um número válido
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    // Buscar todas as avaliações do local com critérios e fotos
    const reviewsResult = await pool.query(`
      SELECT 
        r.id,
        r.description,
        r.created_at,
        r.updated_at,
        r.location_id,
        u.name as user_name,
        u.id as user_id
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.location_id = $1
      ORDER BY r.created_at DESC
    `, [id]);

    // Buscar critérios de cada avaliação
    const criteriaResult = await pool.query(`
      SELECT 
        rc.review_id,
        rc.criteria_name,
        rc.rating
      FROM review_criteria rc
      WHERE rc.review_id = ANY($1)
      ORDER BY rc.review_id, rc.criteria_name
    `, [reviewsResult.rows.map(r => r.id)]);

    // Buscar fotos de cada avaliação
    const photosResult = await pool.query(`
      SELECT 
        rp.review_id,
        rp.id,
        rp.photo_path
      FROM review_photos rp
      WHERE rp.review_id = ANY($1)
      ORDER BY rp.review_id, rp.uploaded_at
    `, [reviewsResult.rows.map(r => r.id)]);

    // Organizar dados
    const reviews = reviewsResult.rows.map(review => {
      const criteria = criteriaResult.rows
        .filter(c => c.review_id === review.id)
        .map(c => ({
          name: c.criteria_name,
          rating: c.rating
        }));

      const photos = photosResult.rows
        .filter(p => p.review_id === review.id)
        .map(p => ({
          id: p.id,
          photo_path: p.photo_path
        }));

      return {
        ...review,
        criteria,
        photos
      };
    });

    // Calcular médias
    const allCriteria = criteriaResult.rows;
    const criteriaAverages = allCriteria.reduce((acc, curr) => {
      if (!acc[curr.criteria_name]) {
        acc[curr.criteria_name] = { total: 0, count: 0 };
      }
      acc[curr.criteria_name].total += curr.rating;
      acc[curr.criteria_name].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const criteriaAveragesArray = Object.entries(criteriaAverages).map(([name, data]) => {
      const typedData = data as { total: number; count: number };
      return {
        name,
        average: typedData.total / typedData.count,
        count: typedData.count
      };
    });

    const overallAverage = criteriaAveragesArray.length > 0 
      ? criteriaAveragesArray.reduce((sum, curr) => sum + curr.average, 0) / criteriaAveragesArray.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        summary: {
          totalReviews: reviews.length,
          overallAverage,
          criteriaAverages: criteriaAveragesArray
        }
      }
    });
  } catch (error) {
    console.error("Erro ao buscar avaliações:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validar se o ID é um número válido
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
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

    // Verificar se o usuário já avaliou este local
    const existingReview = await pool.query(
      "SELECT id FROM reviews WHERE location_id = $1 AND user_id = $2",
      [id, userId]
    );

    if (existingReview.rows.length > 0) {
      // Se já tem avaliação, retornar erro informativo mas não bloquear
      // O frontend agora deve sempre abrir em modo de edição
      return NextResponse.json(
        { success: false, error: "Você já avaliou este local. Use o botão de editar para modificar sua avaliação." },
        { status: 409 }
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

      // Criar avaliação
      const reviewResult = await client.query(
        `INSERT INTO reviews (location_id, user_id, description)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [id, userId, description]
      );

      const reviewId = reviewResult.rows[0].id;

      // Inserir critérios
      for (const criterion of criteria) {
        await client.query(
          `INSERT INTO review_criteria (review_id, criteria_name, rating)
           VALUES ($1, $2, $3)`,
          [reviewId, criterion.name, criterion.rating]
        );
      }

      // Processar fotos
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

      return NextResponse.json(
        { success: true, data: { reviewId } },
        { status: 201 }
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao criar avaliação:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

