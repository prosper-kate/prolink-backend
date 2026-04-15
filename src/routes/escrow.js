const router = require('express').Router();
const auth   = require('../middleware/auth');
const ctrl   = require('../controllers/escrowController');

router.post('/',            auth, ctrl.createEscrow);
router.get('/',             auth, ctrl.getEscrows);
router.post('/:id/release', auth, ctrl.releaseEscrow);
router.post('/:id/dispute', auth, ctrl.disputeEscrow);

module.exports = router;