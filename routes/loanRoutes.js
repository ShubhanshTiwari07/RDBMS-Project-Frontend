const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/loanController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.get('/:id/payments', ctrl.getPayments);
router.get('/:id/summary', ctrl.getLoanSummary);

module.exports = router;
