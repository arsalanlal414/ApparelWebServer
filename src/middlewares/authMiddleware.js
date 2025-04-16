import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  try {
    // Extract token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request (excluding password)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ success: false, msg: 'User not found' });
      }

      req.user = user;
      next();
    } else {
      return res.status(401).json({ success: false, msg: 'Not authorized, no token' });
    }
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ success: false, msg: 'Not authorized, token failed' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({ message: 'Access denied: Admins only' });
};