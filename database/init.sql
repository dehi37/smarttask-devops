CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    group_id INT REFERENCES groups(id) ON DELETE SET NULL,
    must_change_password BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'MOYENNE' CHECK (priority IN ('BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE')),
    status VARCHAR(20) DEFAULT 'A_FAIRE' CHECK (status IN ('A_FAIRE', 'EN_COURS', 'EN_REVUE', 'TERMINE')),
    created_by INT REFERENCES users(id) ON DELETE CASCADE,
    assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
    group_id INT REFERENCES groups(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

TRUNCATE audit_logs, tasks, users, groups RESTART IDENTITY CASCADE;

INSERT INTO groups (name, description) VALUES
('Direction IT', 'Infrastructures Cloud & Sécurité'),
('Support Technique', 'Assistance et opérations SI'),
('Développement', 'Conception et delivery logiciel');

-- Mot de passe initial pour tous : 'password123'
INSERT INTO users (username, password, role, group_id, must_change_password) VALUES
('dehi', '$2a$10$e83p3M154L4N9L1yV1234u3s.O1m7L1k8j9h0g1f2e3d4c5b6a7b8', 'SUPER_ADMIN', 1, FALSE),
('admin_user', '$2a$10$e83p3M154L4N9L1yV1234u3s.O1m7L1k8j9h0g1f2e3d4c5b6a7b8', 'ADMIN', 1, TRUE),
('sup_user', '$2a$10$e83p3M154L4N9L1yV1234u3s.O1m7L1k8j9h0g1f2e3d4c5b6a7b8', 'SUPERVISEUR', 2, TRUE),
('tech_user', '$2a$10$e83p3M154L4N9L1yV1234u3s.O1m7L1k8j9h0g1f2e3d4c5b6a7b8', 'TECHNICIEN', 2, TRUE),
('simple_user', '$2a$10$e83p3M154L4N9L1yV1234u3s.O1m7L1k8j9h0g1f2e3d4c5b6a7b8', 'USER', 3, TRUE);

INSERT INTO tasks (title, description, priority, status, created_by, assigned_to, group_id) VALUES
('Déploiement du cluster Kubernetes', 'Purger les anciens registres et migrer les pods de production', 'CRITIQUE', 'EN_COURS', 1, 4, 1),
('Audit des règles Pare-feu', 'Analyse annuelle des flux d accès et fermeture des ports obsolètes', 'HAUTE', 'A_FAIRE', 2, 4, 2),
('Optimisation du Pipeline CI/CD', 'Intégrer les tests de sécurité SAST dans le build Jenkins', 'MOYENNE', 'A_FAIRE', 1, 5, 3);
