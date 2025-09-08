import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import pool from '@/lib/db';
import { emailService } from '@/lib/email-service';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Verificar se o usuário existe
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      // Por segurança, retornamos sucesso mesmo se o email não existir
      return NextResponse.json({
        message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.',
      });
    }

    const user = userResult.rows[0];

    // Gerar token único
    const token = crypto.randomBytes(32).toString('hex');

    // Salvar token no banco (remover tokens antigos do usuário primeiro)
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [user.id]
    );

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token) VALUES ($1, $2)',
      [user.id, token]
    );

    // URL de reset
    const resetUrl = `${process.env.NEXTAUTH_URL}/redefinir-senha?token=${token}`;

    // Enviar email usando template
    await emailService.sendResetPasswordEmail(email, {
      userName: user.name,
      resetUrl: resetUrl,
    });

    return NextResponse.json({
      message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.',
    });

  } catch (error) {
    console.error('Erro ao processar esqueci senha:', error);
    
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
