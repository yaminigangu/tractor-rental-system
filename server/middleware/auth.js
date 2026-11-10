import crypto from 'node:crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'agri-rent-telangana-jwt-secret-key-2026-production';

/**
 * Base64URL encoding helper
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Signs a standard HS256 JWT token with customizable validity (default 14 days)
 * payload: { id, mobile, name, role }
 */
export function generateToken(payload, expiresInMs = 14 * 24 * 60 * 60 * 1000) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Date.now() + expiresInMs;
  const fullPayload = { ...payload, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies HS256 JWT token signature and expiration
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;

  // Re-compute signature
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSig) {
    return null; // Invalid signature
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired token
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Express middleware to extract and verify JWT authentication token
 * Attaches decoded user to req.user
 */
export function authenticateUser(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    const user = verifyToken(token);
    if (user) {
      req.user = user;
    }
  }

  next();
}

/**
 * Strict authentication guard middleware
 * Returns 401 Unauthorized if no valid JWT is present
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Valid authentication token is required.',
      code: 'AUTH_REQUIRED'
    });
  }
  next();
}

/**
 * Standardize user role to canonical uppercase: 'FARMER', 'VEHICLE_OWNER', 'ADMIN'
 */
export function normalizeRole(role) {
  if (!role) return '';
  const r = String(role).toUpperCase().trim();
  if (r === 'OWNER' || r === 'VEHICLE_OWNER' || r === 'CAPTAIN') return 'VEHICLE_OWNER';
  if (r === 'FARMER' || r === 'CUSTOMER') return 'FARMER';
  if (r === 'ADMIN' || r === 'ADMINISTRATOR') return 'ADMIN';
  return r;
}

/**
 * Role-Based Access Control (RBAC) middleware
 * Returns 403 Forbidden if user role is not authorized
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = normalizeRole(req.user.role);
    const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));

    if (!normalizedAllowed.includes(userRole)) {
      const isAdminOnly = normalizedAllowed.length === 1 && normalizedAllowed[0] === 'ADMIN';
      return res.status(403).json({
        success: false,
        error: isAdminOnly
          ? 'Forbidden: Admin access required'
          : 'Forbidden: You do not have permission to access this resource or perform this action.',
        code: 'FORBIDDEN',
        requiredRole: allowedRoles.join(', '),
        userRole: req.user.role
      });
    }

    next();
  };
}

export const requireAdmin = requireRole('ADMIN');
export const requireFarmer = requireRole('FARMER');
export const requireOwner = requireRole('VEHICLE_OWNER');

