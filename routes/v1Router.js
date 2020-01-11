const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();

router.use('/users', require('./v1/userRouter'));
router.use('/things', require('./v1/thingRouter'));
router.use('/makes', require('./v1/makeRouter'));

module.exports = router;
