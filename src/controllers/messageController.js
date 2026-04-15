const pool = require('../config/db');

// Block personal contact details in messages
function hasContactDetails(text) {
  return /([0-9]{7,}|[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/.test(text);
}

exports.getConversations = async (req, res) => {
  try {
    const me = req.user.id;
    const r  = await pool.query(
      `SELECT DISTINCT ON (CASE WHEN from_id=$1 THEN to_id ELSE from_id END)
         CASE WHEN from_id=$1 THEN to_id ELSE from_id END AS other_id,
         body, sent_at
       FROM messages
       WHERE from_id=$1 OR to_id=$1
       ORDER BY other_id, sent_at DESC`,
      [me]
    );
    res.json(r.rows);
  } catch(e) { res.status(500).json({error:e.message}); }
};

exports.getMessages = async (req, res) => {
  try {
    const me = req.user.id, other = req.params.otherId;
    const r  = await pool.query(
      'SELECT * FROM messages WHERE (from_id=$1 AND to_id=$2) OR (from_id=$2 AND to_id=$1) ORDER BY sent_at ASC',
      [me, other]
    );
    await pool.query(
      'UPDATE messages SET read=true WHERE to_id=$1 AND from_id=$2 AND read=false',
      [me, other]
    );
    res.json(r.rows);
  } catch(e) { res.status(500).json({error:e.message}); }
};

exports.sendMessage = async (req, res) => {
  try {
    const { to_id, body } = req.body;
    if (!body || !to_id) return res.status(400).json({error:'to_id and body required'});
    if (hasContactDetails(body))
      return res.status(400).json({error:'Sharing contact details is not allowed on ProLink'});
    const r = await pool.query(
      'INSERT INTO messages (from_id,to_id,body) VALUES ($1,$2,$3) RETURNING *',
      [req.user.id, to_id, body]
    );
    res.status(201).json(r.rows[0]);
  } catch(e) { res.status(500).json({error:e.message}); }
};