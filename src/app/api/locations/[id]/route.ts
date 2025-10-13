import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

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

    const result = await pool.query(
      `SELECT 
        l.id,
        l.name,
        l.description,
        l.address,
        l.latitude,
        l.longitude,
        l.category,
        l.is_active,
        l.created_at,
        l.updated_at,
        u.name as created_by_name
      FROM locations l
      LEFT JOIN users u ON l.created_by = u.id
      WHERE l.id = $1 AND l.is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Local não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao buscar local:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body = await request.json();
    const { name, description, address, latitude, longitude, category } = body;

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
      `UPDATE locations 
       SET name = $1, description = $2, address = $3, latitude = $4, longitude = $5, category = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND is_active = true
       RETURNING *`,
      [name, description, address, latitude, longitude, category, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Local não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar local:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const result = await pool.query(
      `UPDATE locations 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Local não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Local removido com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover local:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
