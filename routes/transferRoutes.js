const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/transferController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/initiate', ctrl.initiateTransfer);
router.put('/:id/status', ctrl.updateStatus);
router.delete('/:id', ctrl.remove);

module.exports = router;
