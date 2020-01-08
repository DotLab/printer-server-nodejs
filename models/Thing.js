const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const {YES, NO, DM} = require('../utils');

module.exports = mongoose.model('Thing', {
  uploaderId: ObjectId,
  uploaderName: String,

  name: String,
  hash: String,
  license: String,
  category: String,
  type: String,
  summary: String,
  path: String,

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
  bookmarkCount: Number,
  commentCount: Number,
  makeCount: Number,
});
