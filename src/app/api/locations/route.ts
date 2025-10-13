import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const isActive = searchParams.get("is_active") !== "false";

    let query = `
      SELECT 
        l.id,
        l.name,
        l.description,
        l.address,
        l.latitude,
        l.longitude,
        l.category,
        l.is_active,
        l.created_at,
        u.name as created_by_name
      FROM locations l
      LEFT JOIN users u ON l.created_by = u.id
      WHERE l.is_active = $1
    `;

    const params: (string | boolean)[] = [isActive];
    let paramIndex = 2;

    if (category) {
      query += ` AND l.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      query += ` AND (LOWER(l.name) LIKE LOWER($${paramIndex}) OR LOWER(l.description) LIKE LOWER($${paramIndex}) OR LOWER(l.address) LIKE LOWER($${paramIndex}))`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += " ORDER BY l.name ASC";

    const result = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Erro ao buscar locais:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      address,
      latitude,
      longitude,
      category,
      created_by,
    } = body;

    // Validações básicas
    if (
      !name ||
      !address ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Campos obrigatórios: name, address, latitude, longitude",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO locations (name, description, address, latitude, longitude, category, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description, address, latitude, longitude, category, created_by]
    );

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar local:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
