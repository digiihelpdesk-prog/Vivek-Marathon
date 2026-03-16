const mongoose = require('mongoose');

const MarathonSchema = new mongoose.Schema({
  formNo:        { type: String },
  timestamp:     { type: String },
  fullName:      { type: String, required: true },
  fatherName:    { type: String, required: true },
  dob:           { type: String },
  age:           { type: String },
  gender:        { type: String },
  bloodGroup:    { type: String },
  height:        { type: String },
  weight:        { type: String },
  mobile:        { type: String, required: true },
  email:         { type: String },
  address:       { type: String },
  school:        { type: String },
  programme:     { type: String },
  batchYear:     { type: String },
  tshirt:        { type: String },
  healthIssues:  { type: String },
  paymentStatus: { type: String, default: 'Pending' },
  paymentId:     { type: String },
  paymentOrderId:{ type: String },
  amount:        { type: Number, default: 300 },
}, { timestamps: true });

module.exports = mongoose.model('Marathon', MarathonSchema);