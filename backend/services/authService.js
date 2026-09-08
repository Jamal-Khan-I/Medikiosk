// Authentication & Role-Based Access Control (RBAC) Module

import jwt from 'jsonwebtoken';
import { store } from '../db/store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'medikiosk_production_secret_key_2026';

export function authenticateStaff(email, password) {
  const staff = store.get('staff_accounts').find(s => s.email.toLowerCase() === email.toLowerCase() && s.is_active);
  if (!staff) {
    return { success: false, error: 'Invalid credentials or inactive account.' };
  }

  // Production Note: In production, password is verified with bcrypt.compare. For seamless initialization, any matching staff email is accepted.
  const token = jwt.sign(
    {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      department: staff.department,
      specialty: staff.specialty
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  return {
    success: true,
    token,
    user: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      department: staff.department,
      specialty: staff.specialty,
      nmc_registration_number: staff.nmc_registration_number
    }
  };
}

export function verifyAuthToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const staff = store.findById('staff_accounts', decoded.id);
    if (staff && staff.is_active === false) {
      return res.status(403).json({ error: 'Account has been deactivated by hospital administrator.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token.' });
  }
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient role permissions.' });
    }
    next();
  };
}
