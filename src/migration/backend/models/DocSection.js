const mongoose = require('mongoose');
const softDeletePlugin = require('../utils/softDelete');

const docSectionSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  description: { type: String },
  created_by: { type: String },
}, { timestamps: true });

docSectionSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('DocSection', docSectionSchema);