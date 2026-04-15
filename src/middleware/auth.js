const jwt = require('jsonwebtoken');

// This runs before protected routes — checks the token in the request header
module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next(); // allow the request to continue
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};