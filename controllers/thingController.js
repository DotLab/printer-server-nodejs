const User = require('../models/User');
const Thing = require('../models/Thing');
const UserLikeThing = require('../models/UserLikeThing');
const tokenService = require('../services/tokenService');
const {apiError, apiSuccess} = require('./utils');
const {FORBIDDEN, NOT_FOUND, BAD_REQUEST, calcFileHash} = require('./utils');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Server = require('../services/Server');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const tempPath = './temp';
const fs = require('fs');
const path = require('path');
if (fs.existsSync(tempPath)) {
  const files = fs.readdirSync(tempPath);
  for (const file of files) {
    fs.unlinkSync(path.join(tempPath, file));
  }
} else {
  fs.mkdirSync(tempPath);
}

const server = new Server(storage, tempPath);

exports.create = async function(params) {
  if (params.size !== params.buffer.length) {
    return apiError(FORBIDDEN);
  }
  const hash = calcFileHash(params.buffer);

  // needs to be changed later
  const remotePath = `/things/${hash}`;
  const localPath = `/tmp/${hash}`;

  fs.writeFileSync(localPath, params.buffer);
  await server.bucketUploadPrivate(localPath, remotePath);
  fs.unlink(localPath, () => {});

  const userId = tokenService.getUserId(params.token);
  const userName = await User.findOne({_id: userId}).select('userName');

  const thing = await Thing.create({
    uploaderId: userId,
    uploaderName: userName,

    name: params.name,
    hash, license: params.license,
    category: params.category,
    type: params.type,
    summary: params.summary,
    path: remotePath,
    printerBrand: params.printerBrand,
    raft: params.raft,
    support: params.psupport,
    resolution: params.resolution,
    infill: params.infill,
    filamentBrand: params.pfilamentBrand,
    filamentColor: params.pfilamentColor,
    filamentMaterial: params.filamentMaterial,
    note: params.note,

    uploadDate: new Date(),
    likeCount: 0,
    bookmarkCount: 0,
    commentCount: 0,
    makeCount: 0,
  });

  return apiSuccess(thing.id);
};

exports.delete = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const thing = await Thing.findOne({_id: new ObjectId(params.thingId), uploaderId: new ObjectId(userId)});
  if (!thing) {
    return apiError(NOT_FOUND);
  }

  await Thing.findByIdAndRemove(thing.id);

  return apiSuccess();
};

exports.like = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const thingCount = await Thing.find({_id: params.thingId}).countDocuments();
  if (thingCount === 0) {
    return apiError(NOT_FOUND);
  }
  // If the user already liked thingId
  const existingCount = await UserLikeThing.find({userId: userId, thingId: params.thingId}).countDocuments();
  if (existingCount > 0) {
    return apiError(BAD_REQUEST);
  }

  await Promise.all([
    UserLikeThing.create({
      userId: userId,
      thingId: params.thingId,
    }),
    Thing.findByIdAndUpdate(params.thingId, {
      $inc: {likeCount: 1},
    }),
  ]);

  return apiSuccess();
};

exports.unlike = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const thingCount = await Thing.find({_id: params.thingId}).countDocuments();
  if (thingCount === 0) {
    return apiError(NOT_FOUND);
  }
  // If the user did not like thingId
  const existingCount = await UserLikeThing.find({userId: userId, thingId: params.thingId}).countDocuments();
  if (existingCount === 0) {
    return apiError(BAD_REQUEST);
  }

  await Promise.all([
    UserLikeThing.deleteMany({userId: userId, thingId: params.thingId}),
    Thing.findByIdAndUpdate(params.thingId, {
      $inc: {likeCount: -1},
    }),
  ]);

  return apiSuccess();
};

exports.detail = async function(params) {
  const thing = await Thing.findById(params.thingId);
  if (!thing) {
    return apiError(NOT_FOUND);
  }
  return apiSuccess(thing);
};
