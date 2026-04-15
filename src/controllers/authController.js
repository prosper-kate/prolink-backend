const pool   = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

// REGISTER — creates a new user
// TODO: Add SendGrid email verification when backend is deployed
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, skill, phone } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: 'Name, email, password and role are required' });

    const exists = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email.toLowerCase()]
    );
    if (exists.rows.length > 0)
      return res.status(400).json({ error: 'An account with this email already exists' });

    const hash   = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (name,email,password,role,skill,phone) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,name,email,role,plan,verified,joined_at',
      [name.trim(), email.toLowerCase().trim(), hash, role, skill||null, phone||null]
    );
    const user  = result.rows[0];
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// LOGIN — checks credentials and returns a token
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET PROFILE — returns the logged-in user's data
exports.getProfile = async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id,name,email,role,skill,bio,rate,location,skills,plan,verified,earnings,balance,joined_at FROM users WHERE id=$1',
      [req.user.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};