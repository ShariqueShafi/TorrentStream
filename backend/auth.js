import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    // Hard stop — do not run with a fallback secret in production
    console.error('[FATAL] JWT_SECRET is not set. Exiting.');
    process.exit(1);
  } else {
    console.warn('[Auth] WARNING: JWT_SECRET not set — using insecure fallback for development only.');
  }
}

const SECRET = JWT_SECRET || 'dev_fallback_secret_do_not_use_in_prod';

export const generateToken = (user) => {
  return jwt.sign({ user }, SECRET, { expiresIn: '7d' });
};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};
