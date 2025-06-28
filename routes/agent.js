const {Router} = require('express');
const router = Router();
const {updateBandMembers ,getBandMembers} = require('../controllers/bandmember');
router.post('/updatebandmember', updateBandMembers);
router.get('/getbandmembers', getBandMembers);

module.exports = router;