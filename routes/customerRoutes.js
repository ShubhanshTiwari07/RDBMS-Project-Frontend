const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/customerController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.get('/:id/accounts', ctrl.getAccounts);
router.get('/:id/beneficiaries', ctrl.getBeneficiaries);
router.get('/:id/loans', ctrl.getLoans);

module.exports = router;
