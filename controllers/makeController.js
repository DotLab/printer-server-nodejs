const User = require('../models/User');
const Thing = require('../models/Thing');
const Comment = require('../models/Comment');
const Make = require('../models/Make');
const UserLikeThing = require('../models/UserLikeThing');
const UserLikeMake = require('../models/UserLikeMake');
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
    sourceThingId: null,
    sourceThingName: null,
    sourceUploaderId: null,
    sourceUploaderName: null,

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
  await Thing.findByIdAndUpdate(params.sourceThingId, {
    $inc: {makeCount: 1},
  });

  return apiSuccess(thing.id);
};

exports.delete = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const make = await Make.findOne({_id: new ObjectId(params.makeId), uploaderId: new ObjectId(userId)});
  if (!make) {
    return apiError(NOT_FOUND);
  }

  await UserLikeMake.deleteMany({makeId: make.id});
  await Comment.deleteMany({targetId: make.id});
  await Make.findByIdAndRemove(make.id);

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
    Thing.findByIdAndUpdate(params.thingId, {
      $inc: {likeCount: -1},
    }),
    UserLikeThing.deleteMany({userId: userId, thingId: params.thingId}),
  ]);

  return apiSuccess();
};

exports.detail = async function(params) {
  const make = await Make.findById(params.makeId);
  if (!make) {
    return apiError(NOT_FOUND);
  }
  return apiSuccess(make);
};

exports.createComment = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const userName = await User.findOne({_id: userId}).select('userName');
  const thing = await Thing.findById(params.thingId);
  if (!thing) {
    return apiError(NOT_FOUND);
  }

  await Comment.create({
    targetId: params.thingId,
    targetAuthorId: thing.uploaderId,
    commentAuthorId: userId,
    commentAuthorName: userName.userName,
    body: params.comment,
    date: new Date(),
  });

  Thing.findByIdAndUpdate(params.thingId, {
    $inc: {commentCount: 1},
  }).exec();

  return apiSuccess();
};

exports.deleteComment = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const comment = await Comment.findById(params.commentId);

  if (!comment) {
    return apiError(NOT_FOUND);
  }
  if (userId !== comment.commentAuthorId.toString() && userId !== comment.targetAuthorId.toString()) {
    return apiError(FORBIDDEN);
  }

  await Promise.all([
    Thing.findByIdAndUpdate(comment.targetId, {
      $inc: {commentCount: -1},
    }),
    Comment.findByIdAndRemove(params.commentId),
  ]);

  return apiSuccess();
};

exports.commentList = async function(params) {
  const count = await Thing.find({_id: params.thingId}).countDocuments();
  if (count === 0) {
    return apiError(BAD_REQUEST);
  }

  const comments = await Comment.find({targetId: params.thingId}).limit(params.limit).lean().exec();
  const userId = tokenService.getUserId(params.token);

  comments.forEach((comment) => {
    comment.isOwner = (comment.targetAuthorId == userId || comment.commentAuthorId == userId) ? true : false;
  });

  return apiSuccess(comments);
};

exports.fakeCreate = async function(params) {
  // if (params.size !== params.buffer.length) {
  //   return apiError(FORBIDDEN);
  // }
  // const hash = calcFileHash(params.buffer);

  // needs to be changed later
  // const remotePath = `/things/${hash}`;

  const userId = tokenService.getUserId(params.token);
  const userName = await User.findOne({_id: userId}).select('userName');

  const make = await Make.create({
    uploaderId: userId,
    uploaderName: userName.userName,

    name: params.name,
    // hash,
    license: params.license,
    category: params.category,
    type: params.type,
    summary: params.summary,
    // path: remotePath,

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

  return apiSuccess(make.id);
};

