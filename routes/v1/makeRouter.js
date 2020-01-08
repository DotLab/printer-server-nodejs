const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const makeController = require('../../controllers/makeController');
const {createTypeChecker, STRING, OBJECT_ID} = require('./utils.js');

router.post('/create', createTypeChecker({
  'name': STRING,
  'size': STRING,
  'sourceThingId': OBJECT_ID,
  'sourceThingName': STRING,
  'sourceUploaderId': OBJECT_ID,
  'sourceUploaderName': STRING,
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
}), async (req, res) => {
  const name = req.body.name;
  const size = req.body.size;
  const sourceThingId = req.body.sourceThingId;
  const sourceThingName = req.body.sourceThingName;
  const sourceUploaderId = req.body.sourceUploaderId;
  const sourceUploaderName = req.body.sourceUploaderName;
  const description = req.body.description;
  const printerBrand = req.body.printerBrand;
  const raft = req.body.raft;
  const support = req.body.support;
  const resolution = req.body.resolution;
  const infill = req.body.infill;
  const filamentBrand = req.body.filamentBrand;
  const filamentColor = req.body.filamentColor;
  const filamentMaterial = req.body.filamentMaterial;
  const note = req.body.note;

  res.json(await makeController.create({
    name, size, sourceThingId, sourceThingName, sourceUploaderId,
    sourceUploaderName, description, printerBrand, raft, support,
    resolution, infill, filamentBrand, filamentColor,
    filamentMaterial, note,
  }));
});

module.exports = router;
