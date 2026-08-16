const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || 'smarttask_super_secret_key';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  user: process.env.POSTGRES_USER || 'smartuser',
  password: process.env.POSTGRES_PASSWORD || 'smartpass',
  database: process.env.POSTGRES_DB || 'smarttask_db',
  port: process.env.POSTGRES_PORT || 5432,
});

async function logAction(userId, action) {
  try {
    await pool.query('INSERT INTO audit_logs (user_id, action) VALUES ($1, $2)', [userId, action]);
  } catch (err) {
    console.error('Erreur Audit:', err.message);
  }
}

const authMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Jeton manquant' });
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Accès refusé : privilèges insuffisants' });
      }
      next();
    } catch (err) {
      res.status(401).json({ message: 'Jeton invalide' });
    }
  };
};

// Authentification
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userRes.rows.length === 0) return res.status(400).json({ message: 'Utilisateur introuvable' });
    const user = userRes.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Mot de passe incorrect' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    await logAction(user.id, `Connexion utilisateur (${user.role})`);
    res.json({ token, role: user.role, username: user.username, mustChangePassword: user.must_change_password });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tâches
app.get('/api/tasks', authMiddleware(), async (req, res) => {
  try {
    let query = `
      SELECT t.*, u1.username as creator, u2.username as assignee, g.name as group_name 
      FROM tasks t 
      LEFT JOIN users u1 ON t.created_by = u1.id 
      LEFT JOIN users u2 ON t.assigned_to = u2.id 
      LEFT JOIN groups g ON t.group_id = g.id
    `;
    if (req.user.role === 'USER') {
      query += ` WHERE t.created_by = ${req.user.id}`;
    } else if (req.user.role === 'TECHNICIEN') {
      query += ` WHERE t.assigned_to = ${req.user.id}`;
    }
    query += ' ORDER BY t.id DESC';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/tasks', authMiddleware(), async (req, res) => {
  const { title, description, priority, assigned_to, group_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, description, priority, created_by, assigned_to, group_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, priority || 'MOYENNE', req.user.id, assigned_to || null, group_id || null]
    );
    await logAction(req.user.id, `Création tâche "${title}"`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/tasks/:id', authMiddleware(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    await logAction(req.user.id, `Suppression tâche ID #${req.params.id}`);
    res.json({ message: 'Tâche supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Utilisateurs & Services
app.get('/api/admin/users', authMiddleware(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.role, u.must_change_password, g.name as group_name 
      FROM users u LEFT JOIN groups g ON u.group_id = g.id ORDER BY u.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/users', authMiddleware(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const { username, password, role, group_id } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password || 'admin123', 10);
    const result = await pool.query(
      'INSERT INTO users (username, password, role, group_id) VALUES ($1, $2, $3, $4) RETURNING id, username, role',
      [username, hashedPassword, role, group_id || null]
    );
    await logAction(req.user.id, `Création utilisateur "${username}" (${role})`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/users/:id', authMiddleware(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    await logAction(req.user.id, `Suppression utilisateur ID #${req.params.id}`);
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/groups', authMiddleware(), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM groups ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/groups', authMiddleware(['SUPER_ADMIN']), async (req, res) => {
  const { name, description } = req.body;
  try {
    const result = await pool.query('INSERT INTO groups (name, description) VALUES ($1, $2) RETURNING *', [name, description]);
    await logAction(req.user.id, `Création service "${name}"`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/groups/:id', authMiddleware(['SUPER_ADMIN']), async (req, res) => {
  try {
    await pool.query('DELETE FROM groups WHERE id = $1', [req.params.id]);
    await logAction(req.user.id, `Suppression service ID #${req.params.id}`);
    res.json({ message: 'Service supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Audit (Restreint SUPER_ADMIN)
app.get('/api/admin/audit-logs', authMiddleware(['SUPER_ADMIN']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.action, a.created_at, u.username 
      FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.id DESC LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/reports', authMiddleware(['SUPER_ADMIN']), async (req, res) => {
  try {
    const statsTasks = await pool.query('SELECT status, COUNT(*) FROM tasks GROUP BY status');
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const totalGroups = await pool.query('SELECT COUNT(*) FROM groups');
    res.json({
      tasksByStatus: statsTasks.rows,
      totalUsers: totalUsers.rows[0].count,
      totalGroups: totalGroups.rows[0].count,
      serverUptime: Math.floor(process.uptime()) + 's'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
