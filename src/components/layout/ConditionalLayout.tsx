'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Páginas que não devem mostrar a navbar
  const authPages = [
    '/login',
    '/cadastro', 
    '/esqueci-senha',
    '/redefinir-senha',
    '/'
  ];
  
  const shouldShowNavbar = !authPages.includes(pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
    </>
  );
}

