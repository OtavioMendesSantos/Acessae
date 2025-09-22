import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

// Schema para validação de criação de usuário
const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  isAdmin: z.boolean().optional().default(false),
});

// Função para verificar se o usuário é admin
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return null;
  }

  const result = await pool.query(
    'SELECT id, isAdmin FROM users WHERE id = $1',
    [decoded.userId]
  );

  if (result.rows.length === 0 || !result.rows[0].isadmin) {
    return null;
  }

  return decoded.userId;
}

// GET - Listar usuários com paginação
export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdmin(request);
    if (!adminId) {
      return NextResponse.json(
        { message: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // Construir query com busca
    let whereClause = '';
    const queryParams: unknown[] = [];
    
    if (search) {
      whereClause = 'WHERE name ILIKE $1 OR email ILIKE $1';
      queryParams.push(`%${search}%`);
    }

    // Buscar usuários
    const usersQuery = `
      SELECT id, name, email, isAdmin, created_at, updated_at 
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM users 
      ${whereClause}
    `;

    const [usersResult, countResult] = await Promise.all([
      pool.query(usersQuery, [...queryParams, limit, offset]),
      pool.query(countQuery, queryParams)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users: usersResult.rows.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isadmin,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const adminId = await verifyAdmin(request);
    if (!adminId) {
      return NextResponse.json(
        { message: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Verificar se email já existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [validatedData.email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { message: 'Email já está em uso' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await hashPassword(validatedData.password);

    // Criar usuário
    const result = await pool.query(
      'INSERT INTO users (name, email, password, isAdmin) VALUES ($1, $2, $3, $4) RETURNING id, name, email, isAdmin, created_at',
      [validatedData.name, validatedData.email, hashedPassword, validatedData.isAdmin]
    );

    const newUser = result.rows[0];

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      isAdmin: newUser.isadmin,
      createdAt: newUser.created_at,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: error.issues.map((issue) => issue.message).join(', ') },
        { status: 400 }
      );
    }

    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
