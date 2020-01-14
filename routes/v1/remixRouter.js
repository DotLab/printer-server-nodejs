const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const remixController = require('../../controllers/remixController');
const {createTypeChecker, STRING, OBJECT_ID, NUMBER, createTokenChecker} = require('./utils.js');

router.post('/upload', createTypeChecker({
  'token': STRING,
  'sourceThingId': OBJECT_ID,
  'sourceThingName': STRING,
  'sourceThingUploaderId': OBJECT_ID,
  'sourceThingUploaderName': STRING,

  'fileName': STRING,
  'fileSize': NUMBER,
  'name': STRING,
  'license': STRING,
  'category': STRING,
  'type': STRING,
  'summary': STRING,
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
  const pictureBuffer = req.body.pictureBuffer;

  const name = req.body.name;
  const license = req.body.license;
  const category = req.body.category;
  const type = req.body.type;
  const summary = req.body.summary;
  const printerBrand = req.body.printerBrand;
  const raft = req.body.raft === '' ? null : req.body.raft;
  const support = req.body.support === '' ? null : req.body.support;
  const resolution = req.body.resolution;
  const infill = req.body.infill;
  const filamentBrand = req.body.filamentBrand;
  const filamentColor = req.body.filamentColor;
  const filamentMaterial = req.body.filamentMaterial;
  const note = req.body.note;

  res.json(await remixController.upload({
    token, sourceThingId, sourceThingName, sourceThingUploaderId, sourceThingUploaderName,
    pictureBuffer, buffer, fileName, fileSize, name, license, category, type, summary,
    printerBrand, raft, support, resolution, infill, filamentBrand,
    filamentColor, filamentMaterial, note,
  }));
});

module.exports = router;
