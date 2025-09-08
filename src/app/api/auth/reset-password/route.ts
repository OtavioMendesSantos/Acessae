import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { passwordSchema } from '@/lib/validations';

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  password: passwordSchema,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Verificar se o token existe e é válido
    const tokenResult = await pool.query(
      'SELECT user_id FROM password_reset_tokens WHERE token = $1',
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    const userId = tokenResult.rows[0].user_id;

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Atualizar a senha do usuário
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );

    // Remover o token usado (e todos os outros tokens do usuário)
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [userId]
    );

    return NextResponse.json({
      message: 'Senha redefinida com sucesso',
    });

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
