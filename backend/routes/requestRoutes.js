const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createRequest,
  getRequests,
  closeRequest,
  getMyRequests
} = require('../controllers/requestController');

router.get('/my-requests', protect, getMyRequests);
router.get('/',            getRequests);
router.post('/',           protect, createRequest);
router.put('/:id/close',   protect, closeRequest);

module.exports = router;