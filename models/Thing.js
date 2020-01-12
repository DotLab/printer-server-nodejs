const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const {YES, NO} = require('../utils');

module.exports = mongoose.model('Thing', {
  uploaderId: ObjectId,
  uploaderName: String,

  fileName: String,
  fileSize: Number,
  hash: String,
  path: String,
  sourceThingId: ObjectId,
  sourceThingName: String,
  sourceThingUploaderId: ObjectId,
  sourceThingUploaderName: String,

  name: String,
  license: String,
  category: String,
  type: String,
  summary: String,

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
  bookmarkCount: Number,
  downloadCount: Number,
  commentCount: Number,
  makeCount: Number,
  remixCount: Number,
});
