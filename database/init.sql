-- Criar banco de dados (execute este comando fora do script)
-- CREATE DATABASE acessae;

-- Conecte-se ao banco acessae e execute os comandos abaixo

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  isAdmin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuário administrador padrão
INSERT INTO users (name, email, password, isAdmin, created_at) 
VALUES ('Administrador', 'otaviomendessantos2019@gmail.com', '$2b$12$eTqWmBTu41zshdVL2t0mauUyS78CIMuW4qHjzZmab9HRVYnW1oVLm', TRUE, NOW())
ON CONFLICT (email) DO UPDATE SET
  isAdmin = TRUE,
  password = EXCLUDED.password;

