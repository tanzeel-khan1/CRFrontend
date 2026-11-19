import React, { useState } from 'react';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';
import NoCompanyBanner from '@/components/ui/NoCompanyBanner';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreVertical, Pencil, Trash2, Send, Eye, Archive, Mail, FileText, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CURRENCIES, formatCurrency } from '@/lib/currency';

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
  const [form, setForm] = useState({ title: '', amount: 0, tax_amount: 0, currency: activeCompany.currency || 'USD', recipient_name: '', recipient_email: '', due_date: '', notes: '', status: 'draft' });
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

  const defaultCurrency = invoices[0]?.currency || activeCompany.currency || 'USD';

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Invoice.create({
      ...data,
      company_id: companyId,
      total_amount: data.amount + data.tax_amount,
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    }),
    onSuccess: (inv) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-analytics'] });
      logActivity(`Invoice created: ${inv.title}`, `Amount: ${formatCurrency(inv.total_amount || inv.amount, inv.currency)}`);
      toast.success(`Invoice "${inv.title}" created`);
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Invoice.update(id, data),
    onSuccess: (inv) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-analytics'] });
      logActivity(`Invoice updated: ${inv.title}`, `Status: ${inv.status}`);
      toast.success(`Invoice updated`);
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-analytics'] });
      toast.success('Invoice deleted');
    },
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm({ title: '', amount: 0, tax_amount: 0, currency: defaultCurrency, recipient_name: '', recipient_email: '', due_date: '', notes: '', status: 'draft' }); };

  const openCreateDialog = () => {
    setEditing(null);
    setForm({ title: '', amount: 0, tax_amount: 0, currency: defaultCurrency, recipient_name: '', recipient_email: '', due_date: '', notes: '', status: 'draft' });
    setDialogOpen(true);
  };

  const openEdit = (inv) => {
    setEditing(inv);
    setForm({ title: inv.title, amount: inv.amount, tax_amount: inv.tax_amount || 0, currency: inv.currency || activeCompany.currency || 'USD', recipient_name: inv.recipient_name || '', recipient_email: inv.recipient_email || '', due_date: inv.due_date || '', notes: inv.notes || '', status: inv.status });
    setDialogOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
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
    try {
      await api.integrations.Core.SendEmail({
        to: emailTo.trim(),
        subject: `Invoice ${inv.invoice_number || ''} - ${inv.title}`,
        invoice: {
          recipient_name: inv.recipient_name || 'Sir/Madam',
          title: inv.title,
          invoice_number: inv.invoice_number || 'N/A',
          amount: inv.amount || 0,
          tax_amount: inv.tax_amount || 0,
          total_amount: inv.total_amount || inv.amount || 0,
          currency: inv.currency || activeCompany.currency || 'USD',
          due_date: inv.due_date || '',
          status: inv.status || 'draft',
          notes: inv.notes || '',
        },
      });
      toast.success(`Email successfully sent to ${emailTo}!`);
      // Also mark invoice as 'sent' if it was draft
      if (inv.status === 'draft') {
        updateMutation.mutate({ id: inv.id, data: { status: 'sent' } });
      }
    } catch (err) {
      toast.error('The email could not be sent. Please try again.');
    }
    setSendingEmail(false);
    setEmailDialog(false);
    setEmailTarget(null);
  };

  const dashboardCurrency = invoices[0]?.currency || activeCompany.currency || 'USD';
  const totalValue = invoices
    .filter(inv => (inv.currency || activeCompany.currency || 'USD') === dashboardCurrency)
    .reduce((sum, inv) => sum + Number(inv.total_amount || inv.amount || 0), 0);
  const paidCount = invoices.filter((inv) => inv.status === 'paid').length;
  const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;

  return (
    <div className="space-y-6 pb-8">
      <section className="page-hero">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-background/55">Billing</p>
            <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Invoices</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-background/70">{invoices.length} invoices across this workspace.</p>
          </div>
          <Button onClick={openCreateDialog} disabled={!companyId} variant="secondary" className="gap-2 w-full sm:w-auto"><Plus className="w-4 h-4" /> Create Invoice</Button>
        </div>
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[24px] border-background/10" />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total invoices', value: invoices.length, icon: FileText },
          { label: 'Billed', value: formatCurrency(totalValue, dashboardCurrency), icon: DollarSign },
          { label: 'Paid', value: paidCount, icon: CheckCircle2 },
          { label: 'Overdue', value: overdueCount, icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="stat-tile">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background"><Icon className="h-4 w-4" /></div>
            <p className="text-xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-2 shadow-sm sm:p-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={setTab} className="w-full lg:w-auto">
          <TabsList className="h-9 flex-wrap gap-1 bg-muted/40 p-1">
            <TabsTrigger value="all" className="px-2.5 text-xs">All</TabsTrigger>
            {STATUSES.map((s) => (
              <TabsTrigger key={s} value={s} className="px-2.5 text-xs capitalize">
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </section>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
        {invoicesLoading ? <TableSkeleton rows={5} cols={5} /> : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Invoice</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Recipient</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Due Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((inv, i) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ delay: i * 0.015, duration: 0.2 }}
                      className="group border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium leading-tight">{inv.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{inv.invoice_number}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm">{inv.recipient_name || '—'}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold tracking-tight">{formatCurrency(inv.total_amount || inv.amount || 0, inv.currency || activeCompany.currency)}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{inv.due_date ? format(new Date(inv.due_date), 'MMM d, yyyy') : '—'}</td>
                      <td className="px-5 py-3.5">
                        <Badge className={`text-xs capitalize shadow-sm ${statusStyles[inv.status] || ''}`}>{inv.status}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(inv)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => openEdit(inv)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEmailDialog(inv)}><Mail className="mr-2 h-4 w-4" />Send via Email</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateMutation.mutate({ id: inv.id, data: { status: 'sent' } })}><Send className="mr-2 h-4 w-4" />Mark Sent</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateMutation.mutate({ id: inv.id, data: { status: 'paid' } })}><CheckCircle2 className="mr-2 h-4 w-4" />Mark Paid</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateMutation.mutate({ id: inv.id, data: { status: 'archived' } })}><Archive className="mr-2 h-4 w-4" />Archive</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(inv)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && !invoicesLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground/80" />
            </div>
            <div>
              <p className="text-sm font-medium">No invoices found</p>
              <p className="mt-1 text-xs text-muted-foreground">Try adjusting your filters or create a new invoice.</p>
            </div>
          </div>
        )}
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
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-xl overflow-y-auto rounded-2xl border-0 p-0 shadow-2xl">
          <div className="bg-foreground px-6 py-6 text-background sm:px-7">
            <DialogHeader>
              <div className="flex items-start gap-3 pr-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-foreground"><Mail className="h-5 w-5" /></div>
                <div><DialogTitle className="text-xl text-background">Send invoice</DialogTitle><p className="mt-1 text-sm text-background/70">Deliver a clean invoice summary to your client.</p></div>
              </div>
            </DialogHeader>
          </div>
          <div className="space-y-5 bg-muted/30 p-6 sm:p-7">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b border-border pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Invoice preview</p><p className="mt-2 text-lg font-semibold">{emailTarget?.title}</p><p className="mt-1 text-xs text-muted-foreground">{emailTarget?.invoice_number || 'Invoice'}</p></div><div className="text-right"><p className="text-2xl font-bold tracking-tight">{formatCurrency(emailTarget?.total_amount || emailTarget?.amount || 0, emailTarget?.currency || activeCompany.currency)}</p><Badge className="mt-2 capitalize">{emailTarget?.status || 'draft'}</Badge></div></div>
              <div className="grid grid-cols-2 gap-4 pt-4 text-sm"><div><p className="text-xs text-muted-foreground">Recipient</p><p className="mt-1 font-medium">{emailTarget?.recipient_name || 'Client'}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Due date</p><p className="mt-1 font-medium">{emailTarget?.due_date ? format(new Date(emailTarget.due_date), 'MMM d, yyyy') : 'Not set'}</p></div></div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="space-y-2"><Label htmlFor="invoice-email" className="text-xs font-semibold">Recipient email</Label><Input id="invoice-email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="recipient@example.com" type="email" className="h-11 bg-background" /><p className="text-xs text-muted-foreground">The recipient will receive the invoice details and due date.</p></div></div>
          </div>
          <DialogFooter className="border-t border-border bg-card px-6 py-4 sm:px-7"><Button variant="outline" onClick={() => setEmailDialog(false)}>Cancel</Button><Button onClick={sendInvoiceEmail} disabled={!emailTo.trim() || sendingEmail} className="gap-2"><Mail className="h-4 w-4" />{sendingEmail ? 'Sending...' : 'Send invoice'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="flex max-h-[88vh] w-[calc(100%-1rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border border-border/70 bg-background p-0 text-background shadow-[0_24px_80px_-20px_rgba(0,0,0,0.5)]">
          <div className="relative shrink-0 overflow-hidden border-b border-background/10 bg-gradient-to-br from-foreground via-foreground to-foreground/90 px-5 py-4 sm:px-6">
            <div className="pointer-events-none absolute -right-8 -top-14 h-36 w-36 rounded-full border-[18px] border-background/[0.06]" />
            <div className="pointer-events-none absolute right-16 top-6 h-20 w-20 rounded-full bg-background/[0.04] blur-2xl" />
            <DialogHeader>
              <div className="relative flex items-center gap-3 pr-8">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-background/15 bg-background/10 text-background shadow-inner"><FileText className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-background/55">Billing workspace</p>
                  <DialogTitle className="font-display text-xl tracking-tight text-background">{editing ? 'Edit invoice' : 'Create invoice'}</DialogTitle>
                </div>
                <Badge className="ml-auto border border-background/15 bg-background/10 text-[10px] capitalize text-background">{form.status}</Badge>
              </div>
            </DialogHeader>
          </div>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col text-foreground">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/20 px-4 py-4 sm:px-5">
              <section className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div><h3 className="text-xs font-semibold">Invoice & recipient</h3><p className="mt-0.5 text-[11px] text-muted-foreground">Who is this invoice for?</p></div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">Required details</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="invoice-title" className="text-[11px] font-semibold">Invoice title</Label><Input id="invoice-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Property consultation" className="h-9 bg-background text-sm" /></div>
                  <div className="space-y-1.5"><Label htmlFor="invoice-recipient-name" className="text-[11px] font-semibold">Recipient</Label><Input id="invoice-recipient-name" value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} placeholder="Client name" className="h-9 bg-background text-sm" /></div>
                  <div className="space-y-1.5"><Label htmlFor="invoice-recipient-email" className="text-[11px] font-semibold">Email</Label><Input id="invoice-recipient-email" type="email" value={form.recipient_email} onChange={(e) => setForm({ ...form, recipient_email: e.target.value })} placeholder="client@example.com" className="h-9 bg-background text-sm" /></div>
                </div>
              </section>
              <section className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                <div className="mb-3"><h3 className="text-xs font-semibold">Payment details</h3><p className="mt-0.5 text-[11px] text-muted-foreground">Set amount, currency, and due date.</p></div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="space-y-1.5"><Label htmlFor="invoice-currency" className="text-[11px] font-semibold">Currency</Label><Select value={form.currency} onValueChange={(currency) => setForm({ ...form, currency })}><SelectTrigger id="invoice-currency" className="h-9 bg-background px-2.5 text-sm"><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((currency) => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label htmlFor="invoice-amount" className="text-[11px] font-semibold">Amount</Label><Input id="invoice-amount" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="h-9 bg-background px-2.5 text-sm" /></div>
                  <div className="space-y-1.5"><Label htmlFor="invoice-tax" className="text-[11px] font-semibold">Tax</Label><Input id="invoice-tax" type="number" min="0" step="0.01" value={form.tax_amount} onChange={(e) => setForm({ ...form, tax_amount: Number(e.target.value) })} className="h-9 bg-background px-2.5 text-sm" /></div>
                  <div className="space-y-1.5"><Label htmlFor="invoice-due-date" className="text-[11px] font-semibold">Due date</Label><Input id="invoice-due-date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="h-9 bg-background px-2.5 text-sm" /></div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg border border-border/70 bg-muted/35 px-3.5 py-2.5">
                  <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Total due</p><p className="mt-0.5 text-[10px] text-muted-foreground">Including tax · {form.currency}</p></div>
                  <span className="font-display text-xl font-semibold tracking-tight tabular-nums">{formatCurrency(Number(form.amount || 0) + Number(form.tax_amount || 0), form.currency)}</span>
                </div>
              </section>
              <section className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                <div className="space-y-1.5"><Label htmlFor="invoice-notes" className="text-[11px] font-semibold">Notes <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="invoice-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Payment instructions or a short note..." className="min-h-16 resize-y bg-background text-sm" /></div>
              </section>
            </div>
            <DialogFooter className="shrink-0 gap-2 border-t border-border bg-card px-4 py-3 sm:px-5 sm:space-x-0">
              <Button type="button" variant="outline" onClick={closeDialog} className="h-9">Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="h-9 min-w-32 shadow-sm">{createMutation.isPending || updateMutation.isPending ? 'Saving...' : editing ? 'Save changes' : 'Create invoice'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}