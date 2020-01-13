const User = require('../models/User');
const Thing = require('../models/Thing');
const Make = require('../models/Make');
const UserBookmarkThing = require('../models/UserBookmarkThing');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const {apiError, apiSuccess, genSecureRandomString, calcPasswordHash} = require('./utils');
const {createToken, getUserId} = require('../services/tokenService');
const {FORBIDDEN, NOT_FOUND} = require('./utils');

exports.register = async function(params) {
  const existingUserCount = await User.countDocuments({
    $or: [{userName: params.userName}, {email: params.email}],
  });

  if (existingUserCount > 0) {
    return apiError(FORBIDDEN);
  }

  const salt = genSecureRandomString();
  const hash = calcPasswordHash(params.password, salt);

  await User.create({
    userName: params.userName,
    displayName: params.displayName,
    email: params.email,
    passwordSalt: salt,
    passwordSha256: hash,
  });

  return apiSuccess();
};

exports.login = async function(params) {
  const user = await User.findOne({email: params.email});
  if (!user) {
    return apiError(FORBIDDEN);
  }

  const hash = calcPasswordHash(params.password, user.passwordSalt);
  if (hash !== user.passwordSha256) {
    return apiError(FORBIDDEN);
  }
  const token = createToken(user.id);
  return apiSuccess(token);
};

exports.changePassword = async function(params) {
  const userId = getUserId(params.token);
  const user = await User.findById(userId);
  const hash = calcPasswordHash(params.oldPassword, user.passwordSalt);
  if (hash !== user.passwordSha256) {
    return apiError(FORBIDDEN);
  }
  const newSalt = genSecureRandomString();
  const newHash = calcPasswordHash(params.newPassword, newSalt);
  await User.findByIdAndUpdate(user._id, {
    $set: {
      passwordSalt: newSalt,
      passwordSha256: newHash,
    },
  });

  return apiSuccess();
};

exports.names = async function(params) {
  const userId = getUserId(params.token);
  const user = await User.findById(userId).select('userName displayName');
  if (!user) {
    return apiError(NOT_FOUND);
  }

  return apiSuccess(user);
};

exports.detail = async function(params) {
  const user = await User.findOne({userName: params.userName}).select('displayName bio');
  if (!user) {
    return apiError(NOT_FOUND);
  }

  return apiSuccess(user);
};

exports.things = async function(params) {
  const things = await Thing.find({uploaderName: params.userName}).sort({uploadDate: -1}).exec();
  if (!things) {
    return apiError(NOT_FOUND);
  }

  return apiSuccess(things);
};


exports.makes = async function(params) {
  const makes = await Make.find({uploaderName: params.userName}).sort({uploadDate: -1}).exec();
  if (!makes) {
    return apiError(NOT_FOUND);
  }

  return apiSuccess(makes);
};


exports.bookmarks = async function(params) {
  const userId = await User.findOne({userName: params.userName}).select('_id');

  const query = await UserBookmarkThing.aggregate([
    {$match: {userId: new ObjectId(userId._id)}},
    {
      $lookup: {
        from: 'things',
        localField: 'thingId',
        foreignField: '_id',
        as: 'bookmark',
      },
    },
    {
      $unwind: {path: '$bookmark'},
    },
    {
      $replaceWith: '$bookmark',
    },
  ]).sort({uploadDate: -1}).exec();

  return apiSuccess(query);
};
