const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// ─── Verify JWT ────────────────────────────────────────────────────────────
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Access denied. User not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Access denied. Invalid token.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access denied. Token expired.' });
    }
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// ─── Role-Based Access Control ─────────────────────────────────────────────
exports.authorize = (...roles) => {
  return async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      await AuditLog.create({
        action: 'UNAUTHORIZED_ACCESS',
        userId: req.user._id,
        userEmail: req.user.email,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure',
        details: `Role '${req.user.role}' attempted to access resource restricted to: ${roles.join(', ')}`,
      });

      return res.status(403).json({
        message: 'Access denied. You do not have permission to perform this action.',
      });
    }
    next();
  };
};
