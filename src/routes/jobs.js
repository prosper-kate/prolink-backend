const router = require('express').Router();
const auth   = require('../middleware/auth');
const ctrl   = require('../controllers/jobController');

router.get('/',      ctrl.getJobs);         // public — anyone can browse
router.post('/',     auth, ctrl.createJob); // must be logged in
router.get('/:id',   ctrl.getJob);
router.patch('/:id', auth, ctrl.updateJob);

module.exports = router;