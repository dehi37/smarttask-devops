-- Création des tables
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'TECHNICIEN', 'SUPERVISEUR', 'ADMIN', 'SUPER_ADMIN')),
    group_id INT REFERENCES groups(id) ON DELETE SET NULL,
    must_change_password BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'MOYENNE' CHECK (priority IN ('BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE')),
    status VARCHAR(20) DEFAULT 'A_FAIRE' CHECK (status IN ('A_FAIRE', 'EN_COURS', 'TERMINE')),
    created_by INT REFERENCES users(id) ON DELETE CASCADE,
    assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
    group_id INT REFERENCES groups(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Données initiales (Services)
INSERT INTO groups (name, description) VALUES 
('Direction IT', 'Infrastructures Cloud & Sécurité'),
('Support Technique', 'Assistance et opérations SI'),
('Développement', 'Conception et delivery logiciel')
ON CONFLICT (name) DO NOTHING;

-- Mots de passe par défaut : admin123
INSERT INTO users (username, password, role, group_id, must_change_password) VALUES
('dehi', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPG.e8Cve', 'SUPER_ADMIN', 1, false),
('admin_user', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPG.e8Cve', 'ADMIN', 1, true),
('sup_user', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPG.e8Cve', 'SUPERVISEUR', 2, true),
('tech_user', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPG.e8Cve', 'TECHNICIEN', 2, true),
('simple_user', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPG.e8Cve', 'USER', 3, true)
ON CONFLICT (username) DO NOTHING;
