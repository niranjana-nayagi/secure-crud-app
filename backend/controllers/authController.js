const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ─── POST /api/auth/register ───────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const userCount = await User.countDocuments();
    let assignedRole = 'user';

    if (userCount === 0) {
      assignedRole = 'admin';
    } else if (role === 'employee') {
      const employeeRecord = await Employee.findOne({ email: email.toLowerCase(), isActive: true });
      if (!employeeRecord) {
        return res.status(403).json({
          message: 'Employee registration is only available for emails added by an admin.',
        });
      }
      assignedRole = 'employee';
    }

    const user = await User.create({ name, email, password, role: assignedRole });

    await AuditLog.create({
      action: 'REGISTER',
      userId: user._id,
      userEmail: user.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
    });

    const token = signToken(user._id);

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/login ──────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.isActive) {
      await AuditLog.create({
        action: 'LOGIN_FAILED',
        userEmail: email,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure',
        details: 'User not found or inactive',
      });
      // OWASP: same message for both "user not found" and "wrong password"
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.isLocked()) {
      return res.status(423).json({ message: 'Account temporarily locked. Try again later.' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
      }
      await user.save({ validateBeforeSave: false });

      await AuditLog.create({
        action: 'LOGIN_FAILED',
        userId: user._id,
        userEmail: email,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure',
        details: `Failed attempt ${user.loginAttempts}`,
      });

      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.role !== role) {
      await AuditLog.create({
        action: 'LOGIN_FAILED',
        userId: user._id,
        userEmail: email,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure',
        details: 'Role mismatch',
      });
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await AuditLog.create({
      action: 'LOGIN',
      userId: user._id,
      userEmail: user.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
    });

    const token = signToken(user._id);

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.status(200).json({
    user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
  });
};
