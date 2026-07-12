const { Router } = require('express');
const router = Router();
const {
  lookupAll,
  lookupByType,
  reverseLookupEndpoint,
  compareResolvers,
} = require('../controllers/dnsController');

router.get('/lookup', lookupAll);
router.get('/lookup/:domain/:type', lookupByType);
router.get('/reverse', reverseLookupEndpoint);
router.get('/compare', compareResolvers);

module.exports = router;
