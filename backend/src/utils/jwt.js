import jwt from 'jsonwebtoken';

/**
 * Sign a JWT for API authentication.
 * Payload keeps id and role for RBAC without DB round-trip on every check.
 */
export function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId: user._id.toString(), role: user.role }, secret, {
    expiresIn,
  });
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.verify(token, secret);
}
