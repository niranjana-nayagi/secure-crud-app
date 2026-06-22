const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { productValidation, productUpdateValidation, handleValidation } = require('../middleware/validate');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'user', 'employee'), getProducts)
  .post(authorize('admin'), productValidation, handleValidation, createProduct);

router.route('/:id')
  .get(authorize('admin', 'user', 'employee'), getProduct)
  .put(authorize('admin', 'employee'), productUpdateValidation, handleValidation, updateProduct)
  .delete(authorize('admin'), deleteProduct);

module.exports = router;
