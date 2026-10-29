const mongoose = require('mongoose');
const softDeletePlugin = require('../utils/softDelete');

const passwordSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  site_name: { type: String, required: true },
  site_url: { type: String },
  username: { type: String, required: true },
  password: { type: String, required: true },
  notes: { type: String },
  category: { type: String, enum: ['work', 'social', 'finance', 'email', 'shopping', 'other'], default: 'work' },
  is_weak: { type: Boolean, default: false },
  created_by: { type: String },
}, { timestamps: true });

passwordSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('Password', passwordSchema);