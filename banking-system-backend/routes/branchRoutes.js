const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/branchController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.get('/:id/employees', ctrl.getEmployees);
router.get('/:id/accounts', ctrl.getAccounts);

module.exports = router;
