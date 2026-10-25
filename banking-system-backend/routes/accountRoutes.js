const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/accountController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.get('/:id/transactions', ctrl.getTransactions);
router.get('/:id/transfers', ctrl.getTransfers);
router.get('/:id/savings-details', ctrl.getSavingsDetails);
router.get('/:id/current-details', ctrl.getCurrentDetails);

module.exports = router;
