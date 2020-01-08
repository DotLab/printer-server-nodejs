const User = require('../models/User');
const Make = require('../models/Make');
const {apiError, apiSuccess} = require('./utils');
const {getUserId} = require('../services/tokenService');
const {FORBIDDEN, calcFileHash} = require('./utils');
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

  const userId = getUserId(params.token);
  const userName = await User.findOne({_id: userId}).select('userName');

  const make = await Make.create({
    uploaderId: userId,
    uploaderName: userName,

    hash,
    path: remotePath,
    sourceThingId: params.sourceThingId,
    sourceThingName: params.sourceThingName,
    sourceUploaderId: params.sourceUploaderId,
    sourceUploaderName: params.sourceUploaderName,

    description: params.description,
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
    commentCount: 0,
  });

  return apiSuccess(make.id);
};

