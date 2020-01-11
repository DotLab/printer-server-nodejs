const User = require('../models/User');
const Thing = require('../models/Thing');
const Comment = require('../models/Comment');
const Make = require('../models/Make');
const UserLikeThing = require('../models/UserLikeThing');
const UserBookmarkThing = require('../models/UserBookmarkThing');
const tokenService = require('../services/tokenService');
const {apiError, apiSuccess} = require('./utils');
const {FORBIDDEN, NOT_FOUND, BAD_REQUEST, calcFileHash} = require('./utils');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Server = require('../services/Server');
const {Storage} = require('@google-cloud/storage');
const {handleSort} = require('./queryHandler');

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

const ALL = 'All';

exports.remix = async function(params) {
  const storage = new Storage();
  const server = new Server(storage, tempPath);
  const dv = new DataView(new ArrayBuffer(params.buffer));
  const hash = calcFileHash(dv);
  if (!hash) {
    return apiError(BAD_REQUEST);
  }

  const remotePath = `/things/${hash}.zip`;
  const localPath = `${tempPath}/${hash}.zip`;

  fs.writeFileSync(localPath, params.buffer);
  await server.bucketUploadPrivate(localPath, remotePath);
  fs.unlink(localPath, () => {});

  const userId = tokenService.getUserId(params.token);
  const userName = await User.findOne({_id: userId}).select('userName');

  const thing = await Thing.create({
    uploaderId: userId,
    uploaderName: userName.userName,
    fileName: params.fileName,
    hash: hash,
    path: remotePath,
    sourceThingId: params.sourceThingId,
    sourceThingName: params.sourceThingName,
    sourceUploaderId: params.sourceUploaderId,
    sourceUploaderName: params.sourceUploaderName,

    name: params.name,
    license: params.license,
    category: params.category,
    type: params.type,
    summary: params.summary,
    printerBrand: params.printerBrand,
    raft: params.raft,
    support: params.support,
    resolution: params.resolution,
    infill: params.infill,
    filamentBrand: params.filamentBrand,
    filamentColor: params.filamentColor,
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

  await UserLikeThing.deleteMany({thingId: thing.id});
  await Comment.deleteMany({targetId: thing.id});
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
    Thing.findByIdAndUpdate(params.thingId, {
      $inc: {likeCount: -1},
    }),
    UserLikeThing.deleteMany({userId: userId, thingId: params.thingId}),
  ]);

  return apiSuccess();
};

exports.likeCount = async function(params) {
  const thing = await Thing.findById(params.thingId).select('likeCount');
  if (!thing) {
    return apiError(NOT_FOUND);
  }
  return apiSuccess(thing.likeCount);
};

exports.likeStatus = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const thingCount = await Thing.find({_id: params.thingId}).countDocuments();
  if (thingCount === 0) {
    console.log(params.thingId);
    console.log('error');
    return apiError(NOT_FOUND);
  }

  const likeCount = await UserLikeThing.find({thingId: params.thingId, userId: userId}).countDocuments();
  if (likeCount === 0) {
    return apiSuccess(false);
  }
  return apiSuccess(true);
};

exports.detail = async function(params) {
  const thing = await Thing.findById(params.thingId);
  if (!thing) {
    return apiError(NOT_FOUND);
  }
  return apiSuccess(thing);
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

  const comments = await Comment.find({targetId: params.thingId}).sort({date: -1}).limit(params.limit).lean().exec();
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

  const thing = await Thing.create({
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

  return apiSuccess(thing.id);
};

exports.bookmark = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const thingCount = await Thing.find({_id: params.thingId}).countDocuments();
  if (thingCount === 0) {
    return apiError(NOT_FOUND);
  }
  // If the user already bookmarked thingId
  const existingCount = await UserBookmarkThing.find({userId: userId, thingId: params.thingId}).countDocuments();
  if (existingCount > 0) {
    return apiError(BAD_REQUEST);
  }

  await Promise.all([
    UserBookmarkThing.create({
      userId: userId,
      thingId: params.thingId,
    }),
    Thing.findByIdAndUpdate(params.thingId, {
      $inc: {bookmarkCount: 1},
    }),
  ]);

  return apiSuccess();
};

exports.unBookmark = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const thingCount = await Thing.find({_id: params.thingId}).countDocuments();
  if (thingCount === 0) {
    return apiError(NOT_FOUND);
  }
  // If the user did not bookmark thingId
  const existingCount = await UserBookmarkThing.find({userId: userId, thingId: params.thingId}).countDocuments();
  if (existingCount === 0) {
    return apiError(BAD_REQUEST);
  }

  await Promise.all([
    Thing.findByIdAndUpdate(params.thingId, {
      $inc: {bookmarkCount: -1},
    }),
    UserBookmarkThing.deleteMany({userId: userId, thingId: params.thingId}),
  ]);

  return apiSuccess();
};

exports.bookmarkCount = async function(params) {
  const thing = await Thing.findById(params.thingId).select('bookmarkCount');
  if (!thing) {
    return apiError(NOT_FOUND);
  }
  return apiSuccess(thing.bookmarkCount);
};

exports.bookmarkStatus = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const thingCount = await Thing.find({_id: params.thingId}).countDocuments();
  if (thingCount === 0) {
    console.log(params.thingId);
    console.log('error');
    return apiError(NOT_FOUND);
  }

  const bookmarkCount = await UserBookmarkThing.find({thingId: params.thingId, userId: userId}).countDocuments();
  if (bookmarkCount === 0) {
    return apiSuccess(false);
  }
  return apiSuccess(true);
};

exports.makeList = async function(params) {
  const count = await Thing.find({_id: params.thingId}).countDocuments();
  if (count === 0) {
    return apiError(BAD_REQUEST);
  }

  const makes = await Make.find({sourceThingId: params.thingId}).limit(params.limit).lean().exec();

  return apiSuccess(makes);
};

exports.remixList = async function(params) {
  const count = await Thing.find({_id: params.thingId}).countDocuments();
  if (count === 0) {
    return apiError(BAD_REQUEST);
  }

  const remixes = await Thing.find({sourceThingId: params.thingId}).limit(params.limit).lean().exec();

  return apiSuccess(remixes);
};

exports.upload = async function(params) {
  const storage = new Storage();
  const server = new Server(storage, tempPath);
  const dv = new DataView(new ArrayBuffer(params.buffer));
  const hash = calcFileHash(dv);
  if (!hash) {
    return apiError(BAD_REQUEST);
  }

  const remotePath = `/things/${hash}.zip`;
  const localPath = `${tempPath}/${hash}.zip`;

  fs.writeFileSync(localPath, params.buffer);
  await server.bucketUploadPrivate(localPath, remotePath);
  fs.unlink(localPath, () => {});

  const userId = tokenService.getUserId(params.token);
  const userName = await User.findOne({_id: userId}).select('userName');

  const thing = await Thing.create({
    uploaderId: userId,
    uploaderName: userName.userName,
    fileName: params.fileName,
    fileSize: params.fileSize,
    hash: hash,
    path: remotePath,

    name: params.name,
    license: params.license,
    category: params.category,
    type: params.type,
    summary: params.summary,
    printerBrand: params.printerBrand,
    raft: params.raft,
    support: params.support,
    resolution: params.resolution,
    infill: params.infill,
    filamentBrand: params.filamentBrand,
    filamentColor: params.filamentColor,
    filamentMaterial: params.filamentMaterial,
    note: params.note,

    uploadDate: new Date(),
    likeCount: 0,
    bookmarkCount: 0,
    commentCount: 0,
    downloadCount: 0,
    makeCount: 0,
    remixCount: 0,
  });

  return apiSuccess(thing.id);
};

exports.listingQuery = async function(params) {
  let query = Thing.find({});

  // filter
  if (params.category && params.category !== ALL) {
    query = Thing.find({category: params.category});
  }
  if (params.type && params.category !== ALL) {
    query = Thing.find({category: params.type});
  }

  // sort
  try {
    handleSort(params.sort, params.order, query);
  } catch (e) {
    return apiError(BAD_REQUEST);
  }

  // skip
  query = query.skip(params.skip);

  // limit
  query = query.limit(params.limit);

  let res = await query.exec();

  if (params.search) {
    res = res.filter((x) => {
      return x.name === params.search;
    });
  }

  return apiSuccess(res);
};

exports.detail = async function(params) {
  const thing = await Thing.findById(params.thingId);
  if (!thing) {
    return apiError(NOT_FOUND);
  }

  return apiSuccess(thing);
};

exports.download = async function(params) {
  const storage = new Storage();
  const server = new Server(storage, tempPath);
  const thing = await Thing.findById(params.thingId);
  if (!thing) {
    return apiError(NOT_FOUND);
  }
  const url = await server.generateSignedUrl('/things/' + thing.hash + '.zip');
  console.log(url);
  return apiSuccess(url);
};
