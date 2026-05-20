import User from '../models/User.js';
import { verifyToken } from '../utils/jwt.js';

/**
 * Verifies Bearer JWT and attaches full user document to req.user.
 */
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const raw = header.split(' ')[1];
    if (!raw) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const decoded = verifyToken(raw);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    req.tokenRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
