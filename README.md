# Acessae

Sistema de autenticação desenvolvido com Next.js, React, TypeScript e PostgreSQL.

## 🚀 Como rodar o projeto pela primeira vez

### Pré-requisitos

- Node.js (versão 18 ou superior)
- Yarn
- PostgreSQL instalado e rodando

### 1. Clone e instale as dependências

```bash
# Clone o repositório
git clone https://github.com/OtavioMendesSantos/Acessae.git
cd Acessae

# Instale as dependências
yarn install
```

### 2. Configure o banco de dados PostgreSQL

#### Criar o banco:
```sql
# Conecte-se ao PostgreSQL
psql -U postgres

# Criar o banco de dados
CREATE DATABASE acessae;

# Sair do psql
\q
```

#### Executar o script de inicialização:
```bash
# Execute o script SQL para criar as tabelas
psql -U postgres -d acessae -f database/init.sql
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/acessae"

# JWT
JWT_SECRET="seu-jwt-secret-muito-seguro"
JWT_EXPIRES_IN="7d"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-nextauth-secret-muito-seguro"
```

**⚠️ Importante:** Substitua `sua_senha` pela senha do seu PostgreSQL e use secrets seguros em produção.

### 4. Execute o projeto

```bash
yarn dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### 5. Teste o sistema

1. Acesse a página inicial
2. Clique em **"Cadastrar"** para criar uma nova conta
3. Preencha os dados e confirme o cadastro
4. Você será redirecionado para a página home com sucesso
5. Teste também o login na página de **"Entrar"**

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/auth/          # Rotas de API para autenticação
│   ├── cadastro/          # Página de cadastro
│   ├── login/             # Página de login
│   ├── home/              # Página protegida
│   └── page.tsx           # Página inicial
├── components/ui/         # Componentes do shadcn/ui
├── lib/
│   ├── auth.ts           # Funções de autenticação
│   ├── db.ts             # Configuração do banco
│   ├── utils.ts          # Utilitários
│   └── validations.ts    # Schemas de validação
database/
├── init.sql              # Script de inicialização do banco
└── README.md             # Documentação do banco
```

## 🛠 Tecnologias

- [Next.js 15](https://nextjs.org/) - Framework React
- [React 19](https://reactjs.org/) - Biblioteca de interface
- [TypeScript](https://www.typescriptlang.org/) - Tipagem estática
- [Tailwind CSS 4](https://tailwindcss.com/) - Framework CSS
- [shadcn/ui](https://ui.shadcn.com/) - Componentes de interface
- [React Hook Form](https://react-hook-form.com/) - Gerenciamento de formulários
- [Zod](https://zod.dev/) - Validação de esquemas
- [PostgreSQL](https://www.postgresql.org/) - Banco de dados
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) - Hash de senhas
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - Autenticação JWT

## 📋 Funcionalidades

- ✅ Sistema de cadastro com validação
- ✅ Sistema de login com JWT
- ✅ Proteção de rotas
- ✅ Validação de formulários em tempo real
- ✅ Interface responsiva e moderna
- ✅ Feedback visual de carregamento
- ✅ Tratamento de erros

## 🗃 Comandos do Banco

```sql
-- Listar usuários
SELECT id, name, email, created_at FROM users;

-- Limpar tabela de usuários (cuidado!)
TRUNCATE TABLE users RESTART IDENTITY;

-- Verificar estrutura das tabelas
\dt
```

## 📝 Scripts

- `yarn dev` - Executa o projeto em modo de desenvolvimento
- `yarn build` - Gera o build de produção
- `yarn start` - Executa o projeto em modo de produção
- `yarn lint` - Executa o linting do código
