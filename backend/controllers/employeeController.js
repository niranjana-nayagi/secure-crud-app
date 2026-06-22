const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');

// ─── GET /api/employees ────────────────────────────────────────────────────
exports.getEmployees = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, department, sort = '-createdAt' } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }
    if (department) {
      query.department = department;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [employees, total] = await Promise.all([
      Employee.find(query)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('createdBy', 'name email'),
      Employee.countDocuments(query),
    ]);

    await AuditLog.create({
      action: 'READ_EMPLOYEES',
      userId: req.user._id,
      userEmail: req.user.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
    });

    res.status(200).json({
      employees,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/employees/:id ────────────────────────────────────────────────
exports.getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('createdBy', 'name email');

    if (!employee || !employee.isActive) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    res.status(200).json({ employee });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/employees ───────────────────────────────────────────────────
exports.createEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.create({
      ...req.body,
      createdBy: req.user._id,
    });

    await AuditLog.create({
      action: 'CREATE_EMPLOYEE',
      userId: req.user._id,
      userEmail: req.user.email,
      resourceId: employee._id.toString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: `Created employee: ${employee.name}`,
    });

    res.status(201).json({ message: 'Employee created successfully.', employee });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/employees/:id ────────────────────────────────────────────────
exports.updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee || !employee.isActive) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    // Prevent updating createdBy
    delete req.body.createdBy;

    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await AuditLog.create({
      action: 'UPDATE_EMPLOYEE',
      userId: req.user._id,
      userEmail: req.user.email,
      resourceId: employee._id.toString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: `Updated employee: ${employee.name}`,
    });

    res.status(200).json({ message: 'Employee updated successfully.', employee: updated });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/employees/:id ─────────────────────────────────────────────
// RBAC: Only admin can delete
exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee || !employee.isActive) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    // Soft delete – preserve data for audit trail
    employee.isActive = false;
    await employee.save();

    await AuditLog.create({
      action: 'DELETE_EMPLOYEE',
      userId: req.user._id,
      userEmail: req.user.email,
      resourceId: employee._id.toString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: `Deleted employee: ${employee.name}`,
    });

    res.status(200).json({ message: 'Employee deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
