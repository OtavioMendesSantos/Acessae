import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
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

    // Buscar todas as avaliações do usuário com informações do local
    const reviewsResult = await pool.query(`
      SELECT 
        r.id,
        r.description,
        r.created_at,
        r.updated_at,
        l.id as location_id,
        l.name as location_name,
        l.address as location_address
      FROM reviews r
      JOIN locations l ON r.location_id = l.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `, [userId]);

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

    return NextResponse.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error("Erro ao buscar avaliações do usuário:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
