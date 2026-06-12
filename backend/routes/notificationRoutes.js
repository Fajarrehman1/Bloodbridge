const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { getNotifications, markRead, markAllRead, deleteNotification } = require('../controllers/notificationController');

router.get('/',          protect, getNotifications);
router.put('/read-all',  protect, markAllRead);
router.put('/:id/read',  protect, markRead);
router.delete('/:id',    protect, deleteNotification);

module.exports = router;