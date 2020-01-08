const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const thingController = require('../../controllers/thingController');
const {createTypeChecker, STRING, OBJECT_ID, createTokenChecker} = require('./utils.js');

router.post('/create', createTypeChecker({
  'token': STRING,
  'name': STRING,
  'size': STRING,
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
  const name = req.body.name;
  const size = req.body.size;
  const buffer = req.body.buffer;
  const license = req.body.license;
  const type = req.body.type;
  const category = req.body.category;
  const summary = req.body.summary;
  const printerBrand = req.body.printerBrand;
  const raft = req.body.raft;
  const support = req.body.support;
  const resolution = req.body.resolution;
  const infill = req.body.infill;
  const filamentBrand = req.body.filamentBrand;
  const filamentColor = req.body.filamentColor;
  const filamentMaterial = req.body.filamentMaterial;
  const note = req.body.note;

  res.json(await thingController.create({
    name, size, buffer, license, category, type, summary, printerBrand, raft,
    support, resolution, infill, filamentBrand, filamentColor,
    filamentMaterial, note,
  }));
});

router.post('/remix', createTypeChecker({
  'token': STRING,
  'name': STRING,
  'size': STRING,
  'license': STRING,
  'category': STRING,
  'type': STRING,
  'summary': STRING,
  'sourceThingId': OBJECT_ID,
  'sourceThingName': STRING,
  'sourceUploaderId': OBJECT_ID,
  'sourceUploaderName': STRING,
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
  const name = req.body.name;
  const size = req.body.size;
  const buffer = req.body.buffer;
  const license = req.body.license;
  const type = req.body.type;
  const category = req.body.category;
  const summary = req.body.summary;
  const sourceThingId = req.body.sourceThingId;
  const sourceThingName = req.body.sourceThingName;
  const sourceUploaderId = req.body.sourceUploaderId;
  const sourceUploaderName = req.body.sourceUploaderName;

  const printerBrand = req.body.printerBrand;
  const raft = req.body.raft;
  const support = req.body.support;
  const resolution = req.body.resolution;
  const infill = req.body.infill;
  const filamentBrand = req.body.filamentBrand;
  const filamentColor = req.body.filamentColor;
  const filamentMaterial = req.body.filamentMaterial;
  const note = req.body.note;

  res.json(await thingController.remix({
    name, size, buffer, license, category, type, summary,
    sourceThingId, sourceThingName, sourceUploaderId,
    sourceUploaderName, printerBrand, raft, support, resolution,
    infill, filamentBrand, filamentColor, filamentMaterial, note,
  }));
});

router.post('/delete', createTypeChecker({
  'token': STRING,
  'thingId': OBJECT_ID,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const thingId = req.body.thingId;

  res.json(await thingController.delete({
    token, thingId,
  }));
});

router.post('/like', createTypeChecker({
  'token': STRING,
  'thingId': OBJECT_ID,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const thingId = req.body.thingId;

  res.json(await thingController.like({
    token, thingId,
  }));
});

router.post('/unlike', createTypeChecker({
  'token': STRING,
  'thingId': OBJECT_ID,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const thingId = req.body.thingId;

  res.json(await thingController.unlike({
    token, thingId,
  }));
});

router.post('/detail', createTypeChecker({
  'thingId': OBJECT_ID,
}), async (req, res) => {
  const thingId = req.body.thingId;

  res.json(await thingController.unlike({
    thingId,
  }));
});

module.exports = router;
