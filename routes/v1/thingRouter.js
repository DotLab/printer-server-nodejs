const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const thingController = require('../../controllers/thingController');
const {createTypeChecker, STRING} = require('./utils.js');

router.post('/create', createTypeChecker({
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
}), async (req, res) => {
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

module.exports = router;
