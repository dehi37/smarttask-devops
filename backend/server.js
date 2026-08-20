const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'smarttask_smarttech_secret_2026';

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'smartuser',
  host: process.env.POSTGRES_HOST || 'smarttask-postgres',
  database: process.env.POSTGRES_DB || 'smarttask_db',
  password: process.env.POSTGRES_PASSWORD || 'smartpass',
  port: 5432,
});

const logAction = async (userId, action) => {
  try {
    await pool.query('INSERT INTO audit_logs (user_id, action) VALUES ($1, $2)', [userId, action]);
  } catch (err) {
    console.error('Erreur audit log:', err.message);
  }
};

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Token manquant' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: 'Token invalide' });
      if (user.role !== 'SUPER_ADMIN' && roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }
      req.user = user;
      next();
    });
  };
};

// Connexion
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(400).json({ message: 'Utilisateur introuvable' });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Mot de passe incorrect' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, mustChangePassword: user.must_change_password },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    await logAction(user.id, `Connexion utilisateur (${user.role})`);
    res.json({ token, username: user.username, role: user.role, mustChangePassword: user.must_change_password });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Changement de mot de passe (1ère Connexion)
app.post('/api/change-password', authMiddleware(), async (req, res) => {
  const { newPassword } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1, must_change_password = FALSE WHERE id = $2', [hashedPassword, req.user.id]);
    await logAction(req.user.id, 'Changement de mot de passe initial réussi');
    res.json({ message: 'Mot de passe mis à jour' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Gestion des Tâches
app.get('/api/tasks', authMiddleware(['USER', 'TECHNICIEN', 'SUPERVISEUR', 'ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    let query = `
      SELECT t.id, t.title, t.description, t.priority, t.status, t.created_at,
             u1.username AS creator, u2.username AS assignee, g.name AS group_name
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

app.post('/api/tasks', authMiddleware(['USER', 'SUPERVISEUR', 'ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const { title, description, priority, assignedTo, groupId } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, description, priority, created_by, assigned_to, group_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, priority || 'MOYENNE', req.user.id, assignedTo || null, groupId || null]
    );
    await logAction(req.user.id, `Création tâche : "${title}"`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/tasks/:id/status', authMiddleware(['TECHNICIEN', 'SUPERVISEUR', 'ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, req.params.id]);
    await logAction(req.user.id, `Changement statut tâche #${req.params.id} -> ${status}`);
    res.json({ message: 'Statut mis à jour' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Suppression d'une tâche (ADMIN et SUPER_ADMIN)
app.delete('/api/tasks/:id', authMiddleware(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const taskResult = await pool.query('SELECT title FROM tasks WHERE id = $1', [req.params.id]);
    if (taskResult.rows.length === 0) return res.status(404).json({ message: 'Tâche introuvable' });

    const title = taskResult.rows[0].title;
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    await logAction(req.user.id, `Suppression de la tâche #${req.params.id} ("${title}")`);
    res.json({ message: 'Tâche supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Administration Utilisateurs
app.get('/api/admin/users', authMiddleware(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.role, u.must_change_password, g.name AS group_name 
      FROM users u LEFT JOIN groups g ON u.group_id = g.id ORDER BY u.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/users', authMiddleware(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  const { username, password, role, groupId } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password || 'password123', 10);
    const result = await pool.query(
      'INSERT INTO users (username, password, role, group_id, must_change_password) VALUES ($1, $2, $3, $4, TRUE) RETURNING id, username, role',
      [username, hashedPassword, role, groupId || null]
    );
    await logAction(req.user.id, `Création utilisateur "${username}" (${role})`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Suppression d'un utilisateur (ADMIN et SUPER_ADMIN)
app.delete('/api/admin/users/:id', authMiddleware(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    if (targetId === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }

    const userResult = await pool.query('SELECT username, role FROM users WHERE id = $1', [targetId]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const targetUser = userResult.rows[0];

    // Seul le SUPER_ADMIN peut supprimer un autre SUPER_ADMIN ou un ADMIN
    if (req.user.role !== 'SUPER_ADMIN' && (targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN')) {
      return res.status(403).json({ message: 'Permissions insuffisantes pour supprimer cet administrateur.' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [targetId]);
    await logAction(req.user.id, `Suppression de l'utilisateur "${targetUser.username}" (#${targetId})`);
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Administration Services / Groupes
app.get('/api/admin/groups', authMiddleware(['SUPER_ADMIN', 'ADMIN', 'SUPERVISEUR']), async (req, res) => {
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
    await logAction(req.user.id, `Création service/groupe "${name}"`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Suppression d'un service (SUPER_ADMIN uniquement)
app.delete('/api/admin/groups/:id', authMiddleware(['SUPER_ADMIN']), async (req, res) => {
  try {
    const groupResult = await pool.query('SELECT name FROM groups WHERE id = $1', [req.params.id]);
    if (groupResult.rows.length === 0) return res.status(404).json({ message: 'Service introuvable' });

    const name = groupResult.rows[0].name;
    await pool.query('DELETE FROM groups WHERE id = $1', [req.params.id]);
    await logAction(req.user.id, `Suppression du service "${name}" (#${req.params.id})`);
    res.json({ message: 'Service supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/audit-logs', authMiddleware(['SUPER_ADMIN']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.action, a.created_at, u.username 
      FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.id DESC LIMIT 50
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

// Endpoint de santé (Healthcheck)
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: err.message });
  }
});

app.listen(5000, () => console.log('SmartTask Backend écoute sur le port 5000'));
