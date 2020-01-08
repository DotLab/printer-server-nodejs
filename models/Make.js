const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const {YES, NO, DM} = require('../utils');

module.exports = mongoose.model('Make', {
  uploaderId: ObjectId,
  uploaderName: String,

  hash: String,
  path: String,
  sourceThingId: ObjectId,
  sourceThingName: String,
  sourceUploaderId: ObjectId,
  sourceUploaderName: String,

  description: String,
  printerBrand: String,
  raft: {type: String, enum: [YES, NO, DM]},
  support: {type: String, enum: [YES, NO, DM]},
  resolution: Number,
  infill: Number,
  filamentBrand: String,
  filamentColor: String,
  filamentMaterial: String,
  note: String,

  uploadDate: Date,
  likeCount: Number,
  commentCount: Number,
});
