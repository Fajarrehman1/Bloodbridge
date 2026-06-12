const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { createRequest, getRequests, closeRequest } = require('../controllers/requestController');

router.get('/',            getRequests);
router.post('/',           protect, createRequest);
router.put('/:id/close',   protect, closeRequest);

module.exports = router;