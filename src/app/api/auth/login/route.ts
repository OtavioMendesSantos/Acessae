import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    // Buscar usuário
    const result = await pool.query(
      'SELECT id, name, email, password, isAdmin FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Verificar senha
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Gerar token
    const token = generateToken(user.id);

    return NextResponse.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isadmin,
      },
    });
  } catch (error: unknown	) {
    console.error('Erro no login:', error);
    if (error instanceof ZodError) {
        return NextResponse.json(
          { message: 'Dados inválidos', errors: error.issues.map((issue) => issue.message).join(', ') },
          { status: 400 }
        );
      }
      
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { message: 'Dados inválidos', errors: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

