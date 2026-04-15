const router = require('express').Router();
const auth   = require('../middleware/auth');
const ctrl   = require('../controllers/messageController');

router.get('/conversations', auth, ctrl.getConversations);
router.get('/:otherId',      auth, ctrl.getMessages);
router.post('/',             auth, ctrl.sendMessage);

module.exports = router;