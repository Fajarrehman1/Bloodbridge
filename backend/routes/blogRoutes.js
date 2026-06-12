const express      = require('express');
const router       = express.Router();
const { protect }  = require('../middleware/authMiddleware');
const { adminOnly }= require('../middleware/adminMiddleware');
const {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  getAllBlogsAdmin
} = require('../controllers/blogController');

router.get('/',          getBlogs);
router.get('/admin/all', protect, adminOnly, getAllBlogsAdmin);
router.get('/:id',       getBlog);
router.post('/',         protect, adminOnly, createBlog);
router.put('/:id',       protect, adminOnly, updateBlog);
router.delete('/:id',    protect, adminOnly, deleteBlog);

module.exports = router;