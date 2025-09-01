'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Verificar se o usuário já está logado
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/home');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Bem-vindo ao Acessae
          </CardTitle>
          <CardDescription className="text-center">
            Faça login ou crie uma conta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Link href="/login">
              <Button className="w-full">
                Entrar
              </Button>
            </Link>
            <Link href="/cadastro">
              <Button variant="outline" className="w-full">
                Cadastrar
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
