import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

// Schema para validação de atualização de usuário
const updateUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  isAdmin: z.boolean().optional(),
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

// GET - Buscar usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await verifyAdmin(request);
    if (!adminId) {
      return NextResponse.json(
        { message: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    const result = await pool.query(
      'SELECT id, name, email, isAdmin, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isadmin,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await verifyAdmin(request);
    if (!adminId) {
      return NextResponse.json(
        { message: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Verificar se usuário existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se email já existe (se estiver sendo atualizado)
    if (validatedData.email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [validatedData.email, userId]
      );

      if (emailCheck.rows.length > 0) {
        return NextResponse.json(
          { message: 'Email já está em uso' },
          { status: 400 }
        );
      }
    }

    // Construir query de atualização dinamicamente
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (validatedData.name !== undefined) {
      updateFields.push(`name = $${paramCount}`);
      values.push(validatedData.name);
      paramCount++;
    }

    if (validatedData.email !== undefined) {
      updateFields.push(`email = $${paramCount}`);
      values.push(validatedData.email);
      paramCount++;
    }

    if (validatedData.password !== undefined) {
      const hashedPassword = await hashPassword(validatedData.password);
      updateFields.push(`password = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }

    if (validatedData.isAdmin !== undefined) {
      updateFields.push(`isAdmin = $${paramCount}`);
      values.push(validatedData.isAdmin);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { message: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    values.push(userId);
    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, name, email, isAdmin, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    const updatedUser = result.rows[0];

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isadmin,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: error.issues.map((issue) => issue.message).join(', ') },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await verifyAdmin(request);
    if (!adminId) {
      return NextResponse.json(
        { message: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // Verificar se não está tentando deletar a si mesmo
    if (adminId === userId) {
      return NextResponse.json(
        { message: 'Não é possível deletar seu próprio usuário' },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const existingUser = await pool.query(
      'SELECT id, name FROM users WHERE id = $1',
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Deletar usuário
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    return NextResponse.json({
      message: 'Usuário deletado com sucesso',
      deletedUser: {
        id: existingUser.rows[0].id,
        name: existingUser.rows[0].name,
      }
    });

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
