const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = mongoose.model('UserLikeThing', {
  userId: ObjectId,
  thingId: ObjectId,
});
