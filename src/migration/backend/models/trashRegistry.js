const Company = require('./Company');
const Expense = require('./Expense');
const Invoice = require('./Invoice');
const Investor = require('./Investor');
const Employee = require('./Employee');
const Note = require('./Note');
const Idea = require('./Idea');
const Document = require('./Document');
const DocSection = require('./DocSection');
const Password = require('./Password');
const ChatMessage = require('./ChatMessage');

const truncate = (value, length = 80) => {
  if (!value) return '';
  const text = String(value);
  return text.length > length ? `${text.slice(0, length)}...` : text;
};

const registry = {
  companies: { model: Company, label: (doc) => doc.name, scope: 'owner' },
  expenses: { model: Expense, label: (doc) => doc.title, scope: 'company' },
  invoices: { model: Invoice, label: (doc) => doc.title || doc.invoice_number, scope: 'company' },
  investors: { model: Investor, label: (doc) => doc.name, scope: 'company' },
  employees: { model: Employee, label: (doc) => doc.name, scope: 'company' },
  notes: { model: Note, label: (doc) => doc.title, scope: 'companyOrOwner' },
  ideas: { model: Idea, label: (doc) => doc.title, scope: 'company' },
  documents: { model: Document, label: (doc) => doc.title, scope: 'companyOrOwner' },
  'doc-sections': { model: DocSection, label: (doc) => doc.name, scope: 'company' },
  passwords: { model: Password, label: (doc) => doc.site_name, scope: 'company' },
  chat: { model: ChatMessage, label: (doc) => truncate(doc.content) || 'Message', scope: 'chat' },
};

module.exports = registry;
