const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const makeController = require('../../controllers/makeController');
const {createTypeChecker, STRING, OBJECT_ID, NUMBER, createTokenChecker} = require('./utils.js');

router.post('/upload', createTypeChecker({
  'token': STRING,

  'sourceThingId': OBJECT_ID,
  'sourceThingName': STRING,
  'sourceThingUploaderId': OBJECT_ID,
  'sourceThingUploaderName': STRING,
  'fileName': STRING,
  'fileSize': NUMBER,

  '-description': STRING,
  '-printerBrand': STRING,
  '-raft': STRING,
  '-support': STRING,
  '-resolution': STRING,
  '-infill': STRING,
  '-filamentBrand': STRING,
  '-filamentColor': STRING,
  '-filamentMaterial': STRING,
  '-note': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;

  const sourceThingId = req.body.sourceThingId;
  const sourceThingName = req.body.sourceThingName;
  const sourceThingUploaderId = req.body.sourceThingUploaderId;
  const sourceThingUploaderName = req.body.sourceThingUploaderName;
  const fileName = req.body.fileName;
  const fileSize = req.body.fileSize;
  const buffer = req.body.buffer;
  const name = req.body.name;
  const description = req.body.description;

  const printerBrand = req.body.printerBrand;
  const raft = req.body.raft === '' ? null : req.body.raft;
  const support = req.body.support === '' ? null : req.body.support;
  const resolution = req.body.resolution;
  const infill = req.body.infill;
  const filamentBrand = req.body.filamentBrand;
  const filamentColor = req.body.filamentColor;
  const filamentMaterial = req.body.filamentMaterial;
  const note = req.body.note;

  res.json(await makeController.upload({
    token, sourceThingId, sourceThingName, sourceThingUploaderId,
    sourceThingUploaderName, fileName, fileSize, buffer, name, description,
    printerBrand, raft, support, resolution, infill, filamentBrand,
    filamentColor, filamentMaterial, note,
  }));
});

router.post('/detail', createTypeChecker({
  'makeId': OBJECT_ID,
}), async (req, res) => {
  const makeId = req.body.makeId;

  res.json(await makeController.detail({
    makeId,
  }));
});

router.post('/like', createTypeChecker({
  'token': STRING,
  'makeId': OBJECT_ID,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const makeId = req.body.makeId;

  res.json(await makeController.like({
    token, makeId,
  }));
});

router.post('/unlike', createTypeChecker({
  'token': STRING,
  'makeId': OBJECT_ID,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const makeId = req.body.makeId;

  res.json(await makeController.unlike({
    token, makeId,
  }));
});

router.post('/likecount', createTypeChecker({
  'makeId': OBJECT_ID,
}), async (req, res) => {
  const makeId = req.body.makeId;

  res.json(await makeController.likeCount({
    makeId,
  }));
});

router.post('/likestatus', createTypeChecker({
  'token': STRING,
  'makeId': OBJECT_ID,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const makeId = req.body.makeId;

  res.json(await makeController.likeStatus({
    token, makeId,
  }));
});

router.post('/comment/create', createTypeChecker({
  'token': STRING,
  'makeId': OBJECT_ID,
  'comment': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const makeId = req.body.makeId;
  const comment = req.body.comment;
  res.json(await makeController.createComment({
    token, makeId, comment,
  }));
});

router.post('/comment/delete', createTypeChecker({
  'token': STRING,
  'commentId': OBJECT_ID,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const commentId = req.body.commentId;

  res.json(await makeController.deleteComment({
    token, commentId,
  }));
});

router.post('/comment/list', createTypeChecker({
  '-token': STRING,
  'makeId': OBJECT_ID,
  'limit': NUMBER,
}), async (req, res) => {
  const token = req.body.token;
  const makeId = req.body.makeId;
  const limit = req.body.limit;

  res.json(await makeController.commentList({
    token, makeId, limit,
  }));
});

router.post('/latest', createTypeChecker({
  'limit': NUMBER,
}), async (req, res) => {
  const limit = req.body.limit;

  res.json(await makeController.latestMakes({
    limit,
  }));
});

module.exports = router;
