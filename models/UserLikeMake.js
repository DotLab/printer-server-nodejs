const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = mongoose.model('UserLikeMake', {
  userId: ObjectId,
  makeId: ObjectId,
});
