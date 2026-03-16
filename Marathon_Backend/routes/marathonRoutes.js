const express = require('express');
const router  = express.Router();
const {
  submitRegistration,
  getAllParticipants,
  getParticipantById,
  deleteParticipant,
  getStats
} = require('../controllers/marathonController');

router.post('/submit',    submitRegistration);
router.get('/all',        getAllParticipants);
router.get('/stats',      getStats);
router.get('/:id',        getParticipantById);
router.delete('/:id',     deleteParticipant);

module.exports = router;
