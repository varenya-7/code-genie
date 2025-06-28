const {Router} = require('express');
const router = Router();
const { init } = require('../controllers/agent');

router.post('/ask', init);


module.exports = router;