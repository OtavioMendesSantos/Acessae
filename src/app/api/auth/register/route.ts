import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados
    const validatedData = registerSchema.parse(body);
    const { name, email, password } = validatedData;

    // Verificar se o usuário já existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { message: 'Este email já está cadastrado' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password);

    // Criar usuário
    const result = await pool.query(
      'INSERT INTO users (name, email, password, isAdmin, created_at) VALUES ($1, $2, $3, FALSE, NOW()) RETURNING id, name, email, isAdmin',
      [name, email, hashedPassword]
    );

    const user = result.rows[0];

    // Gerar token
    const token = generateToken(user.id);

    return NextResponse.json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isadmin,
      },
    });
  } catch (error: unknown) {
    console.error('Erro no registro:', error);
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: 'errors' in error ? error.errors : [] },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

