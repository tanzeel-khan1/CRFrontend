const Document = require('../models/Document');
const DocSection = require('../models/DocSection');

const getSections = async (req, res) => {
  const sections = await DocSection.find({ company_id: req.params.companyId }).sort({ createdAt: -1 });
  res.json(sections);
};

const createSection = async (req, res) => {
  const section = await DocSection.create({ ...req.body, company_id: req.params.companyId, created_by: req.user.email });
  res.status(201).json(section);
};

const deleteSection = async (req, res) => {
  const section = await DocSection.softDeleteById(req.params.id, req.user.email);
  if (!section) return res.status(404).json({ message: 'Section not found' });
  await Document.updateMany(
    { section_id: req.params.id },
    { is_deleted: true, deleted_at: new Date(), deleted_by: req.user.email }
  );
  res.json({ message: 'Section deleted' });
};

const getDocuments = async (req, res) => {
  const filter = req.params.companyId ? { company_id: req.params.companyId } : { is_personal: true, created_by: req.user.email };
  const docs = await Document.find(filter).sort({ createdAt: -1 });
  res.json(docs);
};

const createDocument = async (req, res) => {
  const doc = await Document.create({ ...req.body, created_by: req.user.email });
  res.status(201).json(doc);
};

const updateDocument = async (req, res) => {
  const doc = await Document.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  res.json(doc);
};

const deleteDocument = async (req, res) => {
  const doc = await Document.softDeleteById(req.params.id, req.user.email);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  res.json({ message: 'Document deleted' });
};

module.exports = { getSections, createSection, deleteSection, getDocuments, createDocument, updateDocument, deleteDocument };