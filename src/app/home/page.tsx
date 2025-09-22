'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Users, User } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string; isAdmin?: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch {
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handleAdminPanel = () => {
    router.push('/admin');
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Acessae
            </h1>
            <div className="flex space-x-2">
              <Button onClick={handleProfile} variant="outline">
                <User className="h-4 w-4 mr-2" />
                Meu Perfil
              </Button>
              <Button onClick={handleLogout} variant="outline">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {user?.isAdmin && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Settings className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700 font-medium">
                    Olá adm {user.name}
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleAdminPanel}
                variant="outline"
                size="sm"
                className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
              >
                <Users className="h-4 w-4 mr-2" />
                Administração
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-green-600">
                Login realizado com sucesso!
              </CardTitle>
              <CardDescription className="text-center">
                Bem-vindo ao Acessae
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Informações do usuário:
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-green-700 dark:text-green-300">
                      <strong>Nome:</strong> {user.name}
                    </p>
                    <p className="text-green-700 dark:text-green-300">
                      <strong>Email:</strong> {user.email}
                    </p>
                    <p className="text-green-700 dark:text-green-300">
                      <strong>Tipo:</strong> {user.isAdmin ? 'Administrador' : 'Usuário'}
                    </p>
                  </div>
                </div>
              )}

              <div className="text-center text-gray-600 dark:text-gray-400">
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

