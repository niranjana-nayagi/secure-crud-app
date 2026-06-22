const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'REGISTER',
        'LOGIN',
        'LOGIN_FAILED',
        'LOGOUT',
        'CREATE_EMPLOYEE',
        'READ_EMPLOYEES',
        'UPDATE_EMPLOYEE',
        'DELETE_EMPLOYEE',
        'AI_SUMMARY',
        'UNAUTHORIZED_ACCESS',
      ],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userEmail: {
      type: String,
    },
    resourceId: {
      type: String,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      required: true,
    },
    details: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
