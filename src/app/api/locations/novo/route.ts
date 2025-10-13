import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Retorna um template vazio para criação de novo local
    return NextResponse.json({
      success: true,
      data: {
        id: null,
        name: "",
        description: "",
        address: "",
        latitude: 0,
        longitude: 0,
        category: "",
        is_active: true,
        created_at: null,
        updated_at: null,
        created_by_name: null
      }
    });
  } catch (error) {
    console.error("Erro ao buscar template de novo local:", error);
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

