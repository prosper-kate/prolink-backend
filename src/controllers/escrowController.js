const pool       = require('../config/db');
const SERVICE    = 0.05;  // 5% fee charged to client on top of job amount
const COMMISSION = 0.08;  // 8% from pro payout — this is ProLink's revenue

exports.createEscrow = async (req, res) => {
  try {
    const { job_id, pro_id, amount, method } = req.body;
    const fee   = parseFloat((amount * SERVICE).toFixed(2));
    const total = parseFloat((+amount + fee).toFixed(2));
    const r = await pool.query(
      'INSERT INTO escrow (job_id,client_id,pro_id,amount,fee,total,method) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [job_id, req.user.id, pro_id, amount, fee, total, method]
    );
    await pool.query('UPDATE jobs SET status=$1 WHERE id=$2', ['active', job_id]);
    res.status(201).json({ escrow: r.rows[0], message: 'Payment held in escrow' });
  } catch(e) { res.status(500).json({error:e.message}); }
};

exports.getEscrows = async (req, res) => {
  try {
    const id = req.user.id;
    const r  = await pool.query(
      'SELECT e.*, j.title FROM escrow e JOIN jobs j ON e.job_id=j.id WHERE e.client_id=$1 OR e.pro_id=$1 ORDER BY e.created_at DESC',
      [id]
    );
    res.json(r.rows);
  } catch(e) { res.status(500).json({error:e.message}); }
};

exports.releaseEscrow = async (req, res) => {
  try {
    const esc = await pool.query('SELECT * FROM escrow WHERE id=$1', [req.params.id]);
    const e   = esc.rows[0];
    if (!e) return res.status(404).json({error:'Escrow not found'});
    if (e.status !== 'held') return res.status(400).json({error:'Escrow already processed'});
    if (e.client_id !== req.user.id) return res.status(403).json({error:'Only the client can release payment'});

    const commission = parseFloat((e.amount * COMMISSION).toFixed(2));
    const net        = parseFloat((e.amount - commission).toFixed(2));

    await pool.query('UPDATE escrow SET status=$1, released_at=NOW() WHERE id=$2', ['released', e.id]);
    await pool.query('UPDATE users SET balance=balance+$1, earnings=earnings+$1 WHERE id=$2', [net, e.pro_id]);
    await pool.query('UPDATE jobs SET status=$1 WHERE id=$2', ['completed', e.job_id]);
    await pool.query(
      'INSERT INTO transactions (user_id,type,amount,description) VALUES ($1,$2,$3,$4)',
      [e.pro_id, 'credit', net, 'Job payment released']
    );
    await pool.query(
      'INSERT INTO notifications (user_id,title,description) VALUES ($1,$2,$3)',
      [e.pro_id, 'Payment Released', 'Your payment of P' + net + ' has been released to your balance.']
    );
    res.json({ message: 'Payment released successfully', net, commission, prolink_earned: commission });
  } catch(e) { res.status(500).json({error:e.message}); }
};

exports.disputeEscrow = async (req, res) => {
  try {
    await pool.query('UPDATE escrow SET status=$1 WHERE id=$2', ['disputed', req.params.id]);
    res.json({message:'Dispute opened. Admin will review within 24 hours.'});
  } catch(e) { res.status(500).json({error:e.message}); }
};