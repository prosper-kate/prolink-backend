const pool = require('../config/db');

exports.getJobs = async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT j.*, u.name AS client_name FROM jobs j JOIN users u ON j.client_id=u.id WHERE j.status=$1 ORDER BY j.created_at DESC',
      ['open']
    );
    res.json(r.rows);
  } catch(e) { res.status(500).json({error:e.message}); }
};

exports.createJob = async (req, res) => {
  try {
    const { title, description, category, budget, location, urgency } = req.body;
    if (!title) return res.status(400).json({ error: 'Job title is required' });
    const r = await pool.query(
      'INSERT INTO jobs (title,description,category,budget,location,urgency,client_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title, description, category, budget, location, urgency, req.user.id]
    );
    res.status(201).json(r.rows[0]);
  } catch(e) { res.status(500).json({error:e.message}); }
};

exports.getJob = async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM jobs WHERE id=$1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Job not found' });
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({error:e.message}); }
};

exports.updateJob = async (req, res) => {
  try {
    const { status, pro_id } = req.body;
    const r = await pool.query(
      'UPDATE jobs SET status=$1, pro_id=$2 WHERE id=$3 RETURNING *',
      [status, pro_id, req.params.id]
    );
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({error:e.message}); }
};