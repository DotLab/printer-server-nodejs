const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = mongoose.model('UserBookmarkThing', {
  userId: ObjectId,
  thingId: ObjectId,
});
