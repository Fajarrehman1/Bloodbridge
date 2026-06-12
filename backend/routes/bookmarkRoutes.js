const express     = require('express');
const router      = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  addBookmark,
  getBookmarks,
  removeBookmark,
  isBookmarked
} = require('../controllers/bookmarkController');

router.get('/',                 protect, getBookmarks);
router.post('/',                protect, addBookmark);
router.get('/check/:donorId',   protect, isBookmarked);
router.delete('/:donorId',      protect, removeBookmark);

module.exports = router;