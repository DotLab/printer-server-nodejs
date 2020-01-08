const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();

router.use('/users', require('./v1/userRouter'));
router.use('/things', require('./v1/thingRouter'));

module.exports = router;
