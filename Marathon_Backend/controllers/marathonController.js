const Marathon = require('../models/Marathon');
const { sendMarathonEmail } = require('../middleware/emailService');

// Submit Registration
exports.submitRegistration = async (req, res) => {
  try {
    // Generate form no only for paid registrations
    if (req.body.paymentStatus === 'Paid' && !req.body.formNo) {
      const count = await Marathon.countDocuments({ paymentStatus: 'Paid' });
      req.body.formNo = 101 + count; // 101, 102, 103...
    }

    console.log('📥 Marathon registration received:', req.body.email);
    const participant = await Marathon.create(req.body);
    console.log('💾 Participant saved:', participant._id);

    if (participant.email) {
      try {
        await sendMarathonEmail(participant);
        console.log('✅ Email sent to:', participant.email);
      } catch (emailErr) {
        console.error('❌ Email error:', emailErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully!',
      formNo: participant.formNo,
      data: participant
    });
  } catch (err) {
    console.error('❌ Submit error full:', err);
    res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
};

// Get All Participants
exports.getAllParticipants = async (req, res) => {
  try {
    const participants = await Marathon.find().sort({ createdAt: -1 });
    res.json({ success: true, count: participants.length, data: participants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Single Participant
exports.getParticipantById = async (req, res) => {
  try {
    const participant = await Marathon.findById(req.params.id);
    if (!participant) return res.status(404).json({ success: false, message: 'Participant not found' });
    res.json({ success: true, data: participant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Participant
exports.deleteParticipant = async (req, res) => {
  try {
    await Marathon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Participant deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Stats
exports.getStats = async (req, res) => {
  try {
    const total   = await Marathon.countDocuments();
    const paid    = await Marathon.countDocuments({ paymentStatus: 'Paid' });
    const pending = await Marathon.countDocuments({ paymentStatus: 'Pending' });
    const male    = await Marathon.countDocuments({ gender: 'Male' });
    const female  = await Marathon.countDocuments({ gender: 'Female' });
    const tshirts = await Marathon.aggregate([
      { $group: { _id: '$tshirt', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, stats: { total, paid, pending, male, female, tshirts } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};