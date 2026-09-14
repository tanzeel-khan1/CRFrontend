import React, { useState } from 'react';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';
import NoCompanyBanner from '@/components/ui/NoCompanyBanner';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreVertical, Pencil, Trash2, Send, Eye, Archive, Mail, Loader2 } from 'lucide-react';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUSES = ['draft', 'sent', 'viewed', 'paid', 'overdue', 'archived'];

const statusStyles = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-chart-2/10 text-chart-2',
  viewed: 'bg-chart-3/10 text-chart-3',
  paid: 'bg-primary/10 text-primary',
  overdue: 'bg-destructive/10 text-destructive',
  archived: 'bg-muted text-muted-foreground',
};

export default function Invoices() {
  const { activeCompany, companies } = useOutletContext();
  const companyId = activeCompany?.id;

  if (!companyId) return <NoCompanyBanner hasNoCompanies={!companies?.length} />;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('all');
  const [form, setForm] = useState({ title: '', amount: 0, tax_amount: 0, recipient_name: '', recipient_email: '', due_date: '', notes: '', status: 'draft', type: 'external' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailTarget, setEmailTarget] = useState(null);
  const [emailTo, setEmailTo] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const logActivity = (action, details) =>
    api.entities.Activity.create({ company_id: companyId, action, entity_type: 'invoice', details });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', companyId],
    queryFn: () => companyId ? api.entities.Invoice.filter({ company_id: companyId }, '-created_date') : api.entities.Invoice.list('-created_date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Invoice.create({
      ...data,
      company_id: companyId,
      total_amount: data.amount + data.tax_amount,
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    }),
    onSuccess: (inv) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      logActivity(`Invoice created: ${inv.title}`, `Amount: $${inv.total_amount || inv.amount}`);
      toast.success(`Invoice "${inv.title}" created`);
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Invoice.update(id, data),
    onSuccess: (inv) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      logActivity(`Invoice updated: ${inv.title}`, `Status: ${inv.status}`);
      toast.success(`Invoice updated`);
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted');
    },
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm({ title: '', amount: 0, tax_amount: 0, recipient_name: '', recipient_email: '', due_date: '', notes: '', status: 'draft', type: 'external' }); };

  const openEdit = (inv) => {
    setEditing(inv);
    setForm({ title: inv.title, amount: inv.amount, tax_amount: inv.tax_amount || 0, recipient_name: inv.recipient_name || '', recipient_email: inv.recipient_email || '', due_date: inv.due_date || '', notes: inv.notes || '', status: inv.status, type: inv.type || 'external' });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editing) updateMutation.mutate({ id: editing.id, data: { ...form, total_amount: form.amount + form.tax_amount } });
    else createMutation.mutate(form);
  };

  const filtered = tab === 'all' ? invoices : invoices.filter(i => i.status === tab);

  const openEmailDialog = (inv) => {
    setEmailTarget(inv);
    setEmailTo(inv.recipient_email || '');
    setEmailDialog(true);
  };

  const sendInvoiceEmail = async () => {
    if (!emailTo.trim()) return;
    setSendingEmail(true);
    const inv = emailTarget;
    const body = `Dear ${inv.recipient_name || 'Sir/Madam'},

Please find your invoice details below:

Invoice Title  : ${inv.title}
Invoice No     : ${inv.invoice_number || 'N/A'}
Amount         : $${(inv.amount || 0).toLocaleString()}
Tax            : $${(inv.tax_amount || 0).toLocaleString()}
Total Amount   : $${(inv.total_amount || inv.amount || 0).toLocaleString()}
Due Date       : ${inv.due_date ? format(new Date(inv.due_date), 'MMMM d, yyyy') : 'N/A'}
Status         : ${inv.status}${inv.notes ? `\n\nNotes: ${inv.notes}` : ''}

Thank you for your business.`;

    try {
      await api.integrations.Core.SendEmail({
        to: emailTo.trim(),
        subject: `Invoice ${inv.invoice_number || ''} - ${inv.title}`,
        body,
      });
      toast.success(`Email successfully sent to ${emailTo}!`);
      // Also mark invoice as 'sent' if it was draft
      if (inv.status === 'draft') {
        updateMutation.mutate({ id: inv.id, data: { status: 'sent' } });
      }
    } catch (err) {
      toast.error('Email send nahi ho saki. Please try again.');
    }
    setSendingEmail(false);
    setEmailDialog(false);
    setEmailTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">{invoices.length} total invoices</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={!companyId} className="gap-2"><Plus className="w-4 h-4" /> Create Invoice</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {STATUSES.map(s => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {invoicesLoading ? <TableSkeleton rows={5} cols={5} /> : (<>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Invoice</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Recipient</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Amount</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Due Date</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Status</th>
              <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((inv, i) => (
                <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium">{inv.title}</p>
                    <p className="text-xs text-muted-foreground">{inv.invoice_number}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm">{inv.recipient_name || '—'}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold">${(inv.total_amount || inv.amount || 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{inv.due_date ? format(new Date(inv.due_date), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-5 py-3.5">
                    <Badge className={`text-xs capitalize ${statusStyles[inv.status] || ''}`}>{inv.status}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(inv)}><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEmailDialog(inv)}><Mail className="w-4 h-4 mr-2" />Send via Email</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ id: inv.id, data: { status: 'sent' } })}><Send className="w-4 h-4 mr-2" />Mark Sent</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ id: inv.id, data: { status: 'paid' } })}><Eye className="w-4 h-4 mr-2" />Mark Paid</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ id: inv.id, data: { status: 'archived' } })}><Archive className="w-4 h-4 mr-2" />Archive</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(inv)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">No invoices found.</div>}
        </>)}
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.title}
        itemType="Invoice"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }}
      />

      {/* Send Email Dialog */}
      <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Send Invoice via Email</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Invoice <strong>{emailTarget?.invoice_number}</strong> — <strong>{emailTarget?.title}</strong></p>
            <div>
              <Label>Send to Email</Label>
              <Input value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="recipient@example.com" type="email" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialog(false)}>Cancel</Button>
            <Button onClick={sendInvoiceEmail} disabled={!emailTo.trim() || sendingEmail} className="gap-2">
              <Mail className="w-4 h-4" />{sendingEmail ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Invoice title" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Recipient Name</Label><Input value={form.recipient_name} onChange={e => setForm({ ...form, recipient_name: e.target.value })} /></div>
              <div><Label>Recipient Email</Label><Input value={form.recipient_email} onChange={e => setForm({ ...form, recipient_email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Amount ($)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></div>
              <div><Label>Tax ($)</Label><Input type="number" value={form.tax_amount} onChange={e => setForm({ ...form, tax_amount: Number(e.target.value) })} /></div>
              <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="external">External</SelectItem>
                  <SelectItem value="company_to_investor">Company → Investor</SelectItem>
                  <SelectItem value="investor_to_company">Investor → Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button onClick={handleSubmit}>{editing ? 'Update' : 'Create'} Invoice</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}