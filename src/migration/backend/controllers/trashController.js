const mongoose = require('mongoose');
const registry = require('../models/trashRegistry');
const IdeaComment = require('../models/IdeaComment');
const Document = require('../models/Document');

const getCompanyIds = async (userEmail) => {
  const companies = await require('../models/Company')
    .find({ created_by: userEmail })
    .setOptions({ withDeleted: true })
    .select('_id')
    .lean();
  return companies.map((company) => company._id);
};

const buildScopeFilter = (scope, userEmail, companyIds) => {
  const companyIdStrings = companyIds.map((id) => String(id));

  switch (scope) {
    case 'owner':
      return { created_by: userEmail };
    case 'company':
      return { company_id: { $in: companyIds } };
    case 'companyOrOwner':
      return {
        $or: [
          { company_id: { $in: companyIds } },
          { created_by: userEmail },
        ],
      };
    case 'chat':
      return {
        $or: [
          { company_id: { $in: companyIdStrings } },
          { sender_email: userEmail },
        ],
      };
    default:
      return { _id: null };
  }
};

const canAccess = (doc, scope, userEmail, companyIds) => {
  const companyIdStrings = companyIds.map((id) => String(id));
  const docCompanyId = doc.company_id ? String(doc.company_id) : null;

  switch (scope) {
    case 'owner':
      return doc.created_by === userEmail;
    case 'company':
      return docCompanyId !== null && companyIdStrings.includes(docCompanyId);
    case 'companyOrOwner':
      return doc.created_by === userEmail
        || (docCompanyId !== null && companyIdStrings.includes(docCompanyId));
    case 'chat':
      return doc.sender_email === userEmail
        || (docCompanyId !== null && companyIdStrings.includes(docCompanyId));
    default:
      return false;
  }
};

const listTrash = async (req, res) => {
  const companyIds = await getCompanyIds(req.user.email);
  const results = [];

  for (const [resource, config] of Object.entries(registry)) {
    const scopeFilter = buildScopeFilter(config.scope, req.user.email, companyIds);
    const docs = await config.model
      .find({ ...scopeFilter, is_deleted: true })
      .setOptions({ withDeleted: true })
      .sort({ deleted_at: -1 })
      .limit(100)
      .lean();

    results.push(...docs.map((doc) => ({
      id: doc._id,
      resource,
      label: config.label(doc) || 'Untitled',
      company_id: doc.company_id || null,
      deleted_at: doc.deleted_at,
      deleted_by: doc.deleted_by,
    })));
  }

  results.sort((a, b) => new Date(b.deleted_at || 0) - new Date(a.deleted_at || 0));
  res.json(results);
};

const restoreItem = async (req, res) => {
  const config = registry[req.params.resource];
  if (!config || !mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Deleted item not found' });
  }

  const companyIds = await getCompanyIds(req.user.email);
  const doc = await config.model
    .findOne({ _id: req.params.id, is_deleted: true })
    .setOptions({ withDeleted: true });

  if (!doc || !canAccess(doc, config.scope, req.user.email, companyIds)) {
    return res.status(404).json({ message: 'Deleted item not found' });
  }

  await doc.restore();

  if (req.params.resource === 'ideas') {
    await IdeaComment.updateMany(
      { idea_id: doc._id },
      { is_deleted: false, deleted_at: null, deleted_by: null }
    ).setOptions({ withDeleted: true });
  }

  if (req.params.resource === 'doc-sections') {
    await Document.updateMany(
      { section_id: doc._id },
      { is_deleted: false, deleted_at: null, deleted_by: null }
    ).setOptions({ withDeleted: true });
  }

  res.json(doc);
};

const purgeItem = async (req, res) => {
  const config = registry[req.params.resource];
  if (!config || !mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Deleted item not found' });
  }

  const companyIds = await getCompanyIds(req.user.email);
  const doc = await config.model
    .findOne({ _id: req.params.id, is_deleted: true })
    .setOptions({ withDeleted: true });

  if (!doc || !canAccess(doc, config.scope, req.user.email, companyIds)) {
    return res.status(404).json({ message: 'Deleted item not found' });
  }

  await config.model.findOneAndDelete({ _id: req.params.id }).setOptions({ withDeleted: true });
  res.json({ message: 'Item permanently deleted' });
};

module.exports = { listTrash, restoreItem, purgeItem };
