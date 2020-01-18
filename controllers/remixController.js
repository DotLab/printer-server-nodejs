const User = require('../models/User');
const Thing = require('../models/Thing');
const tokenService = require('../services/tokenService');
const {apiError, apiSuccess} = require('./utils');
const {BAD_REQUEST, calcFileHash} = require('./utils');
const Server = require('../services/Server');
const {Storage} = require('@google-cloud/storage');

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

exports.upload = async function(params) {
  const storage = new Storage();
  const server = new Server(storage, tempPath);

  const hash = calcFileHash(params.buffer);
  if (!hash) {
    return apiError(BAD_REQUEST);
  }

  const remotePath = `/things/${hash}.zip`;
  const localPath = `${tempPath}/${hash}.zip`;

  fs.writeFileSync(localPath, params.buffer, 'base64');
  await server.bucketUploadPrivate(localPath, remotePath);
  fs.unlink(localPath, () => {});

  const pictureUrls = [];
  for (let i = 0; i < params.pictureBuffer.length; i++) {
    const pictureHash = calcFileHash(params.pictureBuffer[i]);
    if (!pictureHash) {
      return apiError(BAD_REQUEST);
    }

    const remotePath = `/imgs/${pictureHash}.jpg`;
    const localPath = `${tempPath}/${pictureHash}.jpg`;

    const url = server.bucketGetPublicUrl(remotePath);
    pictureUrls.push(url);

    fs.writeFileSync(localPath, params.pictureBuffer[i], 'base64');
    await server.bucketUploadPublic(localPath, remotePath);
    fs.unlink(localPath, () => {});
  }

  const userId = tokenService.getUserId(params.token);
  const userName = await User.findOne({_id: userId}).select('userName');

  const thing = await Thing.create({
    uploaderId: userId,
    uploaderName: userName.userName,
    fileName: params.fileName,
    fileSize: params.fileSize,
    hash: hash,
    path: remotePath,
    pictureUrls: pictureUrls,
    sourceThingId: params.sourceThingId,
    sourceThingName: params.sourceThingName,
    sourceThingUploaderId: params.sourceThingUploaderId,
    sourceThingUploaderName: params.sourceThingUploaderName,

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

  await Thing.findByIdAndUpdate(params.sourceThingId, {
    $inc: {remixCount: 1},
  });

  return apiSuccess(thing.id);
};
