const router    = require('express').Router();
const { protect }   = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const {
  getDashboardStats, getAllUsers, deleteUser, getAllDonors,
  toggleDonorAvailability, getAllRequests, deleteRequest,
  broadcastNotification, changeUserRole
} = require('../controllers/adminController');

router.use(protect, adminOnly);

router.get('/stats',              getDashboardStats);
router.get('/users',              getAllUsers);
router.delete('/users/:id',       deleteUser);
router.put('/users/:id/role',     changeUserRole);
router.get('/donors',             getAllDonors);
router.put('/donors/:id/toggle',  toggleDonorAvailability);
router.get('/requests',           getAllRequests);
router.delete('/requests/:id',    deleteRequest);
router.post('/broadcast',         broadcastNotification);

module.exports = router;