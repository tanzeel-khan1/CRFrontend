import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarDays, CheckCircle2, ClipboardCopy, DollarSign, Mail, MapPin, Pencil, Phone, Plus, RefreshCw, Search, Sparkles, Star, Trash2, UserRound, X } from 'lucide-react';
import { api } from '@/api/apiClient';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CURRENCIES, formatCurrencyCode } from '@/lib/currency';

const CLIENT_STATUSES = ['New', 'Contacted', 'Viewing', 'Negotiating', 'Closed', 'Lost'];
const STATUS_STYLES = {
  New: 'bg-muted text-foreground',
  Contacted: 'bg-secondary text-foreground',
  Viewing: 'border border-border bg-background text-foreground',
  Negotiating: 'bg-foreground/10 text-foreground',
  Closed: 'bg-foreground text-background',
  Lost: 'bg-muted text-muted-foreground',
};
const emptyForm = (currency = 'USD') => ({ name: '', email: '', phone: '', budget: '', currency, address: '', status: 'New', closed_date: '' });
const clientId = (client) => client.id || client._id;

export default function Clients() {
  const { activeCompany } = useOutletContext();
  const companyId = activeCompany?.id || activeCompany?._id;
  const currency = activeCompany?.currency || 'USD';
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(() => emptyForm(currency));
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const { data: clients = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['clients', companyId],
    queryFn: () => api.entities.Client.filter({ company_id: companyId }, '-created_date'),
    enabled: !!companyId,
    initialData: [],
    meta: { handledInComponent: true },
  });
  const { data: feedbackStatuses = [] } = useQuery({
    queryKey: ['feedback-status', companyId],
    queryFn: () => api.feedback.getCompanyStatus(companyId),
    enabled: !!companyId,
    refetchInterval: 30000,
  });
  const feedbackStatusByClient = new Map(
    feedbackStatuses.map((feedback) => [feedback.client_id, feedback.status])
  );
  const pendingFeedbackCount = feedbackStatuses.filter((feedback) => feedback.status === 'pending').length;
  const copyLink = async (url, label) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Unable to copy link. Please copy it from your browser address bar.');
    }
  };

  const visibleClients = clients.filter((client) => {
    const query = search.trim().toLowerCase();
    const matchesFilter = filter === 'All' || (client.status || 'New') === filter;
    const matchesSearch = !query || [client.name, client.email, client.phone, client.address]
      .some((value) => value?.toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: clients.length,
    active: clients.filter((client) => !['Closed', 'Lost'].includes(client.status || 'New')).length,
    closed: clients.filter((client) => client.status === 'Closed').length,
  };
  const pipelineByCurrency = clients.reduce((totals, client) => {
    const clientCurrency = client.currency || currency;
    totals[clientCurrency] = (totals[clientCurrency] || 0) + Number(client.budget || 0);
    return totals;
  }, {});
  const pipelineSummary = Object.entries(pipelineByCurrency)
    .map(([clientCurrency, amount]) => formatCurrencyCode(amount, clientCurrency))
    .join(' · ') || formatCurrencyCode(0, currency);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm(currency));
  };

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? api.entities.Client.update(clientId(editing), data)
      : api.entities.Client.create({ ...data, company_id: companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', companyId] });
      toast.success(editing ? 'Client updated' : 'Client created');
      closeDialog();
    },
    onError: (error) => toast.error(error.message || 'Unable to save client'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', companyId] });
      setDeleteTarget(null);
      toast.success('Client deleted');
    },
    onError: (error) => toast.error(error.message || 'Unable to delete client'),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm(currency));
    setDialogOpen(true);
  };

  const openEdit = (client) => {
    setEditing(client);
    setForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      budget: client.budget ?? '',
      currency: client.currency || currency,
      address: client.address || '',
      status: client.status || 'New',
      closed_date: client.closed_date ? client.closed_date.slice(0, 10) : '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Client name is required');
      return;
    }
    saveMutation.mutate({ ...form, budget: form.budget === '' ? 0 : Number(form.budget) });
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="page-hero">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-background/55"><Sparkles className="h-3.5 w-3.5" /> Client pipeline</div>
            <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Clients</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-background/70">Keep every relationship moving from first contact to closing.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => companyId && copyLink(`${window.location.origin}/reviews/${companyId}`, 'Public feedback page link')} disabled={!companyId} variant="outline" className="w-full gap-2 border-background/20 bg-background/5 text-background hover:bg-background/10 hover:text-background sm:w-auto"><ClipboardCopy className="h-4 w-4" /> Share feedback page</Button>
            <Button onClick={openAdd} variant="secondary" className="w-full gap-2 shadow-sm sm:w-auto"><Plus className="h-4 w-4" /> Add client</Button>
          </div>
        </div>
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[24px] border-background/10" />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[{ label: 'Total clients', value: stats.total, icon: UserRound }, { label: 'Active pipeline', value: stats.active, icon: CheckCircle2 }, { label: 'Closed deals', value: stats.closed, icon: Sparkles }, { label: 'Budget by currency', value: pipelineSummary, icon: DollarSign }].map(({ label, value, icon: Icon }) => (
          <div key={label} className="stat-tile transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background"><Icon className="h-4 w-4" /></div>
            <p className={label === 'Budget by currency' ? 'break-words text-sm font-semibold leading-5 tracking-tight sm:text-base' : 'truncate text-xl font-semibold tracking-tight'} title={String(value)}>{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>
      {pendingFeedbackCount > 0 && (
        <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          {pendingFeedbackCount} client {pendingFeedbackCount === 1 ? 'review is' : 'reviews are'} awaiting platform approval. You can also find the notification in your Activity Log.
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card p-2 shadow-sm sm:p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, phone, or address" className="h-10 border-0 bg-muted/40 pl-9 pr-10 shadow-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring/10 sm:h-11" />
          {search && <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground" aria-label="Clear search"><X className="h-4 w-4" /></button>}
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted/40 p-1">
            {['All', ...CLIENT_STATUSES].map((status) => (
              <Button key={status} size="sm" variant={filter === status ? 'default' : 'ghost'} onClick={() => setFilter(status)} className="h-8 shrink-0 whitespace-nowrap px-3 text-xs">
                {status}
              </Button>
            ))}
          </div>
          <p className="shrink-0 px-1 text-xs text-muted-foreground">{visibleClients.length} of {clients.length} clients</p>
        </div>
      </section>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
          <p className="mt-3 text-sm text-muted-foreground">Loading clients...</p>
        </div>
      ) : isError ? (
        <div role="alert" className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium">Clients couldn’t load</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">{error?.message || 'Check your connection and try again.'}</p>
          <Button onClick={() => refetch()} disabled={isFetching} variant="outline" className="mt-4 gap-2">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Retrying...' : 'Retry'}
          </Button>
        </div>
      ) : visibleClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <UserRound className="h-5 w-5 text-muted-foreground/80" />
          </div>
          <p className="mt-3 text-sm font-medium">No clients found</p>
          <p className="mt-1 text-xs text-muted-foreground">{clients.length ? 'Try adjusting your search or status filter.' : 'Add your first client to start building your pipeline.'}</p>
          {clients.length ? (
            <Button onClick={() => { setSearch(''); setFilter('All'); }} variant="outline" className="mt-4 gap-2">Clear filters</Button>
          ) : (
            <Button onClick={openAdd} variant="outline" className="mt-4 gap-2"><Plus className="h-4 w-4" /> Add your first client</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleClients.map((client) => {
            const status = client.status || 'New';
            const initials = client.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'CL';
            const feedbackStatus = feedbackStatusByClient.get(clientId(client));
            return (
              <article key={clientId(client)} className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-foreground to-foreground/75 text-sm font-semibold tracking-tight text-background shadow-sm ring-1 ring-border/50">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold leading-tight">{client.name}</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">Client record</p>
                    </div>
                  </div>
                  <Badge className={`shrink-0 border-0 shadow-sm ${STATUS_STYLES[status] || STATUS_STYLES.New}`}>{status}</Badge>
                </div>
                <div className="mt-4 min-h-16 space-y-2.5 text-sm text-muted-foreground">
                  {client.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </p>
                  )}
                  {client.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{client.phone}</span>
                    </p>
                  )}
                  {client.address && (
                    <p className="flex items-center gap-2 truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </p>
                  )}
                  {!client.email && !client.phone && !client.address && <p className="text-xs italic">No contact details added</p>}
                </div>
                <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                      {formatCurrencyCode(client.budget || 0, client.currency || currency)}
                    </p>
                    {client.closed_date && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        Closed {new Date(client.closed_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(client)} title="Edit client" aria-label={`Edit ${client.name}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteTarget(client)} title="Delete client" aria-label={`Delete ${client.name}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => copyLink(`${window.location.origin}/feedback/${client.feedback_token}`, 'Client feedback link')}
                    disabled={!client.feedback_token}
                  >
                    <Star className="h-3.5 w-3.5" /> Copy review link
                  </Button>
                  {feedbackStatus && (
                    <Badge variant="outline" className="capitalize">
                      {feedbackStatus === 'pending' ? 'Under review' : feedbackStatus}
                    </Badge>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="flex max-h-[88vh] w-[calc(100%-1rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border border-border/70 bg-background p-0 text-background shadow-[0_24px_80px_-20px_rgba(0,0,0,0.5)]">
          <div className="relative shrink-0 overflow-hidden border-b border-background/10 bg-gradient-to-br from-foreground via-foreground to-foreground/90 px-5 py-4 sm:px-6">
            <div className="pointer-events-none absolute -right-8 -top-14 h-36 w-36 rounded-full border-[18px] border-background/[0.06]" />
            <DialogHeader>
              <div className="relative flex items-center gap-3 pr-8">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-background/15 bg-background/10 text-background shadow-inner"><UserRound className="h-5 w-5" /></div>
                <div>
                  <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-background/55">Client pipeline</p>
                  <DialogTitle className="font-display text-xl tracking-tight text-background">{editing ? 'Edit client' : 'Add client'}</DialogTitle>
                </div>
              </div>
            </DialogHeader>
          </div>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col text-foreground">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/20 px-4 py-4 sm:px-5">
              <section className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                <div className="mb-3"><h3 className="text-xs font-semibold">Contact details</h3><p className="mt-0.5 text-[11px] text-muted-foreground">Add the client’s essential information.</p></div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="client-name" className="text-[11px] font-semibold">Full name <span className="text-destructive">*</span></Label><Input className="h-9 bg-background text-sm" id="client-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Client full name" /></div>
                  <div className="space-y-1.5"><Label htmlFor="client-email" className="text-[11px] font-semibold">Email</Label><Input className="h-9 bg-background text-sm" id="client-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="client@example.com" /></div>
                  <div className="space-y-1.5"><Label htmlFor="client-phone" className="text-[11px] font-semibold">Phone</Label><Input className="h-9 bg-background text-sm" id="client-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" /></div>
                  <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="client-address" className="text-[11px] font-semibold">Address</Label><Input className="h-9 bg-background text-sm" id="client-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, city, region" /></div>
                </div>
              </section>
              <section className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                <div className="mb-3"><h3 className="text-xs font-semibold">Deal profile</h3><p className="mt-0.5 text-[11px] text-muted-foreground">Track the opportunity and its current stage.</p></div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="space-y-1.5"><Label htmlFor="client-currency" className="text-[11px] font-semibold">Currency</Label><Select value={form.currency} onValueChange={(clientCurrency) => setForm({ ...form, currency: clientCurrency })}><SelectTrigger id="client-currency" className="h-9 bg-background text-sm"><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((clientCurrency) => <SelectItem key={clientCurrency} value={clientCurrency}>{clientCurrency}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label htmlFor="client-budget" className="text-[11px] font-semibold">Budget ({form.currency})</Label><Input className="h-9 bg-background text-sm" id="client-budget" type="number" min="0" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0" /></div>
                  <div className="space-y-1.5"><Label className="text-[11px] font-semibold">Status</Label><Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}><SelectTrigger className="h-9 bg-background text-sm"><SelectValue /></SelectTrigger><SelectContent>{CLIENT_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label htmlFor="client-closed-date" className="text-[11px] font-semibold">Closed date</Label><Input className="h-9 bg-background text-sm" id="client-closed-date" type="date" value={form.closed_date} onChange={(e) => setForm({ ...form, closed_date: e.target.value })} /></div>
                </div>
              </section>
            </div>
            <DialogFooter className="shrink-0 gap-2 border-t border-border bg-card px-4 py-3 sm:px-5 sm:space-x-0">
              <Button type="button" variant="outline" onClick={closeDialog} className="h-9">Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending} className="h-9 min-w-32 shadow-sm">{saveMutation.isPending ? 'Saving...' : editing ? 'Save changes' : 'Add client'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.name || 'this client'}
        itemType="client"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(clientId(deleteTarget))}
      />
    </div>
  );
}