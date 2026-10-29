const mongoose = require('mongoose');
const softDeletePlugin = require('../utils/softDelete');

const expenseSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: {
    type: String,
    enum: ['marketing', 'salaries', 'software', 'operations', 'equipment', 'taxes', 'travel', 'legal', 'misc'],
    default: 'misc'
  },
  date: { type: Date },
  receipt_url: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  notes: { type: String },
  recurring: { type: Boolean, default: false },
  created_by: { type: String },
}, { timestamps: true });

expenseSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('Expense', expenseSchema);