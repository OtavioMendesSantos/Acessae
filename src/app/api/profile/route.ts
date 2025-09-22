import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

// Schema para validação de atualização de perfil (usuários comuns)
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
});

// Schema para validação de atualização de perfil (administradores)
const updateAdminProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres').optional(),
});

// Função para verificar se o usuário está autenticado
async function verifyUser(request: NextRequest) {
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
    'SELECT id, name, email, password, isAdmin FROM users WHERE id = $1',
    [decoded.userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return {
    userId: decoded.userId,
    user: result.rows[0]
  };
}

// GET - Buscar dados do próprio perfil
export async function GET(request: NextRequest) {
  try {
    const authData = await verifyUser(request);
    if (!authData) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const user = authData.user;

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isadmin,
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar próprio perfil
export async function PUT(request: NextRequest) {
  try {
    const authData = await verifyUser(request);
    if (!authData) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const { userId, user } = authData;
    const body = await request.json();
    
    // Usar schema diferente baseado no tipo de usuário
    const isAdmin = user.isadmin;
    const validatedData = isAdmin 
      ? updateAdminProfileSchema.parse(body)
      : updateProfileSchema.parse(body);

    // Verificar se email já existe (apenas para admins)
    if (isAdmin && validatedData.email && validatedData.email !== user.email) {
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

    // Verificar senha atual se estiver tentando alterar a senha (apenas para admins)
    if (isAdmin && validatedData.newPassword) {
      if (!validatedData.currentPassword) {
        return NextResponse.json(
          { message: 'Senha atual é obrigatória para alterar a senha' },
          { status: 400 }
        );
      }

      const bcrypt = await import('bcryptjs');
      const isCurrentPasswordValid = await bcrypt.compare(
        validatedData.currentPassword, 
        user.password
      );

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { message: 'Senha atual incorreta' },
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

    if (isAdmin && validatedData.email !== undefined) {
      updateFields.push(`email = $${paramCount}`);
      values.push(validatedData.email);
      paramCount++;
    }

    if (isAdmin && validatedData.newPassword !== undefined) {
      const hashedPassword = await hashPassword(validatedData.newPassword);
      updateFields.push(`password = $${paramCount}`);
      values.push(hashedPassword);
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

    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
