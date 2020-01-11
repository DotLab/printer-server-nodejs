const User = require('../models/User');
const Make = require('../models/Make');
const tokenService = require('../services/tokenService');
const {apiError, apiSuccess} = require('./utils');
const {BAD_REQUEST, calcFileHash} = require('./utils');
const Server = require('../services/Server');
const {Storage} = require('@google-cloud/storage');

const tempPath = './tempMake';
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

exports.upload = async function(params) {
  const storage = new Storage();
  const server = new Server(storage, tempPath);
  const dv = new DataView(new ArrayBuffer(params.buffer));
  const hash = calcFileHash(dv);
  if (!hash) {
    return apiError(BAD_REQUEST);
  }

  const remotePath = `/makes/${hash}.jpg`;
  const localPath = `${tempPath}/${hash}.jpg`;

  fs.writeFileSync(localPath, params.buffer);
  await server.bucketUploadPrivate(localPath, remotePath);
  fs.unlink(localPath, () => {});

  const userId = tokenService.getUserId(params.token);
  const userName = await User.findOne({_id: userId}).select('userName');

  const make = await Make.create({
    uploaderId: userId,
    uploaderName: userName.userName,

    fileName: params.fileName,
    fileSize: params.fileSize,
    hash: hash,
    path: remotePath,
    sourceThingId: params.sourceThingId,
    sourceThingName: params.sourceThingName,
    sourceUploaderId: params.sourceUploaderId,
    sourceUploaderName: params.sourceUploaderName,

    description: params.description,
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
    commentCount: 0,
  });

  return apiSuccess(make.id);
};
