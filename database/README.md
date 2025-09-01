# Configuração do Banco de Dados

## Pré-requisitos

1. PostgreSQL instalado e rodando
2. Acesso ao PostgreSQL via linha de comando ou pgAdmin

## Configuração

### 1. Criar o banco de dados

```sql
CREATE DATABASE acessae;
```

### 2. Executar o script de inicialização

```bash
# Via linha de comando
psql -U postgres -d acessae -f database/init.sql

# Ou conecte-se ao banco acessae e execute o conteúdo do arquivo init.sql
```

### 3. Configurar variáveis de ambiente

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

### 4. Testar a conexão

Execute o projeto em modo de desenvolvimento:

```bash
yarn dev
```

Acesse `http://localhost:3000` e teste o cadastro e login.

## Estrutura das Tabelas

### users
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(255) NOT NULL)
- `email` (VARCHAR(255) UNIQUE NOT NULL)
- `password` (VARCHAR(255) NOT NULL) - Hash bcrypt
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

## Comandos Úteis

```sql
-- Listar usuários
SELECT id, name, email, created_at FROM users;

-- Limpar tabela de usuários (cuidado!)
TRUNCATE TABLE users RESTART IDENTITY;

-- Verificar se a tabela foi criada
\dt
```

