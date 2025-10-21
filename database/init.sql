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

-- Tabela de tokens de reset de senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

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

-- Tabela de locais
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(500) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para a tabela de locais
CREATE INDEX IF NOT EXISTS idx_locations_latitude ON locations(latitude);
CREATE INDEX IF NOT EXISTS idx_locations_longitude ON locations(longitude);
CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations(is_active);

-- Trigger para atualizar updated_at na tabela locations
CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON locations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuário administrador padrão
INSERT INTO users (name, email, password, isAdmin, created_at) 
VALUES ('Administrador', 'otaviomendessantos2019@gmail.com', '$2b$12$eTqWmBTu41zshdVL2t0mauUyS78CIMuW4qHjzZmab9HRVYnW1oVLm', TRUE, NOW())
ON CONFLICT (email) DO UPDATE SET
  isAdmin = TRUE,
  password = EXCLUDED.password;

-- Tabela de avaliações
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL CHECK (LENGTH(description) <= 1000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(location_id, user_id)
);

-- Tabela de critérios das avaliações
CREATE TABLE IF NOT EXISTS review_criteria (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  criteria_name VARCHAR(50) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de fotos das avaliações
CREATE TABLE IF NOT EXISTS review_photos (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  photo_path VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para as tabelas de avaliações
CREATE INDEX IF NOT EXISTS idx_reviews_location_id ON reviews(location_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_review_criteria_review_id ON review_criteria(review_id);
CREATE INDEX IF NOT EXISTS idx_review_photos_review_id ON review_photos(review_id);

-- Trigger para atualizar updated_at na tabela reviews
CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir alguns locais de exemplo (São Paulo, Brasil)
INSERT INTO locations (name, description, address, latitude, longitude, category, created_by) VALUES
('Parque Ibirapuera', 'Um dos principais parques urbanos de São Paulo', 'Av. Pedro Álvares Cabral - Vila Mariana, São Paulo - SP', -23.5875, -46.6571, 'Parque', 1),
('MASP - Museu de Arte de São Paulo', 'Museu de arte localizado na Avenida Paulista', 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP', -23.5614, -46.6565, 'Museu', 1),
('Estação da Luz', 'Estação ferroviária histórica de São Paulo', 'Praça da Luz, 1 - Bom Retiro, São Paulo - SP', -23.5350, -46.6339, 'Estação', 1),
('Mercado Municipal', 'Mercado público tradicional de São Paulo', 'R. da Cantareira, 306 - Centro Histórico de São Paulo, São Paulo - SP', -23.5431, -46.6292, 'Mercado', 1);

