const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');

exports.getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, sort = '-createdAt' } = req.query;

    const query = { isActive: true };
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query).sort(sort).skip(skip).limit(Number(limit)).populate('createdBy', 'name email'),
      Product.countDocuments(query),
    ]);

    await AuditLog.create({
      action: 'READ_PRODUCTS',
      userId: req.user._id,
      userEmail: req.user.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
    });

    res.status(200).json({
      products,
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

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('createdBy', 'name email');

    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.status(200).json({ product });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({
      ...req.body,
      createdBy: req.user._id,
    });

    await AuditLog.create({
      action: 'CREATE_PRODUCT',
      userId: req.user._id,
      userEmail: req.user.email,
      resourceId: product._id.toString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: `Created product: ${product.name}`,
    });

    res.status(201).json({ message: 'Product created successfully.', product });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    delete req.body.createdBy;

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await AuditLog.create({
      action: 'UPDATE_PRODUCT',
      userId: req.user._id,
      userEmail: req.user.email,
      resourceId: product._id.toString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: `Updated product: ${product.name}`,
    });

    res.status(200).json({ message: 'Product updated successfully.', product: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    product.isActive = false;
    await product.save();

    await AuditLog.create({
      action: 'DELETE_PRODUCT',
      userId: req.user._id,
      userEmail: req.user.email,
      resourceId: product._id.toString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: `Deleted product: ${product.name}`,
    });

    res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
