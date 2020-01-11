const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const {YES, NO} = require('../utils');

module.exports = mongoose.model('Make', {
  uploaderId: ObjectId,
  uploaderName: String,

  fileName: String,
  fileSize: Number,
  hash: String,
  path: String,
  sourceThingId: ObjectId,
  sourceThingName: String,
  sourceUploaderId: ObjectId,
  sourceUploaderName: String,

  description: String,
  printerBrand: String,
  raft: {type: String, enum: [YES, NO, null]},
  support: {type: String, enum: [YES, NO, null]},
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
